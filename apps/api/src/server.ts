import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { env } from "./config/env.js";
import { healthRoutes } from "./routes/health.js";

export async function createServer(): Promise<FastifyInstance> {
  const isProd = env.NODE_ENV === "production";

  const app = Fastify({
    logger: {
      level: isProd ? "info" : "debug",
    },
    trustProxy: true,
  });

  // Security headers & CORS
  await app.register(helmet, {
    contentSecurityPolicy: isProd,
  });

  await app.register(cors, {
    origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","),
    credentials: true,
  });

  // Health and readiness routes
  await app.register(healthRoutes);

  // Global not found handler
  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: `Route ${request.method} ${request.url} not found`,
      },
    });
  });

  // Global error handler
  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    const statusCode = error.statusCode ?? 500;
    reply.status(statusCode).send({
      success: false,
      error: {
        code: error.code ?? "INTERNAL_SERVER_ERROR",
        message:
          statusCode === 500 && isProd
            ? "An unexpected error occurred"
            : error.message,
      },
    });
  });

  return app;
}
