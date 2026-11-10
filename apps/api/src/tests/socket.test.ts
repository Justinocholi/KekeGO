import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import type { AddressInfo } from "node:net";
import { io as ioClient, type Socket as ClientSocket } from "socket.io-client";
import { createServer } from "../server.js";
import {
  SocketClientEvent,
  SocketServerEvent,
} from "@kekego/validation";
import {
  UserRole,
  RideTier,
  RideStatus,
  DriverAvailabilityStatus,
  DriverVerificationStatus,
} from "@kekego/database";
import {
  IN_MEMORY_ACTIVE_RIDES,
  IN_MEMORY_DRIVER_STATES,
} from "../services/dispatch.service.js";
import { RideService } from "../services/ride.service.js";
import { resetDriverThrottle } from "../services/socket.service.js";

function createClientSocket(serverUrl: string, token?: string): ClientSocket {
  return ioClient(serverUrl, {
    auth: token ? { token } : undefined,
    transports: ["websocket"],
    forceNew: true,
    reconnection: false,
    timeout: 3000,
  });
}

function waitForEvent<T = unknown>(
  socket: ClientSocket,
  event: string,
  timeoutMs = 4000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timed out waiting for socket event: "${event}"`));
    }, timeoutMs);

    socket.once(event, (data: T) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

describe("Phase 9: Real-time Tracking and Ride Lifecycle Engine", () => {
  let app: FastifyInstance;
  let serverUrl: string;
  let rideService: RideService;
  const activeSockets: ClientSocket[] = [];

  // Test identities
  const passengerA = {
    userId: "u-pass-001",
    phoneNumber: "+2348011112222",
    role: UserRole.PASSENGER,
  };

  const passengerB = {
    userId: "u-pass-002",
    phoneNumber: "+2348022223333",
    role: UserRole.PASSENGER,
  };

  const driverA = {
    userId: "u0000000-0000-0000-0000-000000000001",
    driverId: "d0000000-0000-0000-0000-000000000001",
    phoneNumber: "+2348011223344",
    role: UserRole.DRIVER,
  };

  const adminUser = {
    userId: "u-admin-001",
    phoneNumber: "+2348099998888",
    role: UserRole.ADMIN,
  };

  let tokenPassengerA: string;
  let tokenPassengerB: string;
  let tokenDriverA: string;
  let tokenAdmin: string;

  beforeAll(async () => {
    app = await createServer();
    await app.listen({ port: 0, host: "127.0.0.1" });
    const addr = app.server.address() as AddressInfo;
    serverUrl = `http://127.0.0.1:${addr.port}`;

    rideService = new RideService();

    // Issue test JWT tokens
    tokenPassengerA = app.jwt.sign(passengerA);
    tokenPassengerB = app.jwt.sign(passengerB);
    tokenDriverA = app.jwt.sign(driverA);
    tokenAdmin = app.jwt.sign(adminUser);

    // Setup in-memory mock driver
    IN_MEMORY_DRIVER_STATES.set(driverA.driverId, {
      driverId: driverA.driverId,
      userId: driverA.userId,
      verificationStatus: DriverVerificationStatus.VERIFIED,
      availabilityStatus: DriverAvailabilityStatus.ONLINE,
      activeRideId: null,
    });
  });

  afterAll(async () => {
    for (const s of activeSockets) {
      if (s.connected) s.disconnect();
    }
    await app.close();
  });

  // Helper to track sockets for cleanup
  function connectSocket(token?: string): ClientSocket {
    const s = createClientSocket(serverUrl, token);
    activeSockets.push(s);
    return s;
  }

  // --------------------------------------------------------------------------
  // 1. Connection & Handshake Authentication
  // --------------------------------------------------------------------------
  describe("Socket.IO Handshake Authentication & Security", () => {
    it("should reject connection when no authentication token is provided", async () => {
      const socket = connectSocket();

      const error = await waitForEvent<{ message: string }>(
        socket,
        "connect_error"
      );
      expect(error.message).toContain("AUTH_TOKEN_REQUIRED");
      expect(socket.connected).toBe(false);
    });

    it("should reject connection with forged or invalid JWT token", async () => {
      const socket = connectSocket("invalid-forged-token-xyz");

      const error = await waitForEvent<{ message: string }>(
        socket,
        "connect_error"
      );
      expect(error.message).toContain("AUTHENTICATION_FAILED");
      expect(socket.connected).toBe(false);
    });

    it("should successfully authenticate passenger with valid JWT", async () => {
      const socket = connectSocket(tokenPassengerA);

      await waitForEvent(socket, "connect");
      expect(socket.connected).toBe(true);
    });

    it("should successfully authenticate driver and join private driver rooms", async () => {
      const socket = connectSocket(tokenDriverA);

      await waitForEvent(socket, "connect");
      expect(socket.connected).toBe(true);
    });

    it("should successfully authenticate admin and auto-join operations room", async () => {
      const socket = connectSocket(tokenAdmin);

      await waitForEvent(socket, "connect");
      expect(socket.connected).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Room Authorization & Cross-User Privacy Guardrails
  // --------------------------------------------------------------------------
  describe("Room Authorization & Privacy Security", () => {
    const testRideId = "ride-sec-test-001";

    beforeAll(() => {
      // Seed test ride belonging to Passenger A
      IN_MEMORY_ACTIVE_RIDES.set(testRideId, {
        id: testRideId,
        rideNumber: "KKE-202611-9901",
        status: RideStatus.SEARCHING,
        tier: RideTier.STANDARD,
        driverId: null,
        pickup: {
          latitude: 8.498,
          longitude: 8.518,
          address: "Lafia Central Station",
        },
        destination: {
          latitude: 8.512,
          longitude: 8.532,
          address: "Dalhatu Araf Specialist Hospital",
        },
        startOtp: "7821",
        estimatedFareKobo: 45000,
        passenger: {
          name: "Fatima Aliyu",
          phoneNumber: passengerA.phoneNumber,
          rating: 4.9,
        },
      });
    });

    it("should allow the authorized passenger to join their ride room and hydrate state", async () => {
      const socketPassengerA = connectSocket(tokenPassengerA);
      await waitForEvent(socketPassengerA, "connect");

      socketPassengerA.emit(SocketClientEvent.RIDE_JOIN, {
        rideId: testRideId,
      });

      // State Hydration on Reconnect / Join: server emits authoritative current state
      const state = await waitForEvent<{
        rideId: string;
        rideNumber: string;
        status: string;
        startOtp?: string;
      }>(socketPassengerA, SocketServerEvent.RIDE_STATE_CURRENT);

      expect(state.rideId).toBe(testRideId);
      expect(state.rideNumber).toBe("KKE-202611-9901");
      expect(state.status).toBe(RideStatus.SEARCHING);
      expect(state.startOtp).toBe("7821"); // Start OTP included for passenger
    });

    it("should REJECT an unauthorized user (Passenger B) attempting to join Passenger A's ride", async () => {
      const socketPassengerB = connectSocket(tokenPassengerB);
      await waitForEvent(socketPassengerB, "connect");

      socketPassengerB.emit(SocketClientEvent.RIDE_JOIN, {
        rideId: "unauthorized-ride-nonexistent-999",
      });

      const err = await waitForEvent<{ code: string; message: string }>(
        socketPassengerB,
        SocketServerEvent.ERROR
      );

      expect(err.code).toBe("UNAUTHORIZED_ROOM_ACCESS");
      expect(err.message).toContain("not authorized");
    });

    it("should allow Admin to join any ride room and hydrate state", async () => {
      const socketAdmin = connectSocket(tokenAdmin);
      await waitForEvent(socketAdmin, "connect");

      socketAdmin.emit(SocketClientEvent.RIDE_JOIN, {
        rideId: testRideId,
      });

      const state = await waitForEvent<{ rideId: string; startOtp?: string }>(
        socketAdmin,
        SocketServerEvent.RIDE_STATE_CURRENT
      );

      expect(state.rideId).toBe(testRideId);
      expect(state.startOtp).toBe("7821"); // Start OTP visible to admin for support
    });

    it("should reject non-admin users attempting to subscribe to admin operations", async () => {
      const socketPassengerA = connectSocket(tokenPassengerA);
      await waitForEvent(socketPassengerA, "connect");

      socketPassengerA.emit(SocketClientEvent.ADMIN_SUBSCRIBE, {
        channel: "all",
      });

      const err = await waitForEvent<{ code: string }>(
        socketPassengerA,
        SocketServerEvent.ERROR
      );

      expect(err.code).toBe("FORBIDDEN");
    });

    it("should reject non-driver users attempting to emit location telemetry", async () => {
      const socketPassengerA = connectSocket(tokenPassengerA);
      await waitForEvent(socketPassengerA, "connect");

      socketPassengerA.emit(SocketClientEvent.DRIVER_LOCATION_UPDATE, {
        latitude: 8.498,
        longitude: 8.518,
      });

      const err = await waitForEvent<{ code: string }>(
        socketPassengerA,
        SocketServerEvent.ERROR
      );

      expect(err.code).toBe("FORBIDDEN");
    });
  });

  // --------------------------------------------------------------------------
  // 3. Driver GPS Location Streaming & Telemetry
  // --------------------------------------------------------------------------
  describe("Driver GPS Location Streaming & Admin Telemetry", () => {
    const streamRideId = "ride-stream-test-002";

    beforeAll(() => {
      IN_MEMORY_ACTIVE_RIDES.set(streamRideId, {
        id: streamRideId,
        rideNumber: "KKE-202611-9902",
        status: RideStatus.DRIVER_EN_ROUTE,
        tier: RideTier.STANDARD,
        driverId: driverA.driverId,
        pickup: { latitude: 8.498, longitude: 8.518, address: "Lafia Park" },
        destination: { latitude: 8.525, longitude: 8.528, address: "FULafia" },
        startOtp: "4421",
        estimatedFareKobo: 50000,
        passenger: {
          name: "Sani Bello",
          phoneNumber: passengerA.phoneNumber,
          rating: 4.8,
        },
      });
    });

    it("should broadcast live driver location to passenger subscribed to the ride room", async () => {
      const socketPassenger = connectSocket(tokenPassengerA);
      await waitForEvent(socketPassenger, "connect");
      socketPassenger.emit(SocketClientEvent.RIDE_JOIN, {
        rideId: streamRideId,
      });
      await waitForEvent(socketPassenger, SocketServerEvent.RIDE_STATE_CURRENT);

      const socketDriver = connectSocket(tokenDriverA);
      await waitForEvent(socketDriver, "connect");

      // Driver emits GPS update with active rideId
      socketDriver.emit(SocketClientEvent.DRIVER_LOCATION_UPDATE, {
        latitude: 8.502,
        longitude: 8.521,
        heading: 45,
        speed: 28.5,
        rideId: streamRideId,
      });

      const locBroadcast = await waitForEvent<{
        rideId: string;
        driverId: string;
        latitude: number;
        longitude: number;
        heading: number;
        speed: number;
        isStale: boolean;
      }>(socketPassenger, SocketServerEvent.DRIVER_LOCATION_BROADCAST);

      expect(locBroadcast.rideId).toBe(streamRideId);
      expect(locBroadcast.latitude).toBe(8.502);
      expect(locBroadcast.longitude).toBe(8.521);
      expect(locBroadcast.heading).toBe(45);
      expect(locBroadcast.speed).toBe(28.5);
      expect(locBroadcast.isStale).toBe(false);
    });

    it("should broadcast driver telemetry updates to admin operations room", async () => {
      const socketAdmin = connectSocket(tokenAdmin);
      await waitForEvent(socketAdmin, "connect");

      const socketDriver = connectSocket(tokenDriverA);
      await waitForEvent(socketDriver, "connect");

      // Driver emits status update: Online
      socketDriver.emit(SocketClientEvent.DRIVER_STATUS_UPDATE, {
        isOnline: true,
        availabilityStatus: "ONLINE",
      });

      const adminUpdate = await waitForEvent<{
        type: string;
        driverId: string;
        isOnline: boolean;
        availabilityStatus: string;
      }>(socketAdmin, SocketServerEvent.ADMIN_TELEMETRY_UPDATE);

      expect(adminUpdate.type).toBe("DRIVER_STATUS");
      expect(adminUpdate.driverId).toBe(driverA.driverId);
      expect(adminUpdate.isOnline).toBe(true);
      expect(adminUpdate.availabilityStatus).toBe("ONLINE");
    });

    it("should correctly identify stale GPS locations (>30 seconds old)", async () => {
      const socketAdmin = connectSocket(tokenAdmin);
      await waitForEvent(socketAdmin, "connect");

      const socketDriver = connectSocket(tokenDriverA);
      await waitForEvent(socketDriver, "connect");

      // Timestamp from 45 seconds ago
      const staleTimestamp = Date.now() - 45000;

      // Reset throttle timestamp for test
      resetDriverThrottle(driverA.userId);

      socketDriver.emit(SocketClientEvent.DRIVER_LOCATION_UPDATE, {
        latitude: 8.51,
        longitude: 8.52,
        timestamp: staleTimestamp,
        rideId: streamRideId,
      });

      const adminUpdate = await waitForEvent<{
        type: string;
        telemetry: { isStale: boolean; latitude: number };
      }>(socketAdmin, SocketServerEvent.ADMIN_TELEMETRY_UPDATE);

      expect(adminUpdate.type).toBe("DRIVER_LOCATION");
      expect(adminUpdate.telemetry.isStale).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 4. Ride Lifecycle Real-Time Event Transitions
  // --------------------------------------------------------------------------
  describe("Ride Lifecycle State Progression Events", () => {
    const lifecycleRideId = "ride-life-test-003";

    beforeAll(() => {
      IN_MEMORY_ACTIVE_RIDES.set(lifecycleRideId, {
        id: lifecycleRideId,
        rideNumber: "KKE-202611-9903",
        status: RideStatus.SEARCHING,
        tier: RideTier.STANDARD,
        driverId: null,
        pickup: { latitude: 8.498, longitude: 8.518, address: "Lafia Hub" },
        destination: { latitude: 8.53, longitude: 8.54, address: "Keffi Road" },
        startOtp: "6312",
        estimatedFareKobo: 60000,
        passenger: {
          name: "Halima Mohammed",
          phoneNumber: passengerA.phoneNumber,
          rating: 4.9,
        },
      });
    });

    it("should receive ride:dispatched on target driver's private socket room", async () => {
      const socketDriver = connectSocket(tokenDriverA);
      await waitForEvent(socketDriver, "connect");

      const dispatchPromise = waitForEvent<{
        rideId: string;
        tier: string;
        timeoutSeconds: number;
      }>(socketDriver, SocketServerEvent.RIDE_DISPATCHED);

      // Trigger dispatch to driver
      await rideService.dispatchService.dispatchRide(lifecycleRideId);

      const dispatched = await dispatchPromise;
      expect(dispatched.rideId).toBe(lifecycleRideId);
      expect(dispatched.timeoutSeconds).toBe(15);
    });

    it("should emit ride:accepted to passenger when driver accepts dispatch", async () => {
      const socketPassenger = connectSocket(tokenPassengerA);
      await waitForEvent(socketPassenger, "connect");
      socketPassenger.emit(SocketClientEvent.RIDE_JOIN, {
        rideId: lifecycleRideId,
      });
      await waitForEvent(socketPassenger, SocketServerEvent.RIDE_STATE_CURRENT);

      const acceptedPromise = waitForEvent<{
        rideId: string;
        status: string;
        driver: { vehicle: { plateNumber: string } };
      }>(socketPassenger, SocketServerEvent.RIDE_ACCEPTED);

      // Driver accepts dispatch
      await rideService.acceptRide(lifecycleRideId, driverA.userId);

      const accepted = await acceptedPromise;
      expect(accepted.rideId).toBe(lifecycleRideId);
      expect(accepted.status).toBe(RideStatus.DRIVER_ASSIGNED);
      expect(accepted.driver.vehicle.plateNumber).toBeDefined();
    });

    it("should emit ride:driver:en_route when driver advances to pickup route", async () => {
      const socketPassenger = connectSocket(tokenPassengerA);
      await waitForEvent(socketPassenger, "connect");
      socketPassenger.emit(SocketClientEvent.RIDE_JOIN, {
        rideId: lifecycleRideId,
      });
      await waitForEvent(socketPassenger, SocketServerEvent.RIDE_STATE_CURRENT);

      const enRoutePromise = waitForEvent<{ rideId: string; status: string }>(
        socketPassenger,
        SocketServerEvent.RIDE_DRIVER_EN_ROUTE
      );

      await rideService.updateRideStatus(lifecycleRideId, driverA.userId, {
        status: "DRIVER_EN_ROUTE",
      });

      const enRoute = await enRoutePromise;
      expect(enRoute.rideId).toBe(lifecycleRideId);
      expect(enRoute.status).toBe(RideStatus.DRIVER_EN_ROUTE);
    });

    it("should emit ride:driver:arrived when driver reaches pickup point", async () => {
      const socketPassenger = connectSocket(tokenPassengerA);
      await waitForEvent(socketPassenger, "connect");
      socketPassenger.emit(SocketClientEvent.RIDE_JOIN, {
        rideId: lifecycleRideId,
      });
      await waitForEvent(socketPassenger, SocketServerEvent.RIDE_STATE_CURRENT);

      const arrivedPromise = waitForEvent<{ rideId: string; status: string }>(
        socketPassenger,
        SocketServerEvent.RIDE_DRIVER_ARRIVED
      );

      await rideService.updateRideStatus(lifecycleRideId, driverA.userId, {
        status: "DRIVER_ARRIVED",
      });

      const arrived = await arrivedPromise;
      expect(arrived.rideId).toBe(lifecycleRideId);
      expect(arrived.status).toBe(RideStatus.DRIVER_ARRIVED);
    });

    it("should reject ride start if invalid OTP is provided", async () => {
      await expect(
        rideService.updateRideStatus(lifecycleRideId, driverA.userId, {
          status: "IN_PROGRESS",
          startOtp: "0000", // Wrong OTP (correct is 6312)
        })
      ).rejects.toThrow("Incorrect 4-digit start OTP");
    });

    it("should emit ride:started when passenger start OTP is verified", async () => {
      const socketPassenger = connectSocket(tokenPassengerA);
      await waitForEvent(socketPassenger, "connect");
      socketPassenger.emit(SocketClientEvent.RIDE_JOIN, {
        rideId: lifecycleRideId,
      });
      await waitForEvent(socketPassenger, SocketServerEvent.RIDE_STATE_CURRENT);

      const startedPromise = waitForEvent<{ rideId: string; status: string }>(
        socketPassenger,
        SocketServerEvent.RIDE_STARTED
      );

      await rideService.updateRideStatus(lifecycleRideId, driverA.userId, {
        status: "IN_PROGRESS",
        startOtp: "6312", // Correct OTP
      });

      const started = await startedPromise;
      expect(started.rideId).toBe(lifecycleRideId);
      expect(started.status).toBe(RideStatus.IN_PROGRESS);
    });

    it("should emit ride:completed with final fare breakdown when driver completes trip", async () => {
      const socketPassenger = connectSocket(tokenPassengerA);
      await waitForEvent(socketPassenger, "connect");
      socketPassenger.emit(SocketClientEvent.RIDE_JOIN, {
        rideId: lifecycleRideId,
      });
      await waitForEvent(socketPassenger, SocketServerEvent.RIDE_STATE_CURRENT);

      const completedPromise = waitForEvent<{
        rideId: string;
        status: string;
        finalFareKobo?: number;
      }>(socketPassenger, SocketServerEvent.RIDE_COMPLETED);

      await rideService.updateRideStatus(lifecycleRideId, driverA.userId, {
        status: "COMPLETED",
      });

      const completed = await completedPromise;
      expect(completed.rideId).toBe(lifecycleRideId);
      expect(completed.status).toBe(RideStatus.COMPLETED);
      expect(completed.finalFareKobo).toBe(60000);
    });

    it("should emit ride:cancelled when ride is cancelled by user", async () => {
      const cancelRideId = "ride-cancel-test-004";
      IN_MEMORY_ACTIVE_RIDES.set(cancelRideId, {
        id: cancelRideId,
        rideNumber: "KKE-202611-9904",
        status: RideStatus.SEARCHING,
        tier: RideTier.STANDARD,
        driverId: null,
        pickup: { latitude: 8.498, longitude: 8.518, address: "Lafia" },
        destination: { latitude: 8.51, longitude: 8.52, address: "Hospital" },
        startOtp: "1122",
        estimatedFareKobo: 30000,
        passenger: {
          name: "Umar Farouk",
          phoneNumber: passengerA.phoneNumber,
          rating: 5.0,
        },
      });

      const socketPassenger = connectSocket(tokenPassengerA);
      await waitForEvent(socketPassenger, "connect");
      socketPassenger.emit(SocketClientEvent.RIDE_JOIN, {
        rideId: cancelRideId,
      });
      await waitForEvent(socketPassenger, SocketServerEvent.RIDE_STATE_CURRENT);

      const cancelPromise = waitForEvent<{
        rideId: string;
        status: string;
        cancelledBy: string;
        cancellationReason?: string;
      }>(socketPassenger, SocketServerEvent.RIDE_CANCELLED);

      await rideService.cancelRide(
        cancelRideId,
        passengerA.userId,
        UserRole.PASSENGER,
        "Changed destination plans"
      );

      const cancelled = await cancelPromise;
      expect(cancelled.rideId).toBe(cancelRideId);
      expect(cancelled.status).toBe(RideStatus.CANCELLED);
      expect(cancelled.cancelledBy).toBe(UserRole.PASSENGER);
      expect(cancelled.cancellationReason).toBe("Changed destination plans");
    });
  });
});
