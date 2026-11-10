import type { FastifyPluginAsync } from "fastify";

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/health", async (_request, _reply) => {
    return {
      status: "ok",
      service: "kekego-api",
      version: "0.1.0",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV ?? "development",
    };
  });

  fastify.get("/ready", async (_request, _reply) => {
    return {
      status: "ready",
      timestamp: new Date().toISOString(),
      checks: {
        server: "up",
      },
    };
  });
};
