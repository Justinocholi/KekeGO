import type {
  FastifyPluginAsync,
  FastifyRequest,
  FastifyReply,
} from "fastify";
import { UserRole } from "@kekego/database";
import {
  validatePointGeofenceSchema,
  validateTripGeofenceSchema,
  createServiceAreaSchema,
  updateServiceAreaSchema,
} from "@kekego/validation";
import { GeofenceService } from "../services/geofence.service.js";

export const geofenceRoutes: FastifyPluginAsync = async (fastify) => {
  const geofenceService = new GeofenceService();

  // POST /geofence/validate-point (Public coordinate check)
  fastify.post("/geofence/validate-point", async (request, reply) => {
    const parseResult = validatePointGeofenceSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Valid latitude and longitude coordinates are required",
          details: parseResult.error.flatten(),
        },
      });
    }

    const result = await geofenceService.validatePoint(
      parseResult.data.latitude,
      parseResult.data.longitude
    );

    return reply.send({
      success: true,
      data: result,
    });
  });

  // POST /geofence/validate-trip (Trip pickup + destination + tier policy check)
  fastify.post("/geofence/validate-trip", async (request, reply) => {
    const parseResult = validateTripGeofenceSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Valid pickup, destination, and tier are required",
          details: parseResult.error.flatten(),
        },
      });
    }

    const result = await geofenceService.validateTrip(
      parseResult.data.pickup,
      parseResult.data.destination,
      parseResult.data.tier
    );

    return reply.send({
      success: true,
      data: result,
    });
  });

  // --------------------------------------------------------------------------
  // Admin Service-Area Management Endpoints (ADMIN ONLY)
  // --------------------------------------------------------------------------

  // GET /admin/service-areas
  fastify.get(
    "/admin/service-areas",
    {
      preHandler: [
        fastify.authenticate,
        fastify.authorize([UserRole.ADMIN]),
      ],
    },
    async (_request, reply) => {
      const areas = await geofenceService.getAllServiceAreas();
      return reply.send({
        success: true,
        data: areas,
      });
    }
  );

  // GET /admin/service-areas/:id
  fastify.get(
    "/admin/service-areas/:id",
    {
      preHandler: [
        fastify.authenticate,
        fastify.authorize([UserRole.ADMIN]),
      ],
    },
    async (request, reply) => {
      const params = request.params as { id: string };
      const area = await geofenceService.getServiceAreaById(params.id);

      return reply.send({
        success: true,
        data: area,
      });
    }
  );

  // POST /admin/service-areas
  fastify.post(
    "/admin/service-areas",
    {
      preHandler: [
        fastify.authenticate,
        fastify.authorize([UserRole.ADMIN]),
      ],
    },
    async (request, reply) => {
      const parseResult = createServiceAreaSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid service area parameters or GeoJSON boundary",
            details: parseResult.error.flatten(),
          },
        });
      }

      const created = await geofenceService.createServiceArea(
        parseResult.data
      );

      return reply.status(201).send({
        success: true,
        data: created,
      });
    }
  );

  // PATCH /admin/service-areas/:id
  fastify.patch(
    "/admin/service-areas/:id",
    {
      preHandler: [
        fastify.authenticate,
        fastify.authorize([UserRole.ADMIN]),
      ],
    },
    async (request, reply) => {
      const params = request.params as { id: string };
      const parseResult = updateServiceAreaSchema.safeParse(request.body);
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

      const updated = await geofenceService.updateServiceArea(
        params.id,
        parseResult.data
      );

      return reply.send({
        success: true,
        data: updated,
      });
    }
  );

  // POST & PATCH /admin/service-areas/:id/toggle
  const handleToggle = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as { id: string };
    const body = request.body as { isActive?: boolean } | undefined;
    const updated = await geofenceService.toggleServiceArea(
      params.id,
      body?.isActive
    );

    return reply.send({
      success: true,
      data: updated,
    });
  };

  fastify.patch(
    "/admin/service-areas/:id/toggle",
    {
      preHandler: [
        fastify.authenticate,
        fastify.authorize([UserRole.ADMIN]),
      ],
    },
    handleToggle
  );

  fastify.post(
    "/admin/service-areas/:id/toggle",
    {
      preHandler: [
        fastify.authenticate,
        fastify.authorize([UserRole.ADMIN]),
      ],
    },
    handleToggle
  );
};
