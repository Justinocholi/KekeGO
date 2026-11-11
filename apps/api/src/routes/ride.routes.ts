import type { FastifyPluginAsync } from "fastify";
import { UserRole } from "@kekego/database";
import {
  rideEstimateRequestSchema,
  createRideRequestSchema,
  cancelRideSchema,
  createRatingSchema,
  paginationQuerySchema,
  updateRideStatusSchema,
  nearbyDriversQuerySchema,
  rejectRideSchema,
} from "@kekego/validation";
import { RideService } from "../services/ride.service.js";
import { RatingService } from "../services/rating.service.js";

export const rideRoutes: FastifyPluginAsync = async (fastify) => {
  const rideService = new RideService();
  const ratingService = new RatingService();

  // POST /rides/estimate (Fare estimation across tiers)
  fastify.post("/rides/estimate", async (request, reply) => {
    const parseResult = rideEstimateRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid coordinates for pickup or destination",
          details: parseResult.error.flatten(),
        },
      });
    }

    const estimates = await rideService.estimateFare(parseResult.data);
    return reply.send({
      success: true,
      data: estimates,
    });
  });

  // GET /rides/nearby-drivers (Anonymized nearby tricycles for map canvas)
  fastify.get("/rides/nearby-drivers", async (request, reply) => {
    const parseResult = nearbyDriversQuerySchema.safeParse(request.query);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Valid latitude and longitude are required",
          details: parseResult.error.flatten(),
        },
      });
    }

    const drivers = await rideService.getNearbyDrivers(
      parseResult.data.latitude,
      parseResult.data.longitude,
      parseResult.data.radiusMeters,
      parseResult.data.tier
    );

    return reply.send({
      success: true,
      data: drivers,
    });
  });

  // POST /rides (Create ride request, PASSENGER ONLY)
  fastify.post(
    "/rides",
    {
      preHandler: [
        fastify.authenticate,
        fastify.authorize([UserRole.PASSENGER]),
      ],
    },
    async (request, reply) => {
      const parseResult = createRideRequestSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid ride request parameters",
            details: parseResult.error.flatten(),
          },
        });
      }

      const ride = await rideService.createRide(
        request.user.userId,
        parseResult.data
      );

      return reply.status(201).send({
        success: true,
        data: ride,
      });
    }
  );

  // GET /rides/history (Passenger trip history)
  fastify.get(
    "/rides/history",
    {
      preHandler: [
        fastify.authenticate,
        fastify.authorize([UserRole.PASSENGER]),
      ],
    },
    async (request, reply) => {
      const query = request.query as Record<string, string>;
      const parseResult = paginationQuerySchema.safeParse(query);
      const pagination = parseResult.success
        ? parseResult.data
        : { page: 1, limit: 20 };

      const history = await rideService.getPassengerHistory(
        request.user.userId,
        pagination.page,
        pagination.limit
      );

      return reply.send({
        success: true,
        data: history.rides,
        meta: history.pagination,
      });
    }
  );

  // GET /rides/:id (Ride details & status tracking)
  fastify.get(
    "/rides/:id",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const params = request.params as { id: string };
      const ride = await rideService.getRideById(
        params.id,
        request.user.userId,
        request.user.role as UserRole
      );

      return reply.send({
        success: true,
        data: ride,
      });
    }
  );

  // POST /rides/:id/cancel (Cancel active ride)
  fastify.post(
    "/rides/:id/cancel",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const params = request.params as { id: string };
      const parseResult = cancelRideSchema.safeParse(request.body || {});
      const reason = parseResult.success ? parseResult.data.reason : undefined;

      const result = await rideService.cancelRide(
        params.id,
        request.user.userId,
        request.user.role as UserRole,
        reason
      );

      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  // POST /rides/:id/rating (Submit trip review & rating)
  fastify.post(
    "/rides/:id/rating",
    {
      preHandler: [
        fastify.authenticate,
        fastify.authorize([UserRole.PASSENGER]),
      ],
    },
    async (request, reply) => {
      const params = request.params as { id: string };
      const parseResult = createRatingSchema.safeParse(request.body);

      if (!parseResult.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Valid score between 1 and 5 is required",
            details: parseResult.error.flatten(),
          },
        });
      }

      const rating = await ratingService.submitRating({
        rideId: params.id,
        userId: request.user.userId,
        userRole: UserRole.PASSENGER,
        input: parseResult.data,
      });

      return reply.status(201).send({
        success: true,
        data: rating,
      });
    }
  );

  // GET /rides/driver/dispatches (Available incoming dispatches, DRIVER ONLY)
  fastify.get(
    "/rides/driver/dispatches",
    {
      preHandler: [
        fastify.authenticate,
        fastify.authorize([UserRole.DRIVER]),
      ],
    },
    async (request, reply) => {
      const dispatches = await rideService.getAvailableDispatches(
        request.user.userId
      );
      return reply.send({
        success: true,
        data: dispatches,
      });
    }
  );

  // POST /rides/:id/accept (Driver accepts a dispatch, DRIVER ONLY)
  fastify.post(
    "/rides/:id/accept",
    {
      preHandler: [
        fastify.authenticate,
        fastify.authorize([UserRole.DRIVER]),
      ],
    },
    async (request, reply) => {
      const params = request.params as { id: string };
      const ride = await rideService.acceptRide(
        params.id,
        request.user.userId
      );

      return reply.send({
        success: true,
        data: ride,
      });
    }
  );

  // POST /rides/:id/reject (Driver rejects dispatch, DRIVER ONLY)
  fastify.post(
    "/rides/:id/reject",
    {
      preHandler: [
        fastify.authenticate,
        fastify.authorize([UserRole.DRIVER]),
      ],
    },
    async (request, reply) => {
      const params = request.params as { id: string };
      const parseResult = rejectRideSchema.safeParse(request.body || {});
      const reason = parseResult.success ? parseResult.data.reason : "UNAVAILABLE";
      const comment = parseResult.success ? parseResult.data.comment : undefined;

      const result = await rideService.rejectRide(
        params.id,
        request.user.userId,
        reason,
        comment
      );

      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  // POST /rides/:id/dispatch (Initiate or retry matching)
  fastify.post(
    "/rides/:id/dispatch",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const params = request.params as { id: string };
      const body = request.body as { radiusMeters?: number } | undefined;
      const result = await rideService.dispatchService.dispatchRide(params.id, {
        radiusMeters: body?.radiusMeters,
      });

      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  // GET /rides/:id/dispatch-history (Inspect dispatch attempts history)
  fastify.get(
    "/rides/:id/dispatch-history",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const params = request.params as { id: string };
      const history = await rideService.getDispatchHistory(params.id);

      return reply.send({
        success: true,
        data: history,
      });
    }
  );

  // GET /admin/dispatch/active (Admin active dispatch queue monitor, ADMIN ONLY)
  fastify.get(
    "/admin/dispatch/active",
    {
      preHandler: [
        fastify.authenticate,
        fastify.authorize([UserRole.ADMIN]),
      ],
    },
    async (_request, reply) => {
      const active = await rideService.dispatchService.getActiveDispatches();
      return reply.send({
        success: true,
        data: active,
      });
    }
  );

  // PATCH /rides/:id/status (Driver advances trip status, DRIVER ONLY)
  fastify.patch(
    "/rides/:id/status",
    {
      preHandler: [
        fastify.authenticate,
        fastify.authorize([UserRole.DRIVER]),
      ],
    },
    async (request, reply) => {
      const params = request.params as { id: string };
      const parseResult = updateRideStatusSchema.safeParse(request.body);

      if (!parseResult.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid status update payload",
            details: parseResult.error.flatten(),
          },
        });
      }

      const result = await rideService.updateRideStatus(
        params.id,
        request.user.userId,
        parseResult.data
      );

      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  // GET /rides/driver/active (Driver's currently active assigned trip)
  fastify.get(
    "/rides/driver/active",
    {
      preHandler: [
        fastify.authenticate,
        fastify.authorize([UserRole.DRIVER]),
      ],
    },
    async (request, reply) => {
      const activeTrip = await rideService.getDriverActiveRide(
        request.user.userId
      );

      return reply.send({
        success: true,
        data: activeTrip,
      });
    }
  );

  // GET /rides/driver/history (Driver trip settlements & earnings)
  fastify.get(
    "/rides/driver/history",
    {
      preHandler: [
        fastify.authenticate,
        fastify.authorize([UserRole.DRIVER]),
      ],
    },
    async (request, reply) => {
      const query = request.query as Record<string, string>;
      const parseResult = paginationQuerySchema.safeParse(query);
      const pagination = parseResult.success
        ? parseResult.data
        : { page: 1, limit: 20 };

      const history = await rideService.getDriverHistory(
        request.user.userId,
        pagination.page,
        pagination.limit
      );

      return reply.send({
        success: true,
        data: history.rides,
        meta: history.pagination,
      });
    }
  );

  // GET /rides/driver/earnings (Driver dashboard metrics & wallet)
  fastify.get(
    "/rides/driver/earnings",
    {
      preHandler: [
        fastify.authenticate,
        fastify.authorize([UserRole.DRIVER]),
      ],
    },
    async (request, reply) => {
      const earnings = await rideService.getDriverEarningsSummary(
        request.user.userId
      );

      return reply.send({
        success: true,
        data: earnings,
      });
    }
  );
};
