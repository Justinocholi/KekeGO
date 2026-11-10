import {
  prisma,
  RideStatus,
  RideTier,
  PaymentStatus,
  UserRole,
} from "@kekego/database";
import type {
  CreateRideRequest,
  RideEstimateRequest,
  CreateRatingInput,
} from "@kekego/validation";
import { AppError } from "../utils/errors.js";

/**
 * Calculates great-circle distance between two coordinates in meters (Haversine formula)
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  // Multiply by road winding factor (approx 1.25 for urban streets)
  return Math.round(R * c * 1.25);
}

export class RideService {
  /**
   * Calculate fare estimates across ride tiers
   */
  async estimateFare(input: RideEstimateRequest) {
    const distanceMeters = calculateDistanceMeters(
      input.pickup.latitude,
      input.pickup.longitude,
      input.destination.latitude,
      input.destination.longitude
    );

    const distanceKm = distanceMeters / 1000;
    // Commercial tricycle urban travel speed estimate: ~25 km/h
    const durationMinutes = Math.max(1, Math.round((distanceKm / 25) * 60));
    const durationSeconds = durationMinutes * 60;

    // Fetch active fare rules from database or fallback to default rates
    let fareRules: Array<{
      tier: RideTier;
      baseFareKobo: number;
      distanceFarePerKmKobo: number;
      timeFarePerMinKobo: number;
      minimumFareKobo: number;
    }> = [];

    try {
      if (process.env.DATABASE_URL) {
        fareRules = await prisma.fareRule.findMany({
          where: { isActive: true },
        });
      }
    } catch {
      // Fallback gracefully to default configured rates if database is unreachable
      fareRules = [];
    }

    // Default fallback rates if DB fare rules not yet seeded
    const fallbackRules: Record<RideTier, { base: number; perKm: number; perMin: number; min: number }> = {
      STANDARD: { base: 20000, perKm: 7000, perMin: 1500, min: 25000 },
      CHARTER: { base: 50000, perKm: 12000, perMin: 3000, min: 60000 },
      CARGO: { base: 35000, perKm: 9000, perMin: 2000, min: 40000 },
    };

    const tiers = [RideTier.STANDARD, RideTier.CHARTER, RideTier.CARGO];

    const estimates = tiers.map((tier) => {
      const rule = fareRules.find((r) => r.tier === tier);
      const baseFare = rule ? rule.baseFareKobo : fallbackRules[tier].base;
      const perKm = rule ? rule.distanceFarePerKmKobo : fallbackRules[tier].perKm;
      const perMin = rule ? rule.timeFarePerMinKobo : fallbackRules[tier].perMin;
      const minFare = rule ? rule.minimumFareKobo : fallbackRules[tier].min;

      const distanceCharge = Math.round(distanceKm * perKm);
      const timeCharge = Math.round(durationMinutes * perMin);
      const subtotal = baseFare + distanceCharge + timeCharge;
      const totalFare = Math.max(minFare, subtotal);

      return {
        tier,
        estimatedDistanceMeters: distanceMeters,
        estimatedDurationSeconds: durationSeconds,
        estimatedDurationMinutes: durationMinutes,
        fareBreakdown: {
          currency: "NGN" as const,
          baseFareKobo: baseFare,
          distanceChargeKobo: distanceCharge,
          timeChargeKobo: timeCharge,
          minimumFareKobo: minFare,
          discountKobo: 0,
          surgeMultiplier: 1.0,
          totalFareKobo: totalFare,
        },
      };
    });

    return {
      pickup: input.pickup,
      destination: input.destination,
      estimates,
    };
  }

  /**
   * Create a new ride request
   */
  async createRide(passengerUserId: string, input: CreateRideRequest) {
    const passenger = await prisma.passengerProfile.findUnique({
      where: { userId: passengerUserId },
    });

    if (!passenger) {
      throw new AppError(
        400,
        "PASSENGER_PROFILE_REQUIRED",
        "A passenger profile is required to request a ride"
      );
    }

    // Check if passenger already has an active incomplete ride
    const activeRide = await prisma.ride.findFirst({
      where: {
        passengerId: passenger.id,
        status: {
          in: [
            RideStatus.REQUESTED,
            RideStatus.SEARCHING,
            RideStatus.DRIVER_ASSIGNED,
            RideStatus.DRIVER_EN_ROUTE,
            RideStatus.DRIVER_ARRIVED,
            RideStatus.IN_PROGRESS,
          ],
        },
      },
    });

    if (activeRide) {
      throw new AppError(
        409,
        "ACTIVE_RIDE_EXISTS",
        "You already have an active ride request in progress",
        { activeRideId: activeRide.id, status: activeRide.status }
      );
    }

    // Estimate distance and fare
    const estimateData = await this.estimateFare({
      pickup: input.pickup,
      destination: input.destination,
      tier: input.tier,
    });

    const chosenTierEstimate = estimateData.estimates.find(
      (e) => e.tier === input.tier
    ) || estimateData.estimates[0];

    if (!chosenTierEstimate) {
      throw new AppError(400, "INVALID_TIER", "Invalid ride tier selected");
    }

    // Generate human-readable ride number e.g. KKE-202611-1234
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const rideNumber = `KKE-${dateStr}-${randomHex}`;

    // Generate 4-digit start OTP code for boarding verification
    const startOtp = Math.floor(1000 + Math.random() * 9000).toString();

    // Create ride record and initial event
    const ride = await prisma.ride.create({
      data: {
        rideNumber,
        passengerId: passenger.id,
        tier: input.tier,
        status: RideStatus.SEARCHING,
        pickupAddress: input.pickup.address || "Current Location",
        pickupLatitude: input.pickup.latitude,
        pickupLongitude: input.pickup.longitude,
        destinationAddress: input.destination.address || "Selected Destination",
        destinationLatitude: input.destination.latitude,
        destinationLongitude: input.destination.longitude,
        startOtp,
        estimatedDistanceMeters: chosenTierEstimate.estimatedDistanceMeters,
        estimatedDurationSeconds: chosenTierEstimate.estimatedDurationSeconds,
        estimatedFareKobo: chosenTierEstimate.fareBreakdown.totalFareKobo,
        paymentMethod: input.paymentMethod,
        paymentStatus: PaymentStatus.PENDING,
        events: {
          create: {
            newStatus: RideStatus.SEARCHING,
            actorId: passengerUserId,
            actorRole: UserRole.PASSENGER,
            latitude: input.pickup.latitude,
            longitude: input.pickup.longitude,
          },
        },
      },
    });

    return {
      id: ride.id,
      rideNumber: ride.rideNumber,
      status: ride.status,
      tier: ride.tier,
      startOtp: ride.startOtp,
      pickup: {
        latitude: Number(ride.pickupLatitude),
        longitude: Number(ride.pickupLongitude),
        address: ride.pickupAddress,
      },
      destination: {
        latitude: Number(ride.destinationLatitude),
        longitude: Number(ride.destinationLongitude),
        address: ride.destinationAddress,
      },
      estimatedDistanceMeters: ride.estimatedDistanceMeters,
      estimatedDurationSeconds: ride.estimatedDurationSeconds,
      estimatedFareKobo: ride.estimatedFareKobo,
      paymentMethod: ride.paymentMethod,
      requestedAt: ride.requestedAt,
    };
  }

  /**
   * Retrieve single ride by ID
   */
  async getRideById(rideId: string, userId: string, role: UserRole) {
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        passenger: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                phoneNumber: true,
              },
            },
          },
        },
        driver: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                phoneNumber: true,
              },
            },
          },
        },
        vehicle: true,
        rating: true,
      },
    });

    if (!ride) {
      throw new AppError(404, "RIDE_NOT_FOUND", "Ride not found");
    }

    // Role check: passenger, assigned driver, or admin
    if (
      role !== UserRole.ADMIN &&
      ride.passenger.userId !== userId &&
      ride.driver?.userId !== userId
    ) {
      throw new AppError(
        403,
        "FORBIDDEN",
        "You do not have permission to view this trip"
      );
    }

    return {
      id: ride.id,
      rideNumber: ride.rideNumber,
      status: ride.status,
      tier: ride.tier,
      startOtp: ride.startOtp,
      pickup: {
        latitude: Number(ride.pickupLatitude),
        longitude: Number(ride.pickupLongitude),
        address: ride.pickupAddress,
      },
      destination: {
        latitude: Number(ride.destinationLatitude),
        longitude: Number(ride.destinationLongitude),
        address: ride.destinationAddress,
      },
      estimatedDistanceMeters: ride.estimatedDistanceMeters,
      estimatedDurationSeconds: ride.estimatedDurationSeconds,
      estimatedFareKobo: ride.estimatedFareKobo,
      finalFareKobo: ride.finalFareKobo,
      paymentMethod: ride.paymentMethod,
      paymentStatus: ride.paymentStatus,
      passenger: {
        name: `${ride.passenger.user.firstName} ${ride.passenger.user.lastName}`,
        phoneNumber: ride.passenger.user.phoneNumber,
        rating: Number(ride.passenger.rating),
      },
      driver: ride.driver
        ? {
            name: `${ride.driver.user.firstName} ${ride.driver.user.lastName}`,
            phoneNumber: ride.driver.user.phoneNumber,
            rating: Number(ride.driver.rating),
            totalTrips: ride.driver.totalTrips,
            vehicle: ride.vehicle
              ? {
                  plateNumber: ride.vehicle.plateNumber,
                  make: ride.vehicle.make,
                  model: ride.vehicle.model,
                  color: ride.vehicle.color,
                }
              : null,
          }
        : null,
      rating: ride.rating
        ? {
            score: ride.rating.score,
            comment: ride.rating.comment,
            tags: ride.rating.tags,
          }
        : null,
      requestedAt: ride.requestedAt,
      completedAt: ride.completedAt,
    };
  }

  /**
   * Cancel an active ride
   */
  async cancelRide(rideId: string, userId: string, role: UserRole, reason?: string) {
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: { passenger: true, driver: true },
    });

    if (!ride) {
      throw new AppError(404, "RIDE_NOT_FOUND", "Ride not found");
    }

    if (
      role !== UserRole.ADMIN &&
      ride.passenger.userId !== userId &&
      ride.driver?.userId !== userId
    ) {
      throw new AppError(403, "FORBIDDEN", "Not authorized to cancel this ride");
    }

    if (
      ride.status === RideStatus.COMPLETED ||
      ride.status === RideStatus.CANCELLED
    ) {
      throw new AppError(
        400,
        "INVALID_STATE_TRANSITION",
        `Cannot cancel a ride that is already ${ride.status}`
      );
    }

    const updated = await prisma.ride.update({
      where: { id: rideId },
      data: {
        status: RideStatus.CANCELLED,
        cancellationReason: reason || "Cancelled by passenger",
        cancelledBy: role,
        cancelledAt: new Date(),
        events: {
          create: {
            previousStatus: ride.status,
            newStatus: RideStatus.CANCELLED,
            actorId: userId,
            actorRole: role,
            metadata: { reason },
          },
        },
      },
    });

    return {
      id: updated.id,
      status: updated.status,
      cancellationReason: updated.cancellationReason,
      cancelledAt: updated.cancelledAt,
    };
  }

  /**
   * Retrieve trip history for passenger
   */
  async getPassengerHistory(passengerUserId: string, page = 1, limit = 20) {
    const passenger = await prisma.passengerProfile.findUnique({
      where: { userId: passengerUserId },
    });

    if (!passenger) {
      throw new AppError(404, "PASSENGER_NOT_FOUND", "Passenger profile not found");
    }

    const skip = (page - 1) * limit;

    const [total, rides] = await Promise.all([
      prisma.ride.count({ where: { passengerId: passenger.id } }),
      prisma.ride.findMany({
        where: { passengerId: passenger.id },
        skip,
        take: limit,
        orderBy: { requestedAt: "desc" },
        include: {
          driver: {
            include: {
              user: {
                select: { firstName: true, lastName: true },
              },
            },
          },
          vehicle: {
            select: { plateNumber: true, make: true, model: true, color: true },
          },
          rating: true,
        },
      }),
    ]);

    return {
      rides: rides.map((r) => ({
        id: r.id,
        rideNumber: r.rideNumber,
        tier: r.tier,
        status: r.status,
        pickupAddress: r.pickupAddress,
        destinationAddress: r.destinationAddress,
        fareKobo: r.finalFareKobo || r.estimatedFareKobo,
        paymentMethod: r.paymentMethod,
        driverName: r.driver ? `${r.driver.user.firstName} ${r.driver.user.lastName}` : null,
        vehiclePlate: r.vehicle?.plateNumber ?? null,
        vehicleColor: r.vehicle?.color ?? null,
        rating: r.rating ? { score: r.rating.score, comment: r.rating.comment } : null,
        requestedAt: r.requestedAt,
        completedAt: r.completedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Submit 1-5 star rating and review after ride completion
   */
  async submitRating(rideId: string, passengerUserId: string, input: CreateRatingInput) {
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        passenger: true,
        driver: true,
        rating: true,
      },
    });

    if (!ride) {
      throw new AppError(404, "RIDE_NOT_FOUND", "Ride not found");
    }

    if (ride.passenger.userId !== passengerUserId) {
      throw new AppError(403, "FORBIDDEN", "Only the ride's passenger can rate this trip");
    }

    if (ride.status !== RideStatus.COMPLETED) {
      throw new AppError(400, "RIDE_NOT_COMPLETED", "Only completed rides can be rated");
    }

    if (ride.rating) {
      throw new AppError(409, "ALREADY_RATED", "This trip has already been rated");
    }

    if (!ride.driverId) {
      throw new AppError(400, "NO_DRIVER_ASSIGNED", "No driver was assigned to this trip");
    }

    const rating = await prisma.rating.create({
      data: {
        rideId,
        passengerId: ride.passenger.id,
        driverId: ride.driverId,
        score: input.score,
        comment: input.comment,
        tags: input.tags,
        ratedBy: UserRole.PASSENGER,
      },
    });

    // Update driver's cumulative average rating
    const allDriverRatings = await prisma.rating.findMany({
      where: { driverId: ride.driverId },
      select: { score: true },
    });

    const averageRating =
      allDriverRatings.reduce((sum, r) => sum + r.score, 0) / allDriverRatings.length;

    await prisma.driverProfile.update({
      where: { id: ride.driverId },
      data: { rating: Number(averageRating.toFixed(2)) },
    });

    return {
      ratingId: rating.id,
      score: rating.score,
      comment: rating.comment,
      tags: rating.tags,
    };
  }
}
