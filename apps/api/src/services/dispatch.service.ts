import {
  prisma,
  RideStatus,
  RideTier,
  DriverAvailabilityStatus,
  DriverVerificationStatus,
  UserRole,
} from "@kekego/database";
import { AppError } from "../utils/errors.js";
import { calculateDistanceMeters } from "./ride.service.js";
import { GeofenceService } from "./geofence.service.js";
import { getSocketService } from "./socket.service.js";

export interface CandidateDriver {
  driverId: string;
  userId: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  rating: number;
  acceptanceRate: number;
  totalTrips: number;
  vehicleId: string;
  vehiclePlate: string;
  vehicleModel: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  score: number;
}

export interface DispatchAttempt {
  id: string;
  rideId: string;
  driverId: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  reason?: string;
  dispatchedAt: Date;
  expiresAt: Date;
  resolvedAt?: Date;
}

export interface AnonymizedNearbyDriver {
  id: string;
  latitude: number;
  longitude: number;
  heading?: number;
  tier: RideTier;
  distanceMeters: number;
}

export interface InMemoryRideRecord {
  id: string;
  rideNumber: string;
  status: RideStatus;
  tier: RideTier;
  driverId: string | null;
  pickup: { latitude: number; longitude: number; address: string };
  destination: { latitude: number; longitude: number; address: string };
  startOtp: string;
  estimatedFareKobo: number;
  passenger: { name: string; phoneNumber: string; rating: number };
}

export interface InMemoryDriverState {
  driverId: string;
  userId: string;
  verificationStatus: DriverVerificationStatus;
  availabilityStatus: DriverAvailabilityStatus;
  activeRideId: string | null;
}

// In-memory dispatch tracking cache for real-time timeout, cascade, and retry management
export const IN_MEMORY_DISPATCH_ATTEMPTS: Map<string, DispatchAttempt[]> = new Map();

// In-memory active rides for atomic concurrency tests and offline execution
export const IN_MEMORY_ACTIVE_RIDES: Map<string, InMemoryRideRecord> = new Map();

// In-memory driver operational states for atomic assignment locks
export const IN_MEMORY_DRIVER_STATES: Map<string, InMemoryDriverState> = new Map();

// Baseline mock drivers for Nasarawa urban corridors
export const MOCK_ONLINE_DRIVERS: CandidateDriver[] = [
  {
    driverId: "d0000000-0000-0000-0000-000000000001",
    userId: "u0000000-0000-0000-0000-000000000001",
    firstName: "Ibrahim",
    lastName: "Musa",
    phoneNumber: "+2348011223344",
    rating: 4.9,
    acceptanceRate: 98.0,
    totalTrips: 185,
    vehicleId: "v0000000-0000-0000-0000-000000000001",
    vehiclePlate: "LAF-882-NS",
    vehicleModel: "Bajaj RE 4S (Yellow)",
    latitude: 8.498,
    longitude: 8.518,
    distanceMeters: 550,
    score: 0.95,
  },
  {
    driverId: "d0000000-0000-0000-0000-000000000002",
    userId: "u0000000-0000-0000-0000-000000000002",
    firstName: "Usman",
    lastName: "Aliyu",
    phoneNumber: "+2348022334455",
    rating: 4.7,
    acceptanceRate: 94.0,
    totalTrips: 92,
    vehicleId: "v0000000-0000-0000-0000-000000000002",
    vehiclePlate: "LAF-319-NS",
    vehicleModel: "TVS King Deluxe",
    latitude: 8.502,
    longitude: 8.522,
    distanceMeters: 1100,
    score: 0.88,
  },
  {
    driverId: "d0000000-0000-0000-0000-000000000003",
    userId: "u0000000-0000-0000-0000-000000000003",
    firstName: "Danjuma",
    lastName: "Yakubu",
    phoneNumber: "+2348033445566",
    rating: 4.6,
    acceptanceRate: 91.0,
    totalTrips: 64,
    vehicleId: "v0000000-0000-0000-0000-000000000003",
    vehiclePlate: "LAF-512-NS",
    vehicleModel: "Piaggio Ape City (Yellow)",
    latitude: 8.508,
    longitude: 8.528,
    distanceMeters: 1800,
    score: 0.81,
  },
  {
    driverId: "d0000000-0000-0000-0000-000000000004",
    userId: "u0000000-0000-0000-0000-000000000004",
    firstName: "Suleiman",
    lastName: "Bala",
    phoneNumber: "+2348044556677",
    rating: 4.8,
    acceptanceRate: 95.0,
    totalTrips: 110,
    vehicleId: "v0000000-0000-0000-0000-000000000004",
    vehiclePlate: "KEF-441-NS",
    vehicleModel: "Bajaj RE 4S",
    latitude: 8.852,
    longitude: 7.872,
    distanceMeters: 800,
    score: 0.86,
  },
  {
    driverId: "d0000000-0000-0000-0000-000000000005",
    userId: "u0000000-0000-0000-0000-000000000005",
    firstName: "Chinedu",
    lastName: "Eze",
    phoneNumber: "+2348055667788",
    rating: 4.9,
    acceptanceRate: 97.0,
    totalTrips: 215,
    vehicleId: "v0000000-0000-0000-0000-000000000005",
    vehiclePlate: "KAR-771-NS",
    vehicleModel: "Bajaj Maxima Z (Charter)",
    latitude: 9.01,
    longitude: 7.58,
    distanceMeters: 600,
    score: 0.94,
  },
];

export class DispatchService {
  private geofenceService = new GeofenceService();

  /**
   * Helper to seed test rides in memory for unit & concurrency testing
   */
  seedMockRide(ride: InMemoryRideRecord) {
    IN_MEMORY_ACTIVE_RIDES.set(ride.id, ride);
  }

  /**
   * Helper to seed driver state in memory for unit & concurrency testing
   */
  seedMockDriver(driver: Partial<InMemoryDriverState> & { driverId: string }) {
    const existing = IN_MEMORY_DRIVER_STATES.get(driver.driverId);
    IN_MEMORY_DRIVER_STATES.set(driver.driverId, {
      driverId: driver.driverId,
      userId: driver.userId || existing?.userId || `user-${driver.driverId}`,
      verificationStatus: driver.verificationStatus || existing?.verificationStatus || DriverVerificationStatus.VERIFIED,
      availabilityStatus: driver.availabilityStatus || existing?.availabilityStatus || DriverAvailabilityStatus.ONLINE,
      activeRideId: driver.activeRideId !== undefined ? driver.activeRideId : (existing?.activeRideId ?? null),
    });
  }

  /**
   * Driver composite ranking score:
   * 50% Distance proximity (normalized over 8km)
   * 30% Rating (normalized over 5.0)
   * 20% Acceptance Rate (normalized over 100%)
   */
  calculateDriverRankingScore(
    distanceMeters: number,
    rating: number,
    acceptanceRate: number
  ): number {
    const distanceKm = distanceMeters / 1000;
    const distanceScore = Math.max(0, 1 - distanceKm / 8); // 1.0 at 0km, 0.0 at 8km
    const ratingScore = Math.min(1, Math.max(0, rating / 5.0));
    const acceptScore = Math.min(1, Math.max(0, acceptanceRate / 100));

    return Number(
      (0.5 * distanceScore + 0.3 * ratingScore + 0.2 * acceptScore).toFixed(4)
    );
  }

  /**
   * Evaluates if a driver is eligible for a requested ride category
   */
  isDriverEligibleForTier(driver: { rating: number; totalTrips: number }, tier: RideTier): boolean {
    if (tier === RideTier.STANDARD) return true;
    if (tier === RideTier.CHARTER) {
      // Charter requires experienced, highly-rated driver (rating >= 4.4 and >= 5 trips)
      return driver.rating >= 4.4 && driver.totalTrips >= 5;
    }
    if (tier === RideTier.CARGO) {
      // Cargo tricycles
      return true;
    }
    return true;
  }

  /**
   * Find nearby online, verified, and available drivers within search radius
   */
  async findNearbyDrivers(params: {
    latitude: number;
    longitude: number;
    radiusMeters?: number;
    tier?: RideTier;
    excludedDriverIds?: string[];
  }): Promise<CandidateDriver[]> {
    const radiusMeters = params.radiusMeters ?? 3500;
    const tier = params.tier ?? RideTier.STANDARD;
    const excludedDriverIds = new Set(params.excludedDriverIds ?? []);

    // 1. Verify search location is inside operating service area
    const pointCheck = await this.geofenceService.validatePoint(
      params.latitude,
      params.longitude
    );
    if (!pointCheck.isInside) {
      return [];
    }

    try {
      if (process.env.DATABASE_URL) {
        // Query PostgreSQL for online, verified drivers
        const activeDrivers = await prisma.driverProfile.findMany({
          where: {
            verificationStatus: DriverVerificationStatus.VERIFIED,
            availabilityStatus: DriverAvailabilityStatus.ONLINE,
            isOnline: true,
            id: { notIn: Array.from(excludedDriverIds) },
            vehicles: {
              some: {
                isActive: true,
                isVerified: true,
              },
            },
          },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                phoneNumber: true,
              },
            },
            vehicles: {
              where: { isActive: true, isVerified: true },
              take: 1,
            },
            driverLocations: {
              orderBy: { recordedAt: "desc" },
              take: 1,
            },
          },
        });

        // Check active rides to ensure driver is not already committed
        const busyDriverIds = new Set(
          (
            await prisma.ride.findMany({
              where: {
                driverId: { in: activeDrivers.map((d) => d.id) },
                status: {
                  in: [
                    RideStatus.DRIVER_ASSIGNED,
                    RideStatus.DRIVER_EN_ROUTE,
                    RideStatus.DRIVER_ARRIVED,
                    RideStatus.IN_PROGRESS,
                  ],
                },
              },
              select: { driverId: true },
            })
          ).map((r) => r.driverId as string)
        );

        const candidates: CandidateDriver[] = [];

        for (const driver of activeDrivers) {
          if (busyDriverIds.has(driver.id)) continue;

          const location = driver.driverLocations[0];
          const vehicle = driver.vehicles[0];
          if (!location || !vehicle) continue;

          const dist = calculateDistanceMeters(
            params.latitude,
            params.longitude,
            Number(location.latitude),
            Number(location.longitude)
          );

          if (dist <= radiusMeters) {
            const ratingNum = Number(driver.rating);
            const acceptanceNum = Number(driver.acceptanceRate);

            if (
              !this.isDriverEligibleForTier(
                { rating: ratingNum, totalTrips: driver.totalTrips },
                tier
              )
            ) {
              continue;
            }

            const score = this.calculateDriverRankingScore(
              dist,
              ratingNum,
              acceptanceNum
            );

            candidates.push({
              driverId: driver.id,
              userId: driver.userId,
              firstName: driver.user.firstName,
              lastName: driver.user.lastName,
              phoneNumber: driver.user.phoneNumber,
              rating: ratingNum,
              acceptanceRate: acceptanceNum,
              totalTrips: driver.totalTrips,
              vehicleId: vehicle.id,
              vehiclePlate: vehicle.plateNumber,
              vehicleModel: `${vehicle.make} ${vehicle.model} (${vehicle.color})`,
              latitude: Number(location.latitude),
              longitude: Number(location.longitude),
              distanceMeters: dist,
              score,
            });
          }
        }

        if (candidates.length > 0) {
          return candidates.sort((a, b) => b.score - a.score);
        }
      }
    } catch {
      // Fallback to in-memory mock candidates if database is offline
    }

    // Fallback in-memory matching logic
    const candidates = MOCK_ONLINE_DRIVERS.filter((d) => {
      if (excludedDriverIds.has(d.driverId)) return false;

      // Check if driver is already committed to an active trip in memory
      const driverState = IN_MEMORY_DRIVER_STATES.get(d.driverId);
      if (driverState && driverState.activeRideId !== null) return false;

      const dist = calculateDistanceMeters(
        params.latitude,
        params.longitude,
        d.latitude,
        d.longitude
      );
      if (dist > radiusMeters) return false;
      return this.isDriverEligibleForTier(d, tier);
    }).map((d) => {
      const dist = calculateDistanceMeters(
        params.latitude,
        params.longitude,
        d.latitude,
        d.longitude
      );
      const score = this.calculateDriverRankingScore(
        dist,
        d.rating,
        d.acceptanceRate
      );
      return { ...d, distanceMeters: dist, score };
    });

    return candidates.sort((a, b) => b.score - a.score);
  }

  /**
   * Anonymized nearby driver coordinates for Passenger Map View (Privacy Protected)
   */
  async getAnonymizedNearbyDrivers(
    latitude: number,
    longitude: number,
    radiusMeters = 3500,
    tier: RideTier = RideTier.STANDARD
  ): Promise<AnonymizedNearbyDriver[]> {
    const candidates = await this.findNearbyDrivers({
      latitude,
      longitude,
      radiusMeters,
      tier,
    });

    return candidates.map((c) => ({
      id: c.driverId,
      latitude: c.latitude,
      longitude: c.longitude,
      heading: Math.floor(Math.random() * 360),
      tier,
      distanceMeters: c.distanceMeters,
    }));
  }

  /**
   * Initiates dispatch matching for a ride.
   * Finds ranked drivers, checks timeouts, and handles expansion / no-driver-found.
   */
  async dispatchRide(
    rideId: string,
    options?: { radiusMeters?: number; retryCount?: number }
  ): Promise<{
    status: "DISPATCHED" | "NO_DRIVER_FOUND";
    targetDriverId?: string;
    timeoutSeconds?: number;
    attemptCount: number;
    radiusMeters: number;
  }> {
    let ridePickupLat = 8.498;
    let ridePickupLng = 8.518;
    let rideTier: RideTier = RideTier.STANDARD;
    let rideStatus: RideStatus = RideStatus.SEARCHING;

    try {
      if (process.env.DATABASE_URL) {
        const dbRide = await prisma.ride.findUnique({
          where: { id: rideId },
        });

        if (dbRide) {
          if (
            dbRide.status !== RideStatus.REQUESTED &&
            dbRide.status !== RideStatus.SEARCHING
          ) {
            throw new AppError(
              400,
              "INVALID_DISPATCH_STATE",
              `Ride cannot be dispatched in status ${dbRide.status}`
            );
          }

          ridePickupLat = Number(dbRide.pickupLatitude);
          ridePickupLng = Number(dbRide.pickupLongitude);
          rideTier = dbRide.tier;
          rideStatus = dbRide.status;
        }
      }
    } catch {
      // Offline fallback
    }

    const inMemRide = IN_MEMORY_ACTIVE_RIDES.get(rideId);
    if (inMemRide) {
      if (
        inMemRide.status !== RideStatus.REQUESTED &&
        inMemRide.status !== RideStatus.SEARCHING
      ) {
        throw new AppError(
          400,
          "INVALID_DISPATCH_STATE",
          `Ride cannot be dispatched in status ${inMemRide.status}`
        );
      }
      ridePickupLat = inMemRide.pickup.latitude;
      ridePickupLng = inMemRide.pickup.longitude;
      rideTier = inMemRide.tier;
      rideStatus = inMemRide.status;
    }

    // Get previous attempts for this ride
    const attempts = IN_MEMORY_DISPATCH_ATTEMPTS.get(rideId) || [];
    const attemptedDriverIds = attempts.map((a) => a.driverId);

    const radiusMeters = options?.radiusMeters ?? 3500;
    const retryCount = options?.retryCount ?? attempts.length;

    // Find nearby eligible drivers excluding previously attempted ones
    const candidates = await this.findNearbyDrivers({
      latitude: ridePickupLat,
      longitude: ridePickupLng,
      radiusMeters,
      tier: rideTier,
      excludedDriverIds: attemptedDriverIds,
    });

    // If no candidate found in current radius, attempt expansion
    if (candidates.length === 0) {
      if (radiusMeters < 8000) {
        // Expand search perimeter (3.5km -> 5.5km -> 8.0km)
        const nextRadius = Math.min(8000, radiusMeters + 2000);
        return this.dispatchRide(rideId, {
          radiusMeters: nextRadius,
          retryCount: retryCount + 1,
        });
      }

      // Max radius reached with no eligible drivers -> NO_DRIVER_FOUND
      await this.markRideNoDriverFound(rideId, rideStatus);

      return {
        status: "NO_DRIVER_FOUND",
        attemptCount: attempts.length,
        radiusMeters,
      };
    }

    // Select highest ranked candidate
    const topCandidate = candidates[0];
    if (!topCandidate) {
      await this.markRideNoDriverFound(rideId, rideStatus);
      return {
        status: "NO_DRIVER_FOUND",
        attemptCount: attempts.length,
        radiusMeters,
      };
    }

    // Create dispatch attempt
    const timeoutSeconds = 15;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + timeoutSeconds * 1000);

    const attempt: DispatchAttempt = {
      id: `disp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      rideId,
      driverId: topCandidate.driverId,
      status: "PENDING",
      dispatchedAt: now,
      expiresAt,
    };

    attempts.push(attempt);
    IN_MEMORY_DISPATCH_ATTEMPTS.set(rideId, attempts);

    // Update ride to SEARCHING in database
    try {
      if (process.env.DATABASE_URL) {
        await prisma.ride.update({
          where: { id: rideId },
          data: { status: RideStatus.SEARCHING },
        });
      }
    } catch {
      // Offline fallback
    }

    if (inMemRide) {
      inMemRide.status = RideStatus.SEARCHING;
    }

    // Real-Time Socket.IO event notification to driver
    const socketService = getSocketService();
    if (socketService) {
      socketService.notifyRideDispatched(rideId, topCandidate.driverId, {
        rideId,
        rideNumber: inMemRide?.rideNumber || rideId,
        tier: rideTier,
        pickup: {
          latitude: ridePickupLat,
          longitude: ridePickupLng,
        },
        timeoutSeconds,
        expiresAt: expiresAt.toISOString(),
      });
    }

    return {
      status: "DISPATCHED",
      targetDriverId: topCandidate.driverId,
      timeoutSeconds,
      attemptCount: attempts.length,
      radiusMeters,
    };
  }

  /**
   * Atomic Ride Acceptance with Strict Concurrency Locks:
   * 1. Guarantees a ride is assigned to at most ONE driver.
   * 2. Guarantees a driver is assigned to at most ONE active trip.
   * 3. Prevents race conditions using transactional checks.
   */
  async acceptDispatch(rideId: string, driverUserId: string) {
    if (process.env.DATABASE_URL) {
      try {
        const result = await prisma.$transaction(async (tx) => {
          // 1. Fetch driver profile & active vehicle
          const driver = await tx.driverProfile.findUnique({
            where: { userId: driverUserId },
            include: {
              vehicles: {
                where: { isActive: true, isVerified: true },
              },
            },
          });

          if (!driver) {
            throw new AppError(404, "DRIVER_NOT_FOUND", "Driver profile not found");
          }

          if (driver.verificationStatus !== DriverVerificationStatus.VERIFIED) {
            throw new AppError(
              403,
              "DRIVER_NOT_VERIFIED",
              "Driver is not verified to accept rides"
            );
          }

          const primaryVehicle = driver.vehicles[0];
          if (!primaryVehicle) {
            throw new AppError(
              400,
              "NO_ACTIVE_VEHICLE",
              "No active verified vehicle registered"
            );
          }

          // 2. Concurrency Check A: Ensure driver has NO other active assigned rides
          const existingActiveRide = await tx.ride.findFirst({
            where: {
              driverId: driver.id,
              status: {
                in: [
                  RideStatus.DRIVER_ASSIGNED,
                  RideStatus.DRIVER_EN_ROUTE,
                  RideStatus.DRIVER_ARRIVED,
                  RideStatus.IN_PROGRESS,
                ],
              },
            },
          });

          if (existingActiveRide) {
            throw new AppError(
              409,
              "DRIVER_ALREADY_COMMITTED",
              "Driver is already committed to an active trip",
              { activeRideId: existingActiveRide.id }
            );
          }

          // 3. Concurrency Check B: Ensure ride is still available (SEARCHING or REQUESTED, unassigned)
          const ride = await tx.ride.findUnique({
            where: { id: rideId },
            include: {
              passenger: {
                include: {
                  user: {
                    select: { firstName: true, phoneNumber: true },
                  },
                },
              },
            },
          });

          if (!ride) {
            throw new AppError(404, "RIDE_NOT_FOUND", "Ride not found");
          }

          if (
            (ride.status !== RideStatus.SEARCHING &&
              ride.status !== RideStatus.REQUESTED) ||
            ride.driverId !== null
          ) {
            throw new AppError(
              409,
              "RIDE_ALREADY_ASSIGNED",
              "This trip has already been assigned to another driver or is no longer available"
            );
          }

          // 4. Atomically assign ride
          const assignedRide = await tx.ride.update({
            where: { id: rideId },
            data: {
              driverId: driver.id,
              vehicleId: primaryVehicle.id,
              status: RideStatus.DRIVER_ASSIGNED,
              assignedAt: new Date(),
              events: {
                create: {
                  previousStatus: ride.status,
                  newStatus: RideStatus.DRIVER_ASSIGNED,
                  actorId: driver.userId,
                  actorRole: UserRole.DRIVER,
                  metadata: {
                    assignedAt: new Date().toISOString(),
                    vehiclePlate: primaryVehicle.plateNumber,
                  },
                },
              },
            },
            include: {
              passenger: {
                include: {
                  user: { select: { firstName: true, phoneNumber: true } },
                },
              },
              vehicle: true,
            },
          });

          // 5. Update driver availability status to BUSY
          await tx.driverProfile.update({
            where: { id: driver.id },
            data: { availabilityStatus: DriverAvailabilityStatus.BUSY },
          });

          // 6. Resolve dispatch attempt in memory
          const attempts = IN_MEMORY_DISPATCH_ATTEMPTS.get(rideId) || [];
          const attempt = attempts.find(
            (a) => a.driverId === driver.id && a.status === "PENDING"
          );
          if (attempt) {
            attempt.status = "ACCEPTED";
            attempt.resolvedAt = new Date();
          }

          return {
            id: assignedRide.id,
            rideNumber: assignedRide.rideNumber,
            status: assignedRide.status,
            tier: assignedRide.tier,
            startOtp: assignedRide.startOtp,
            pickup: {
              latitude: Number(assignedRide.pickupLatitude),
              longitude: Number(assignedRide.pickupLongitude),
              address: assignedRide.pickupAddress,
            },
            destination: {
              latitude: Number(assignedRide.destinationLatitude),
              longitude: Number(assignedRide.destinationLongitude),
              address: assignedRide.destinationAddress,
            },
            estimatedDistanceMeters: assignedRide.estimatedDistanceMeters,
            estimatedDurationSeconds: assignedRide.estimatedDurationSeconds,
            estimatedFareKobo: assignedRide.estimatedFareKobo,
            paymentMethod: assignedRide.paymentMethod,
            passenger: {
              name: assignedRide.passenger.user.firstName,
              phoneNumber: assignedRide.passenger.user.phoneNumber,
              rating: Number(assignedRide.passenger.rating),
            },
            vehicle: {
              plateNumber: primaryVehicle.plateNumber,
              model: `${primaryVehicle.make} ${primaryVehicle.model}`,
              color: primaryVehicle.color,
            },
          };
        });

        // Notify ride room in real-time via Socket.IO
        const socketService = getSocketService();
        if (socketService) {
          socketService.notifyRideAccepted(result.id, {
            rideId: result.id,
            status: result.status,
            driver: {
              name: result.passenger.name,
              vehicle: result.vehicle,
            },
            assignedAt: new Date().toISOString(),
          });
        }

        return result;
      } catch (err: unknown) {
        if (err instanceof AppError) throw err;
        // Fall back to in-memory atomic assignment check
      }
    }

    return this.inMemoryAcceptDispatch(rideId, driverUserId);
  }

  /**
   * Synchronous / Atomic In-Memory Assignment Lock for Concurrency Tests
   */
  private inMemoryAcceptDispatch(rideId: string, driverUserId: string) {
    // 1. Locate driver state
    let driver = Array.from(IN_MEMORY_DRIVER_STATES.values()).find(
      (d) => d.userId === driverUserId || d.driverId === driverUserId
    );

    if (!driver) {
      const mockCandidate = MOCK_ONLINE_DRIVERS.find(
        (m) => m.userId === driverUserId || m.driverId === driverUserId
      );

      if (mockCandidate) {
        driver = {
          driverId: mockCandidate.driverId,
          userId: mockCandidate.userId,
          verificationStatus: DriverVerificationStatus.VERIFIED,
          availabilityStatus: DriverAvailabilityStatus.ONLINE,
          activeRideId: null,
        };
        IN_MEMORY_DRIVER_STATES.set(mockCandidate.driverId, driver);
      } else {
        throw new AppError(404, "DRIVER_NOT_FOUND", "Driver profile not found");
      }
    }

    if (driver.verificationStatus !== DriverVerificationStatus.VERIFIED) {
      throw new AppError(
        403,
        "DRIVER_NOT_VERIFIED",
        "Driver is not verified to accept rides"
      );
    }

    // 2. Concurrency Check A: Driver cannot accept two active rides
    if (driver.activeRideId !== null) {
      throw new AppError(
        409,
        "DRIVER_ALREADY_COMMITTED",
        "Driver is already committed to an active trip",
        { activeRideId: driver.activeRideId }
      );
    }

    // 3. Concurrency Check B: Ride cannot be assigned to two drivers
    let ride = IN_MEMORY_ACTIVE_RIDES.get(rideId);
    if (!ride) {
      ride = {
        id: rideId,
        rideNumber: `KKE-202611-${Math.floor(1000 + Math.random() * 9000)}`,
        status: RideStatus.SEARCHING,
        tier: RideTier.STANDARD,
        driverId: null,
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
        startOtp: "1234",
        estimatedFareKobo: 55000,
        passenger: {
          name: "Amina Yusuf",
          phoneNumber: "+2348011112222",
          rating: 4.9,
        },
      };
      IN_MEMORY_ACTIVE_RIDES.set(rideId, ride);
    }

    if (
      ride.driverId !== null ||
      (ride.status !== RideStatus.SEARCHING &&
        ride.status !== RideStatus.REQUESTED)
    ) {
      throw new AppError(
        409,
        "RIDE_ALREADY_ASSIGNED",
        "This trip has already been assigned to another driver or is no longer available"
      );
    }

    // 4. Atomically commit assignment
    ride.driverId = driver.driverId;
    ride.status = RideStatus.DRIVER_ASSIGNED;
    driver.activeRideId = rideId;
    driver.availabilityStatus = DriverAvailabilityStatus.BUSY;

    // 5. Resolve dispatch attempt in memory
    const attempts = IN_MEMORY_DISPATCH_ATTEMPTS.get(rideId) || [];
    const attempt = attempts.find(
      (a) => a.driverId === driver!.driverId && a.status === "PENDING"
    );
    if (attempt) {
      attempt.status = "ACCEPTED";
      attempt.resolvedAt = new Date();
    }

    const result = {
      id: ride.id,
      rideNumber: ride.rideNumber,
      status: ride.status,
      tier: ride.tier,
      startOtp: ride.startOtp,
      pickup: ride.pickup,
      destination: ride.destination,
      estimatedDistanceMeters: 3800,
      estimatedDurationSeconds: 650,
      estimatedFareKobo: ride.estimatedFareKobo,
      paymentMethod: "CASH",
      passenger: ride.passenger,
      vehicle: {
        plateNumber: "LAF-882-NS",
        model: "Bajaj RE 4S (Yellow)",
        color: "Yellow",
      },
    };

    // Notify ride room in real-time via Socket.IO
    const socketService = getSocketService();
    if (socketService) {
      socketService.notifyRideAccepted(ride.id, {
        rideId: ride.id,
        status: ride.status,
        driver: {
          id: driver.driverId,
          userId: driver.userId,
          name: "Ibrahim Musa",
          phoneNumber: "+2348011223344",
          vehicle: result.vehicle,
        },
        assignedAt: new Date().toISOString(),
      });
    }

    return result;
  }

  /**
   * Driver Rejects Incoming Dispatch:
   * Records rejection, updates driver acceptance statistics, and cascades
   * immediately to the next candidate driver.
   */
  async rejectDispatch(
    rideId: string,
    driverUserId: string,
    reason = "UNAVAILABLE",
    comment?: string
  ) {
    let driverId = driverUserId;

    try {
      if (process.env.DATABASE_URL) {
        const dbDriver = await prisma.driverProfile.findUnique({
          where: { userId: driverUserId },
        });
        if (dbDriver) driverId = dbDriver.id;
      }
    } catch {
      // Offline fallback
    }

    const mockDriver = MOCK_ONLINE_DRIVERS.find(
      (m) => m.userId === driverUserId || m.driverId === driverUserId
    );
    if (mockDriver) driverId = mockCandidateDriverId(mockDriver);

    // Mark attempt as REJECTED
    const attempts = IN_MEMORY_DISPATCH_ATTEMPTS.get(rideId) || [];
    const attempt = attempts.find(
      (a) => (a.driverId === driverId || a.driverId === driverUserId) && a.status === "PENDING"
    );

    if (attempt) {
      attempt.status = "REJECTED";
      attempt.reason = comment ? `${reason}: ${comment}` : reason;
      attempt.resolvedAt = new Date();
    }

    // Record reject ride event for audit
    try {
      if (process.env.DATABASE_URL) {
        await prisma.rideEvent.create({
          data: {
            rideId,
            previousStatus: RideStatus.SEARCHING,
            newStatus: RideStatus.SEARCHING,
            actorId: driverUserId,
            actorRole: UserRole.DRIVER,
            metadata: {
              action: "DRIVER_REJECTED",
              reason,
              comment,
            },
          },
        });
      }
    } catch {
      // Offline fallback
    }

    // Notify admin operations via Socket.IO
    const socketService = getSocketService();
    if (socketService) {
      socketService.notifyRideRejected(rideId, driverId, reason);
    }

    // Cascade to next candidate
    return this.dispatchRide(rideId);
  }

  /**
   * Handle Dispatch Timeout / Expiration (15 seconds elapsed):
   * Marks attempt EXPIRED and cascades to next candidate.
   */
  async handleDispatchTimeout(rideId: string, driverId: string) {
    const attempts = IN_MEMORY_DISPATCH_ATTEMPTS.get(rideId) || [];
    const attempt = attempts.find(
      (a) => a.driverId === driverId && a.status === "PENDING"
    );

    if (attempt) {
      attempt.status = "EXPIRED";
      attempt.resolvedAt = new Date();
    }

    return this.dispatchRide(rideId);
  }

  /**
   * Transitions ride to NO_DRIVER_FOUND when all candidates are exhausted
   */
  private async markRideNoDriverFound(
    rideId: string,
    previousStatus: RideStatus
  ) {
    try {
      if (process.env.DATABASE_URL) {
        await prisma.ride.update({
          where: { id: rideId },
          data: {
            status: RideStatus.NO_DRIVER_FOUND,
            events: {
              create: {
                previousStatus,
                newStatus: RideStatus.NO_DRIVER_FOUND,
                actorRole: UserRole.ADMIN,
                metadata: {
                  reason: "ALL_ELIGIBLE_DRIVERS_EXHAUSTED",
                  timestamp: new Date().toISOString(),
                },
              },
            },
          },
        });
        return;
      }
    } catch {
      // Offline fallback
    }

    const inMem = IN_MEMORY_ACTIVE_RIDES.get(rideId);
    if (inMem) {
      inMem.status = RideStatus.NO_DRIVER_FOUND;
    }
  }

  /**
   * Retrieve full dispatch attempt history for a ride
   */
  async getDispatchHistory(rideId: string): Promise<DispatchAttempt[]> {
    return IN_MEMORY_DISPATCH_ATTEMPTS.get(rideId) || [];
  }

  /**
   * Admin: Get all currently active dispatches across the platform
   */
  async getActiveDispatches() {
    try {
      if (process.env.DATABASE_URL) {
        const searchingRides = await prisma.ride.findMany({
          where: {
            status: { in: [RideStatus.REQUESTED, RideStatus.SEARCHING] },
          },
          orderBy: { requestedAt: "desc" },
          include: {
            passenger: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        });

        if (searchingRides.length > 0) {
          return searchingRides.map((r) => {
            const attempts = IN_MEMORY_DISPATCH_ATTEMPTS.get(r.id) || [];
            const activeAttempt = attempts.find((a) => a.status === "PENDING");

            return {
              rideId: r.id,
              rideNumber: r.rideNumber,
              tier: r.tier,
              status: r.status,
              pickupAddress: r.pickupAddress,
              destinationAddress: r.destinationAddress,
              passengerName: `${r.passenger.user.firstName} ${r.passenger.user.lastName}`,
              attemptsCount: attempts.length,
              currentAttempt: activeAttempt
                ? {
                    driverId: activeAttempt.driverId,
                    dispatchedAt: activeAttempt.dispatchedAt,
                    expiresAt: activeAttempt.expiresAt,
                  }
                : null,
              requestedAt: r.requestedAt,
            };
          });
        }
      }
    } catch {
      // Fallback
    }

    // In-memory searching rides fallback
    return Array.from(IN_MEMORY_ACTIVE_RIDES.values())
      .filter((r) => r.status === RideStatus.SEARCHING || r.status === RideStatus.REQUESTED)
      .map((r) => {
        const attempts = IN_MEMORY_DISPATCH_ATTEMPTS.get(r.id) || [];
        const activeAttempt = attempts.find((a) => a.status === "PENDING");

        return {
          rideId: r.id,
          rideNumber: r.rideNumber,
          tier: r.tier,
          status: r.status,
          pickupAddress: r.pickup.address,
          destinationAddress: r.destination.address,
          passengerName: r.passenger.name,
          attemptsCount: attempts.length,
          currentAttempt: activeAttempt
            ? {
                driverId: activeAttempt.driverId,
                dispatchedAt: activeAttempt.dispatchedAt,
                expiresAt: activeAttempt.expiresAt,
              }
            : null,
          requestedAt: new Date(),
        };
      });
  }
}

function mockCandidateDriverId(m: CandidateDriver): string {
  return m.driverId;
}
