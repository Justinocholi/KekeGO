import type { FastifyPluginAsync } from "fastify";
import { UserRole } from "@kekego/shared";
import {
  updateProfileSchema,
  updateDriverAvailabilitySchema,
} from "@kekego/validation";
import { UserService } from "../services/user.service.js";

export const userRoutes: FastifyPluginAsync = async (fastify) => {
  const userService = new UserService();

  // GET /users/me
  fastify.get(
    "/users/me",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const user = await userService.getCurrentUser(request.user.userId);
      return reply.send({
        success: true,
        data: user,
      });
    }
  );

  // PATCH /users/me
  fastify.patch(
    "/users/me",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const parseResult = updateProfileSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid update data",
            details: parseResult.error.flatten(),
          },
        });
      }

      const updated = await userService.updateUserProfile(
        request.user.userId,
        parseResult.data
      );
      return reply.send({
        success: true,
        data: updated,
      });
    }
  );

  // PATCH /users/driver/availability (DRIVER ONLY)
  fastify.patch(
    "/users/driver/availability",
    {
      preHandler: [
        fastify.authenticate,
        fastify.authorize([UserRole.DRIVER]),
      ],
    },
    async (request, reply) => {
      const parseResult = updateDriverAvailabilitySchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid availability status",
            details: parseResult.error.flatten(),
          },
        });
      }

      const driverId = request.user.driverId;
      if (!driverId) {
        return reply.status(400).send({
          success: false,
          error: {
            code: "DRIVER_PROFILE_MISSING",
            message: "Current user does not have a linked driver profile",
          },
        });
      }

      const updated = await userService.updateDriverAvailability(
        driverId,
        parseResult.data
      );
      return reply.send({
        success: true,
        data: updated,
      });
    }
  );
};
