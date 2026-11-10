import type { FastifyPluginAsync } from "fastify";
import {
  registerPassengerSchema,
  registerDriverSchema,
  loginSchema,
  refreshTokenSchema,
  provisionAdminSchema,
} from "@kekego/validation";
import { AuthService } from "../services/auth.service.js";

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  const authService = new AuthService(fastify);

  // POST /auth/register/passenger
  fastify.post("/auth/register/passenger", async (request, reply) => {
    const parseResult = registerPassengerSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid registration data",
          details: parseResult.error.flatten(),
        },
      });
    }

    const data = await authService.registerPassenger(parseResult.data);
    return reply.status(201).send({
      success: true,
      data,
    });
  });

  // POST /auth/register/driver
  fastify.post("/auth/register/driver", async (request, reply) => {
    const parseResult = registerDriverSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid driver registration data",
          details: parseResult.error.flatten(),
        },
      });
    }

    const data = await authService.registerDriver(parseResult.data);
    return reply.status(201).send({
      success: true,
      data,
    });
  });

  // POST /auth/login (Rate limited)
  fastify.post(
    "/auth/login",
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 minute",
        },
      },
    },
    async (request, reply) => {
      const parseResult = loginSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Identifier and password are required",
            details: parseResult.error.flatten(),
          },
        });
      }

      const data = await authService.login(parseResult.data);
      return reply.send({
        success: true,
        data,
      });
    }
  );

  // POST /auth/refresh
  fastify.post("/auth/refresh", async (request, reply) => {
    const parseResult = refreshTokenSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Refresh token is required",
        },
      });
    }

    const data = await authService.refreshToken(parseResult.data.refreshToken);
    return reply.send({
      success: true,
      data,
    });
  });

  // POST /auth/logout
  fastify.post(
    "/auth/logout",
    { preHandler: [fastify.authenticate] },
    async (_request, reply) => {
      // In JWT stateless auth, logout confirms client token invalidation
      return reply.send({
        success: true,
        message: "Logged out successfully",
      });
    }
  );

  // POST /auth/admin/provision (Protected by bootstrap secret)
  fastify.post("/auth/admin/provision", async (request, reply) => {
    const parseResult = provisionAdminSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid admin provisioning request",
          details: parseResult.error.flatten(),
        },
      });
    }

    const data = await authService.provisionAdmin(parseResult.data);
    return reply.status(201).send({
      success: true,
      data,
    });
  });
};
