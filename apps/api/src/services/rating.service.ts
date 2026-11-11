import crypto from "node:crypto";
import { prisma, UserRole } from "@kekego/database";
import { RideStatus } from "@kekego/shared";
import type { CreateRatingInput } from "@kekego/validation";
import { AppError } from "../utils/errors.js";

export interface RatingRecord {
  id: string;
  rideId: string;
  passengerId: string;
  driverId: string;
  score: number;
  comment?: string | null;
  tags: string[];
  ratedBy: UserRole;
  createdAt: Date;
}

// In-memory persistent registry for testing and fallback
export const IN_MEMORY_RATINGS: Map<string, RatingRecord> = new Map();

// In-memory driver rating aggregations
export const IN_MEMORY_DRIVER_RATINGS: Map<
  string,
  { averageRating: number; totalRatings: number; tags: Record<string, number> }
> = new Map();

export class RatingService {
  /**
   * Submit rating and feedback for a completed ride
   */
  public async submitRating(params: {
    rideId: string;
    userId: string;
    userRole: UserRole;
    input: CreateRatingInput;
  }) {
    // 1. Check if rating already submitted for this ride by this role
    const existingKey = `rate:${params.rideId}:${params.userRole}`;
    if (IN_MEMORY_RATINGS.has(existingKey)) {
      throw new AppError(
        400,
        "DUPLICATE_RATING",
        "You have already submitted a rating for this trip"
      );
    }

    // 2. Validate ride state: ride must be completed!
    let driverProfileId = "driver-prof-001";
    let passengerProfileId = params.userId;

    try {
      if (process.env.DATABASE_URL) {
        const ride = await prisma.ride.findUnique({
          where: { id: params.rideId },
          include: { driver: true, passenger: true },
        });

        if (!ride) {
          throw new AppError(404, "RIDE_NOT_FOUND", "Ride not found");
        }

        if (ride.status !== RideStatus.COMPLETED) {
          throw new AppError(
            400,
            "RIDE_NOT_COMPLETED",
            "Ratings can only be submitted after the trip is completed"
          );
        }

        if (ride.driverId) driverProfileId = ride.driverId;
        if (ride.passengerId) passengerProfileId = ride.passengerId;
      }
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      // In-memory fallback
    }

    const ratingId = `rating-${crypto.randomUUID()}`;
    const record: RatingRecord = {
      id: ratingId,
      rideId: params.rideId,
      passengerId: passengerProfileId,
      driverId: driverProfileId,
      score: params.input.score,
      comment: params.input.comment || null,
      tags: params.input.tags || [],
      ratedBy: params.userRole,
      createdAt: new Date(),
    };

    IN_MEMORY_RATINGS.set(existingKey, record);
    IN_MEMORY_RATINGS.set(record.id, record);

    // 3. Update driver rating running aggregate
    const agg = IN_MEMORY_DRIVER_RATINGS.get(driverProfileId) || {
      averageRating: 5.0,
      totalRatings: 0,
      tags: {},
    };

    const newTotal = agg.totalRatings + 1;
    const newAverage =
      Number(
        ((agg.averageRating * agg.totalRatings + params.input.score) / newTotal).toFixed(2)
      );

    for (const tag of params.input.tags || []) {
      agg.tags[tag] = (agg.tags[tag] || 0) + 1;
    }

    agg.averageRating = newAverage;
    agg.totalRatings = newTotal;
    IN_MEMORY_DRIVER_RATINGS.set(driverProfileId, agg);

    try {
      if (process.env.DATABASE_URL) {
        await prisma.rating.create({
          data: {
            id: record.id,
            rideId: record.rideId,
            passengerId: record.passengerId,
            driverId: record.driverId,
            score: record.score,
            comment: record.comment,
            tags: record.tags,
            ratedBy: record.ratedBy,
          },
        });

        // Update driver profile aggregate
        await prisma.driverProfile.update({
          where: { id: driverProfileId },
          data: {
            rating: newAverage,
          },
        });
      }
    } catch {
      // In-memory fallback
    }

    return {
      ratingId: record.id,
      rideId: record.rideId,
      score: record.score,
      comment: record.comment,
      tags: record.tags,
      driverUpdatedAverage: newAverage,
      totalRatingsCount: newTotal,
    };
  }

  /**
   * Retrieve rating submitted for a ride
   */
  public async getRideRating(rideId: string) {
    for (const r of IN_MEMORY_RATINGS.values()) {
      if (r.rideId === rideId) {
        return r;
      }
    }
    return null;
  }

  /**
   * Get driver public rating summary & top tags
   */
  public async getDriverRatingSummary(driverId: string) {
    const agg = IN_MEMORY_DRIVER_RATINGS.get(driverId) || {
      averageRating: 5.0,
      totalRatings: 0,
      tags: {},
    };

    const topTags = Object.entries(agg.tags)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));

    return {
      driverId,
      averageRating: agg.averageRating,
      totalRatings: agg.totalRatings,
      topFeedbackTags: topTags,
    };
  }
}
