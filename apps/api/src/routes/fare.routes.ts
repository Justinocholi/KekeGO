import type { FastifyPluginAsync } from "fastify";
import { UserRole } from "@kekego/database";
import {
  createFareRuleSchema,
  updateFareRuleSchema,
  fareEstimateQuerySchema,
} from "@kekego/validation";
import { FareService } from "../services/fare.service.js";
import { AppError } from "../utils/errors.js";

export const fareRoutes: FastifyPluginAsync = async (fastify) => {
  const fareService = new FareService();

  // -------------------------------------------------------------
  // Public / Passenger / Driver Routes
  // -------------------------------------------------------------

  /**
   * GET /fare/rules
   * Retrieve active pricing rules for supported tiers
   */
  fastify.get("/fare/rules", async (_request, reply) => {
    const rules = await fareService.listFareRules();
    const activeRules = rules.filter((r) => r.isActive);

    return reply.send({
      success: true,
      data: activeRules,
    });
  });

  /**
   * POST /fare/estimate
   * Calculate fare estimates across tiers with spatial geofence validation
   */
  fastify.post("/fare/estimate", async (request, reply) => {
    const parsed = fareEstimateQuerySchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid fare estimate request", {
        details: parsed.error.format(),
      });
    }

    const estimate = await fareService.estimateFare(parsed.data);

    return reply.send({
      success: true,
      data: estimate,
    });
  });

  /**
   * GET /rides/:id/fare-breakdown
   * Retrieve immutable fare breakdown snapshot for a specific trip
   */
  fastify.get(
    "/rides/:id/fare-breakdown",
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const breakdown = await fareService.getFareBreakdownSnapshot(id);

      if (!breakdown) {
        throw new AppError(
          404,
          "FARE_BREAKDOWN_NOT_FOUND",
          "Fare breakdown snapshot not found for this ride"
        );
      }

      return reply.send({
        success: true,
        data: breakdown,
      });
    }
  );

  // -------------------------------------------------------------
  // Admin Pricing Administration Routes
  // -------------------------------------------------------------

  /**
   * GET /admin/fare-rules
   * Admin list of all pricing rules (both active & historical versions)
   */
  fastify.get(
    "/admin/fare-rules",
    {
      preHandler: [fastify.authenticate, fastify.authorize([UserRole.ADMIN])],
    },
    async (_request, reply) => {
      const rules = await fareService.listFareRules();

      return reply.send({
        success: true,
        data: rules,
      });
    }
  );

  /**
   * POST /admin/fare-rules
   * Admin create / deploy a new fare rule (auto-increments version and deactivates previous)
   */
  fastify.post(
    "/admin/fare-rules",
    {
      preHandler: [fastify.authenticate, fastify.authorize([UserRole.ADMIN])],
    },
    async (request, reply) => {
      const parsed = createFareRuleSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(
          400,
          "VALIDATION_ERROR",
          "Invalid fare rule payload",
          { details: parsed.error.format() }
        );
      }

      const user = request.user!;
      const created = await fareService.setFareRule(user.userId, parsed.data);

      return reply.status(201).send({
        success: true,
        data: created,
      });
    }
  );

  /**
   * PUT /admin/fare-rules/:id
   * Admin update or supersede an existing fare rule (preserves audit history)
   */
  fastify.put(
    "/admin/fare-rules/:id",
    {
      preHandler: [fastify.authenticate, fastify.authorize([UserRole.ADMIN])],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = updateFareRuleSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(
          400,
          "VALIDATION_ERROR",
          "Invalid fare rule update payload",
          { details: parsed.error.format() }
        );
      }

      const user = request.user!;
      const updated = await fareService.updateFareRule(
        user.userId,
        id,
        parsed.data
      );

      return reply.send({
        success: true,
        data: updated,
      });
    }
  );
};
