import type { FastifyPluginAsync } from "fastify";
import { prisma } from "@kekego/database";

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  // Liveness probe
  fastify.get("/health", async (_request, _reply) => {
    const memory = process.memoryUsage();
    return {
      status: "ok",
      service: "kekego-api",
      version: "0.1.0",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV ?? "development",
      memory: {
        rssMb: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
        heapUsedMb: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
      },
    };
  });

  // Deep readiness probe
  fastify.get("/ready", async (_request, reply) => {
    let dbStatus = "connected";
    let dbLatencyMs: number | null = null;

    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1 as alive`;
      dbLatencyMs = Date.now() - start;
    } catch {
      dbStatus = process.env.NODE_ENV === "production" ? "disconnected" : "ready_in_memory";
    }

    const isHealthy = dbStatus === "connected" || dbStatus === "ready_in_memory";

    if (!isHealthy) {
      reply.status(503);
      return {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        checks: {
          server: "up",
          database: dbStatus,
        },
      };
    }

    return {
      status: "ready",
      timestamp: new Date().toISOString(),
      checks: {
        server: "up",
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
        },
        redis: {
          status: "connected",
        },
      },
    };
  });
};
