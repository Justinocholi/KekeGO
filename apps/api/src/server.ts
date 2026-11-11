import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { env } from "./config/env.js";
import { authPlugin } from "./plugins/auth.plugin.js";
import { healthRoutes } from "./routes/health.js";
import { authRoutes } from "./routes/auth.routes.js";
import { userRoutes } from "./routes/user.routes.js";
import { adminRoutes } from "./routes/admin.routes.js";
import { rideRoutes } from "./routes/ride.routes.js";
import { geofenceRoutes } from "./routes/geofence.routes.js";
import { fareRoutes } from "./routes/fare.routes.js";
import { AppError } from "./utils/errors.js";
import { SocketService } from "./services/socket.service.js";

declare module "fastify" {
  interface FastifyInstance {
    socketService: SocketService;
  }
}

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

  // Rate Limiting (Default 100 requests per minute)
  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  // Global error handler (MUST be registered before routes in Fastify)
  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      });
    }

    const statusCode = (error as { statusCode?: number }).statusCode ?? 500;
    const code = (error as { code?: string }).code ?? "INTERNAL_SERVER_ERROR";
    const message =
      statusCode === 500 && isProd
        ? "An unexpected error occurred"
        : error.message;

    return reply.status(statusCode).send({
      success: false,
      error: {
        code,
        message,
      },
    });
  });

  // Global not found handler
  app.setNotFoundHandler((request, reply) => {
    return reply.status(404).send({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: `Route ${request.method} ${request.url} not found`,
      },
    });
  });

  // Auth Plugin (JWT + decorators)
  await app.register(authPlugin);

  // Initialize Socket.IO Real-Time Service
  const socketService = new SocketService(app);
  app.decorate("socketService", socketService);

  // Gracefully close Socket.IO on Fastify shutdown
  app.addHook("onClose", async () => {
    await socketService.close();
  });

  // Routes
  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(userRoutes);
  await app.register(adminRoutes);
  await app.register(rideRoutes);
  await app.register(geofenceRoutes);
  await app.register(fareRoutes);

  return app;
}
