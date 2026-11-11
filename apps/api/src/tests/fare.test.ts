import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { createServer } from "../server.js";
import { FareService, DEFAULT_FARE_RULES } from "../services/fare.service.js";
import { RideTier } from "@kekego/shared";
import { UserRole } from "@kekego/database";

describe("Phase 10: Fare Calculation and Pricing Administration Engine", () => {
  let app: FastifyInstance;
  let fareService: FareService;

  let adminToken: string;
  let passengerToken: string;

  beforeAll(async () => {
    app = await createServer();
    await app.ready();

    fareService = new FareService();

    adminToken = app.jwt.sign({
      userId: "u-admin-pricing-001",
      role: UserRole.ADMIN,
      phoneNumber: "+2348099990001",
    });

    passengerToken = app.jwt.sign({
      userId: "u-passenger-pricing-001",
      role: UserRole.PASSENGER,
      phoneNumber: "+2348011110001",
    });
  });

  afterAll(async () => {
    await app.close();
  });

  // --------------------------------------------------------------------------
  // 1. Pure Deterministic Calculation Tests
  // --------------------------------------------------------------------------
  describe("Deterministic Fare Calculation", () => {
    it("should deterministically calculate Standard Keke fare with exact kobo precision", () => {
      const standardRule = DEFAULT_FARE_RULES[RideTier.STANDARD];
      // 5.0 km (5000 meters), 15 minutes (900 seconds)
      const breakdown = fareService.calculateFare({
        distanceMeters: 5000,
        durationSeconds: 900,
        rule: standardRule,
        hasPartner: true,
      });

      // Verification of documented arithmetic:
      // Base fare: 20,000 kobo
      // Distance charge: 5.0 * 7,000 = 35,000 kobo
      // Time charge: 15 * 1,500 = 22,500 kobo
      // Subtotal: 77,500 kobo
      // Minimum fare check: 77,500 >= 25,000 -> Total: 77,500 kobo
      expect(breakdown.currency).toBe("NGN");
      expect(breakdown.tier).toBe(RideTier.STANDARD);
      expect(breakdown.baseFareKobo).toBe(20000);
      expect(breakdown.distanceKm).toBe(5);
      expect(breakdown.distanceChargeKobo).toBe(35000);
      expect(breakdown.durationMinutes).toBe(15);
      expect(breakdown.timeChargeKobo).toBe(22500);
      expect(breakdown.subtotalKobo).toBe(77500);
      expect(breakdown.totalFareKobo).toBe(77500);
      expect(breakdown.surgeMultiplier).toBe(1.0);

      // Revenue Splits:
      // Platform Commission 15%: round(77,500 * 0.15) = 11,625 kobo
      // Partner Share 5%: round(77,500 * 0.05) = 3,875 kobo
      // Driver Net: 77,500 - 11,625 - 3,875 = 62,000 kobo (80%)
      expect(breakdown.platformCommissionKobo).toBe(11625);
      expect(breakdown.partnerCommissionKobo).toBe(3875);
      expect(breakdown.driverEarningsKobo).toBe(62000);

      // Determinism: Repeated invocation produces identical results
      const repeat = fareService.calculateFare({
        distanceMeters: 5000,
        durationSeconds: 900,
        rule: standardRule,
        hasPartner: true,
      });
      expect(repeat).toEqual(breakdown);
    });

    it("should clamp total fare to configured minimum fare when subtotal is below minimum", () => {
      const standardRule = DEFAULT_FARE_RULES[RideTier.STANDARD];
      // Very short trip: 200 meters, 1 minute
      const breakdown = fareService.calculateFare({
        distanceMeters: 200,
        durationSeconds: 60,
        rule: standardRule,
      });

      // Base fare: 20,000 kobo
      // Distance: 0.2 * 7,000 = 1,400 kobo
      // Time: 1 * 1,500 = 1,500 kobo
      // Subtotal: 22,900 kobo
      // Clamped to Minimum Fare: 25,000 kobo!
      expect(breakdown.subtotalKobo).toBe(22900);
      expect(breakdown.minimumFareKobo).toBe(25000);
      expect(breakdown.totalFareKobo).toBe(25000);
      expect(breakdown.totalFareKobo).toBeGreaterThanOrEqual(breakdown.minimumFareKobo);
    });

    it("should calculate Charter Keke tier pricing correctly", () => {
      const charterRule = DEFAULT_FARE_RULES[RideTier.CHARTER];
      // 10.0 km, 25 minutes
      const breakdown = fareService.calculateFare({
        distanceMeters: 10000,
        durationSeconds: 1500,
        rule: charterRule,
        hasPartner: false, // Independent driver: gets 85% after 15% platform fee
      });

      // Base: 50,000 kobo
      // Distance: 10 * 12,000 = 120,000 kobo
      // Time: 25 * 3,000 = 75,000 kobo
      // Subtotal: 50,000 + 120,000 + 75,000 = 245,000 kobo (2,450 NGN)
      expect(breakdown.tier).toBe(RideTier.CHARTER);
      expect(breakdown.baseFareKobo).toBe(50000);
      expect(breakdown.distanceChargeKobo).toBe(120000);
      expect(breakdown.timeChargeKobo).toBe(75000);
      expect(breakdown.totalFareKobo).toBe(245000);
      expect(breakdown.cancellationFeeKobo).toBe(20000);

      // Independent driver: Platform commission = 15% (36,750), Driver = 85% (208,250)
      expect(breakdown.platformCommissionKobo).toBe(36750);
      expect(breakdown.partnerCommissionKobo).toBe(0);
      expect(breakdown.driverEarningsKobo).toBe(208250);
    });

    it("should calculate Cargo / Parcel delivery tier pricing correctly", () => {
      const cargoRule = DEFAULT_FARE_RULES[RideTier.CARGO];
      // 4.5 km, 12 minutes
      const breakdown = fareService.calculateFare({
        distanceMeters: 4500,
        durationSeconds: 720,
        rule: cargoRule,
      });

      // Base: 35,000 kobo
      // Distance: 4.5 * 9,000 = 40,500 kobo
      // Time: 12 * 2,000 = 24,000 kobo
      // Subtotal: 35,000 + 40,500 + 24,000 = 99,500 kobo
      expect(breakdown.tier).toBe(RideTier.CARGO);
      expect(breakdown.baseFareKobo).toBe(35000);
      expect(breakdown.distanceChargeKobo).toBe(40500);
      expect(breakdown.timeChargeKobo).toBe(24000);
      expect(breakdown.totalFareKobo).toBe(99500);
      expect(breakdown.cancellationFeeKobo).toBe(15000);
    });

    it("should handle boundary edge case: 0 distance and 0 duration", () => {
      const standardRule = DEFAULT_FARE_RULES[RideTier.STANDARD];
      const breakdown = fareService.calculateFare({
        distanceMeters: 0,
        durationSeconds: 0,
        rule: standardRule,
      });

      // Minimum 1 min duration, clamped to minimum fare
      expect(breakdown.distanceKm).toBe(0);
      expect(breakdown.durationMinutes).toBe(1);
      expect(breakdown.totalFareKobo).toBe(25000);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Auditable Versioning & Historical Immutability
  // --------------------------------------------------------------------------
  describe("Pricing Versioning & Historical Snapshot Immutability", () => {
    it("should preserve historical fare breakdown snapshot when pricing rules are updated", async () => {
      const rideId = "ride-hist-snapshot-001";
      const ruleV1 = await fareService.getActiveRuleForTier(RideTier.STANDARD);

      // 1. Calculate and save initial trip snapshot under Version 1
      const snapshotV1 = fareService.calculateFare({
        distanceMeters: 4000,
        durationSeconds: 600,
        rule: ruleV1,
      });
      await fareService.saveFareBreakdownSnapshot(rideId, snapshotV1);

      expect(snapshotV1.fareRuleVersion).toBe(ruleV1.version);
      expect(snapshotV1.baseFareKobo).toBe(20000);

      // 2. Admin increases Standard Keke pricing (creates Version 2)
      const ruleV2 = await fareService.setFareRule("u-admin-pricing-001", {
        tier: RideTier.STANDARD,
        baseFareKobo: 30000, // Increased base fare from 200 NGN to 300 NGN
        distanceFarePerKmKobo: 8500, // Increased from 70 NGN to 85 NGN
        timeFarePerMinKobo: 2000,
        minimumFareKobo: 35000,
        cancellationFeeKobo: 12000,
        platformCommissionPercent: 15.0,
        partnerCommissionPercent: 5.0,
      });

      expect(ruleV2.version).toBe(ruleV1.version + 1);
      expect(ruleV2.baseFareKobo).toBe(30000);

      // 3. Active rule is now Version 2
      const currentActive = await fareService.getActiveRuleForTier(RideTier.STANDARD);
      expect(currentActive.version).toBe(ruleV2.version);
      expect(currentActive.baseFareKobo).toBe(30000);

      // 4. CRITICAL ACCEPTANCE CRITERIA: Historical trip snapshot MUST remain unchanged!
      const historicalSnapshot = await fareService.getFareBreakdownSnapshot(rideId);
      expect(historicalSnapshot).toBeDefined();
      expect(historicalSnapshot?.fareRuleVersion).toBe(ruleV1.version);
      expect(historicalSnapshot?.baseFareKobo).toBe(20000); // Unchanged!
      expect(historicalSnapshot?.totalFareKobo).toBe(snapshotV1.totalFareKobo); // Unchanged!
    });
  });

  // --------------------------------------------------------------------------
  // 3. API Endpoints & Administrative Configuration
  // --------------------------------------------------------------------------
  describe("API Endpoints & RBAC Protection", () => {
    it("GET /fare/rules should return active pricing rules for passenger & driver", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/fare/rules",
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThanOrEqual(3);

      const standard = body.data.find((r: { tier: string }) => r.tier === "STANDARD");
      expect(standard).toBeDefined();
      expect(standard.baseFareKobo).toBeDefined();
      expect(standard.minimumFareKobo).toBeDefined();
    });

    it("POST /fare/estimate should calculate fare estimates with spatial geofence validation", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/fare/estimate",
        payload: {
          pickup: {
            latitude: 8.498,
            longitude: 8.518,
            address: "Lafia Modern Market",
          },
          destination: {
            latitude: 8.525,
            longitude: 8.528,
            address: "Federal University of Lafia",
          },
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.distanceMeters).toBeGreaterThan(0);
      expect(body.data.durationSeconds).toBeGreaterThan(0);
      expect(body.data.estimates.length).toBe(3); // Standard, Charter, Cargo
    });

    it("POST /fare/estimate should reject trip outside Nasarawa operating territory", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/fare/estimate",
        payload: {
          pickup: {
            latitude: 6.5244,
            longitude: 3.3792, // Lagos coordinates
          },
          destination: {
            latitude: 8.498,
            longitude: 8.518,
          },
        },
      });

      expect(res.statusCode).toBe(422);
      const body = res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("OUT_OF_SERVICE_AREA");
    });

    it("POST /admin/fare-rules should reject non-admin users with 403 Forbidden", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/admin/fare-rules",
        headers: {
          authorization: `Bearer ${passengerToken}`,
        },
        payload: {
          tier: "STANDARD",
          baseFareKobo: 25000,
          distanceFarePerKmKobo: 7500,
          timeFarePerMinKobo: 1600,
          minimumFareKobo: 30000,
        },
      });

      expect(res.statusCode).toBe(403);
      const body = res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("FORBIDDEN");
    });

    it("POST /admin/fare-rules should reject surgeMultiplier > 1.0 (surge disabled in MVP)", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/admin/fare-rules",
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: {
          tier: "STANDARD",
          baseFareKobo: 25000,
          distanceFarePerKmKobo: 7500,
          timeFarePerMinKobo: 1600,
          minimumFareKobo: 30000,
          surgeMultiplier: 1.5, // Surge unauthorized!
        },
      });

      expect(res.statusCode).toBe(400);
      const body = res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("POST /admin/fare-rules should allow Admin to deploy a new pricing rule version", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/admin/fare-rules",
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: {
          tier: "CARGO",
          baseFareKobo: 40000,
          distanceFarePerKmKobo: 10000,
          timeFarePerMinKobo: 2500,
          minimumFareKobo: 45000,
          cancellationFeeKobo: 18000,
          platformCommissionPercent: 15.0,
          partnerCommissionPercent: 5.0,
        },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.tier).toBe("CARGO");
      expect(body.data.baseFareKobo).toBe(40000);
      expect(body.data.version).toBeGreaterThan(1);
    });

    it("GET /admin/fare-rules should return pricing rules and version history for auditing", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/admin/fare-rules",
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
    });

    it("GET /rides/:id/fare-breakdown should retrieve persisted snapshot for a trip", async () => {
      // Create a test ride snapshot
      const testRideId = "ride-snap-lookup-002";
      const rule = DEFAULT_FARE_RULES[RideTier.STANDARD];
      const breakdown = fareService.calculateFare({
        distanceMeters: 6000,
        durationSeconds: 900,
        rule,
      });
      await fareService.saveFareBreakdownSnapshot(testRideId, breakdown);

      const res = await app.inject({
        method: "GET",
        url: `/rides/${testRideId}/fare-breakdown`,
        headers: {
          authorization: `Bearer ${passengerToken}`,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.currency).toBe("NGN");
      expect(body.data.totalFareKobo).toBe(breakdown.totalFareKobo);
      expect(body.data.platformCommissionKobo).toBe(breakdown.platformCommissionKobo);
    });
  });
});
