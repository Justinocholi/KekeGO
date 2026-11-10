import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { createServer } from "../server.js";
import {
  DispatchService,
  IN_MEMORY_ACTIVE_RIDES,
  IN_MEMORY_DRIVER_STATES,
  IN_MEMORY_DISPATCH_ATTEMPTS,
} from "../services/dispatch.service.js";
import {
  UserRole,
  RideTier,
  RideStatus,
  DriverAvailabilityStatus,
  DriverVerificationStatus,
} from "@kekego/database";

describe("Phase 8: Driver Matching and Dispatch Engine", () => {
  let app: FastifyInstance;
  let dispatchService: DispatchService;

  beforeAll(async () => {
    app = await createServer();
    await app.ready();
    dispatchService = new DispatchService();
  });

  afterAll(async () => {
    await app.close();
  });

  // --------------------------------------------------------------------------
  // 1. Proximity, Verification & Tier Eligibility Search
  // --------------------------------------------------------------------------
  describe("Driver Proximity & Tier Eligibility Search", () => {
    it("should find verified online drivers within search radius in Nasarawa", async () => {
      // Lafia Modern Market coordinates
      const drivers = await dispatchService.findNearbyDrivers({
        latitude: 8.498,
        longitude: 8.518,
        radiusMeters: 3500,
        tier: RideTier.STANDARD,
      });

      expect(drivers.length).toBeGreaterThan(0);
      const top = drivers[0];
      expect(top).toBeDefined();
      expect(top?.distanceMeters).toBeLessThanOrEqual(3500);
      expect(top?.firstName).toBeDefined();
    });

    it("should filter drivers by tier eligibility for Keke Charter", async () => {
      const drivers = await dispatchService.findNearbyDrivers({
        latitude: 8.498,
        longitude: 8.518,
        radiusMeters: 5000,
        tier: RideTier.CHARTER,
      });

      // Charter requires driver rating >= 4.4 and trips >= 5
      for (const d of drivers) {
        expect(d.rating).toBeGreaterThanOrEqual(4.4);
        expect(d.totalTrips).toBeGreaterThanOrEqual(5);
      }
    });

    it("should return empty list when searching outside Nasarawa territory", async () => {
      const drivers = await dispatchService.findNearbyDrivers({
        latitude: 6.5244, // Lagos, Nigeria
        longitude: 3.3792,
        radiusMeters: 5000,
      });

      expect(drivers.length).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Driver Ranking Algorithm
  // --------------------------------------------------------------------------
  describe("Driver Ranking Algorithm", () => {
    it("should compute composite score with highest weight on proximity", () => {
      // Driver A: 500m away, rating 4.9, 98% acceptance
      const scoreA = dispatchService.calculateDriverRankingScore(500, 4.9, 98.0);

      // Driver B: 4000m away, rating 4.9, 98% acceptance
      const scoreB = dispatchService.calculateDriverRankingScore(4000, 4.9, 98.0);

      expect(scoreA).toBeGreaterThan(scoreB);
    });

    it("should break proximity ties using rating and acceptance rate", () => {
      // Both 1000m away, but Driver A has higher rating
      const scoreHighRating = dispatchService.calculateDriverRankingScore(1000, 4.9, 95.0);
      const scoreLowRating = dispatchService.calculateDriverRankingScore(1000, 4.2, 95.0);

      expect(scoreHighRating).toBeGreaterThan(scoreLowRating);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Public Anonymized Nearby Drivers Endpoint (GET /rides/nearby-drivers)
  // --------------------------------------------------------------------------
  describe("GET /rides/nearby-drivers", () => {
    it("should return sanitized driver coordinates without PII", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/rides/nearby-drivers?latitude=8.498&longitude=8.518&radiusMeters=3500",
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);

      if (body.data.length > 0) {
        const item = body.data[0];
        expect(item.id).toBeDefined();
        expect(item.latitude).toBeDefined();
        expect(item.longitude).toBeDefined();
        // Ensure no phone numbers or personal names are leaked
        expect(item.phoneNumber).toBeUndefined();
        expect(item.firstName).toBeUndefined();
      }
    });

    it("should reject missing coordinates with 400 validation error", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/rides/nearby-drivers",
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  // --------------------------------------------------------------------------
  // 4. Dispatch Initiation & Expiration Cycle
  // --------------------------------------------------------------------------
  describe("Dispatch Lifecycle & Timeouts", () => {
    const testRideId = "r-dispatch-test-001";

    beforeAll(() => {
      dispatchService.seedMockRide({
        id: testRideId,
        rideNumber: "KKE-202611-TEST1",
        status: RideStatus.SEARCHING,
        tier: RideTier.STANDARD,
        driverId: null,
        pickup: { latitude: 8.498, longitude: 8.518, address: "Lafia Modern Market" },
        destination: { latitude: 8.525, longitude: 8.528, address: "University of Lafia" },
        startOtp: "5678",
        estimatedFareKobo: 50000,
        passenger: { name: "Fatima Garba", phoneNumber: "+2348012345678", rating: 4.8 },
      });
    });

    it("should initiate dispatch and target top candidate with 15s timeout", async () => {
      const dispatchResult = await dispatchService.dispatchRide(testRideId);

      expect(dispatchResult.status).toBe("DISPATCHED");
      expect(dispatchResult.targetDriverId).toBeDefined();
      expect(dispatchResult.timeoutSeconds).toBe(15);
      expect(dispatchResult.attemptCount).toBe(1);

      const history = await dispatchService.getDispatchHistory(testRideId);
      expect(history.length).toBe(1);
      expect(history[0]?.status).toBe("PENDING");
    });

    it("should handle driver response timeout and cascade to next candidate", async () => {
      const history = await dispatchService.getDispatchHistory(testRideId);
      const activeAttempt = history.find((a) => a.status === "PENDING");
      expect(activeAttempt).toBeDefined();

      if (activeAttempt) {
        // Driver fails to respond in 15 seconds -> expires
        const nextDispatch = await dispatchService.handleDispatchTimeout(
          testRideId,
          activeAttempt.driverId
        );

        expect(activeAttempt.status).toBe("EXPIRED");
        expect(nextDispatch.attemptCount).toBe(2);
      }
    });

    it("should handle driver explicit rejection and cascade to next candidate", async () => {
      const history = await dispatchService.getDispatchHistory(testRideId);
      const pendingAttempt = history.find((a) => a.status === "PENDING");
      expect(pendingAttempt).toBeDefined();

      if (pendingAttempt) {
        const nextDispatch = await dispatchService.rejectDispatch(
          testRideId,
          pendingAttempt.driverId,
          "TRAFFIC_JAM",
          "Stuck at stadium roundabout"
        );

        expect(pendingAttempt.status).toBe("REJECTED");
        expect(pendingAttempt.reason).toContain("TRAFFIC_JAM");
        expect(nextDispatch.attemptCount).toBe(3);
      }
    });
  });

  // --------------------------------------------------------------------------
  // 5. Atomic Driver Assignment & Concurrency Safety
  // --------------------------------------------------------------------------
  describe("Atomic Assignment & Concurrency Protections", () => {
    it("should atomically assign ride exactly once", async () => {
      const rideId = "r-atomic-single-001";
      const driverId = "d0000000-0000-0000-0000-000000000001";

      dispatchService.seedMockRide({
        id: rideId,
        rideNumber: "KKE-202611-ATOMIC1",
        status: RideStatus.SEARCHING,
        tier: RideTier.STANDARD,
        driverId: null,
        pickup: { latitude: 8.498, longitude: 8.518, address: "Lafia" },
        destination: { latitude: 8.525, longitude: 8.528, address: "Polytechnic" },
        startOtp: "9988",
        estimatedFareKobo: 45000,
        passenger: { name: "Aliyu Bello", phoneNumber: "+2348022223333", rating: 5.0 },
      });

      dispatchService.seedMockDriver({
        driverId,
        userId: "u-driver-atomic-1",
        verificationStatus: DriverVerificationStatus.VERIFIED,
        availabilityStatus: DriverAvailabilityStatus.ONLINE,
        activeRideId: null,
      });

      const assigned = await dispatchService.acceptDispatch(rideId, driverId);

      expect(assigned.id).toBe(rideId);
      expect(assigned.status).toBe(RideStatus.DRIVER_ASSIGNED);

      // Verify driver state is now BUSY
      const driverState = IN_MEMORY_DRIVER_STATES.get(driverId);
      expect(driverState?.availabilityStatus).toBe(DriverAvailabilityStatus.BUSY);
      expect(driverState?.activeRideId).toBe(rideId);
    });

    it("should prevent double assignment when 2 drivers accept the same ride concurrently", async () => {
      const rideId = "r-concurrency-race-001";
      const driverA = "d0000000-0000-0000-0000-000000000001";
      const driverB = "d0000000-0000-0000-0000-000000000002";

      dispatchService.seedMockRide({
        id: rideId,
        rideNumber: "KKE-202611-RACE1",
        status: RideStatus.SEARCHING,
        tier: RideTier.STANDARD,
        driverId: null,
        pickup: { latitude: 8.498, longitude: 8.518, address: "Lafia Market" },
        destination: { latitude: 8.525, longitude: 8.528, address: "Lafia Town" },
        startOtp: "1122",
        estimatedFareKobo: 35000,
        passenger: { name: "Zainab Umar", phoneNumber: "+2348044445555", rating: 4.9 },
      });

      dispatchService.seedMockDriver({
        driverId: driverA,
        userId: "u-driver-race-a",
        verificationStatus: DriverVerificationStatus.VERIFIED,
        availabilityStatus: DriverAvailabilityStatus.ONLINE,
        activeRideId: null,
      });

      dispatchService.seedMockDriver({
        driverId: driverB,
        userId: "u-driver-race-b",
        verificationStatus: DriverVerificationStatus.VERIFIED,
        availabilityStatus: DriverAvailabilityStatus.ONLINE,
        activeRideId: null,
      });

      // Concurrent execution simulating network collision
      const results = await Promise.allSettled([
        dispatchService.acceptDispatch(rideId, driverA),
        dispatchService.acceptDispatch(rideId, driverB),
      ]);

      const fulfilled = results.filter((r) => r.status === "fulfilled");
      const rejected = results.filter((r) => r.status === "rejected");

      // Exactly ONE driver must win the assignment
      expect(fulfilled.length).toBe(1);
      // The other must be rejected with 409 RIDE_ALREADY_ASSIGNED
      expect(rejected.length).toBe(1);

      const rejectedReason = (rejected[0] as PromiseRejectedResult).reason;
      expect(rejectedReason.statusCode).toBe(409);
      expect(rejectedReason.code).toBe("RIDE_ALREADY_ASSIGNED");
    });

    it("should prevent a driver from being assigned to 2 different rides simultaneously", async () => {
      const driverId = "d0000000-0000-0000-0000-000000000003";
      const rideX = "r-driver-busy-001";
      const rideY = "r-driver-busy-002";

      dispatchService.seedMockDriver({
        driverId,
        userId: "u-driver-busy-single",
        verificationStatus: DriverVerificationStatus.VERIFIED,
        availabilityStatus: DriverAvailabilityStatus.ONLINE,
        activeRideId: null,
      });

      dispatchService.seedMockRide({
        id: rideX,
        rideNumber: "KKE-202611-BUSYX",
        status: RideStatus.SEARCHING,
        tier: RideTier.STANDARD,
        driverId: null,
        pickup: { latitude: 8.852, longitude: 7.872, address: "Keffi Market" },
        destination: { latitude: 8.87, longitude: 7.89, address: "Nasarawa State University" },
        startOtp: "3344",
        estimatedFareKobo: 40000,
        passenger: { name: "Emeka Obi", phoneNumber: "+2348055556666", rating: 4.7 },
      });

      dispatchService.seedMockRide({
        id: rideY,
        rideNumber: "KKE-202611-BUSYY",
        status: RideStatus.SEARCHING,
        tier: RideTier.STANDARD,
        driverId: null,
        pickup: { latitude: 8.852, longitude: 7.872, address: "Keffi Market" },
        destination: { latitude: 8.88, longitude: 7.91, address: "Total Filling Station" },
        startOtp: "5566",
        estimatedFareKobo: 45000,
        passenger: { name: "Kabiru Danladi", phoneNumber: "+2348077778888", rating: 4.8 },
      });

      // Driver attempts to accept both Ride X and Ride Y concurrently
      const results = await Promise.allSettled([
        dispatchService.acceptDispatch(rideX, driverId),
        dispatchService.acceptDispatch(rideY, driverId),
      ]);

      const fulfilled = results.filter((r) => r.status === "fulfilled");
      const rejected = results.filter((r) => r.status === "rejected");

      // Exactly ONE trip can be accepted by the driver
      expect(fulfilled.length).toBe(1);
      // The second attempt must fail with 409 DRIVER_ALREADY_COMMITTED
      expect(rejected.length).toBe(1);

      const rejectedReason = (rejected[0] as PromiseRejectedResult).reason;
      expect(rejectedReason.statusCode).toBe(409);
      expect(rejectedReason.code).toBe("DRIVER_ALREADY_COMMITTED");
    });
  });

  // --------------------------------------------------------------------------
  // 6. No-Driver-Found Handling
  // --------------------------------------------------------------------------
  describe("No-Driver-Found Terminal State", () => {
    it("should mark ride as NO_DRIVER_FOUND when all candidate drivers are exhausted", async () => {
      const lonelyRideId = "r-no-driver-test-001";

      dispatchService.seedMockRide({
        id: lonelyRideId,
        rideNumber: "KKE-202611-EXHAUST1",
        status: RideStatus.SEARCHING,
        tier: RideTier.STANDARD,
        driverId: null,
        pickup: { latitude: 8.498, longitude: 8.518, address: "Isolated Location" },
        destination: { latitude: 8.525, longitude: 8.528, address: "Destination" },
        startOtp: "0000",
        estimatedFareKobo: 60000,
        passenger: { name: "Test Passenger", phoneNumber: "+2348099990000", rating: 4.5 },
      });

      // Seed attempts for all 3 mock drivers as REJECTED so no eligible candidates remain
      IN_MEMORY_DISPATCH_ATTEMPTS.set(lonelyRideId, [
        {
          id: "d-att-1",
          rideId: lonelyRideId,
          driverId: "d0000000-0000-0000-0000-000000000001",
          status: "REJECTED",
          dispatchedAt: new Date(),
          expiresAt: new Date(),
        },
        {
          id: "d-att-2",
          rideId: lonelyRideId,
          driverId: "d0000000-0000-0000-0000-000000000002",
          status: "REJECTED",
          dispatchedAt: new Date(),
          expiresAt: new Date(),
        },
        {
          id: "d-att-3",
          rideId: lonelyRideId,
          driverId: "d0000000-0000-0000-0000-000000000003",
          status: "REJECTED",
          dispatchedAt: new Date(),
          expiresAt: new Date(),
        },
      ]);

      const result = await dispatchService.dispatchRide(lonelyRideId, { radiusMeters: 8000 });

      expect(result.status).toBe("NO_DRIVER_FOUND");
      const inMem = IN_MEMORY_ACTIVE_RIDES.get(lonelyRideId);
      expect(inMem?.status).toBe(RideStatus.NO_DRIVER_FOUND);
    });
  });

  // --------------------------------------------------------------------------
  // 7. Admin Active Dispatch Monitor Endpoint
  // --------------------------------------------------------------------------
  describe("GET /admin/dispatch/active", () => {
    it("should allow ADMIN to retrieve active dispatch queue", async () => {
      const adminToken = app.jwt.sign({
        userId: "admin-uuid-1",
        phoneNumber: "+2348099999999",
        role: UserRole.ADMIN,
      });

      const response = await app.inject({
        method: "GET",
        url: "/admin/dispatch/active",
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it("should reject passenger role with 403", async () => {
      const passengerToken = app.jwt.sign({
        userId: "passenger-uuid-1",
        phoneNumber: "+2348011111111",
        role: UserRole.PASSENGER,
      });

      const response = await app.inject({
        method: "GET",
        url: "/admin/dispatch/active",
        headers: {
          authorization: `Bearer ${passengerToken}`,
        },
      });

      expect(response.statusCode).toBe(403);
    });
  });
});
