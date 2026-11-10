import type { FastifyPluginAsync } from "fastify";
import { UserRole, DriverVerificationStatus, RideStatus } from "@kekego/database";
import { paginationQuerySchema, verifyDriverSchema } from "@kekego/validation";
import { UserService } from "../services/user.service.js";
import { AdminService } from "../services/admin.service.js";
import { prisma } from "@kekego/database";

export const adminRoutes: FastifyPluginAsync = async (fastify) => {
  const userService = new UserService();
  const adminService = new AdminService();

  // GET /admin/stats (ADMIN ONLY)
  fastify.get(
    "/admin/stats",
    {
      preHandler: [
        fastify.authenticate,
        fastify.authorize([UserRole.ADMIN]),
      ],
    },
    async (_request, reply) => {
      const stats = await adminService.getDashboardStats();
      return reply.send({
        success: true,
        data: stats,
      });
    }
  );

  // GET /admin/users (ADMIN ONLY)
  fastify.get(
    "/admin/users",
    {
      preHandler: [
        fastify.authenticate,
        fastify.authorize([UserRole.ADMIN]),
      ],
    },
    async (request, reply) => {
      const query = request.query as Record<string, string>;
      const parseResult = paginationQuerySchema.safeParse(query);
      const pagination = parseResult.success ? parseResult.data : { page: 1, limit: 20 };
      const roleFilter = query.role ? (query.role as UserRole) : undefined;

      const data = await userService.listUsers({
        page: pagination.page,
        limit: pagination.limit,
        role: roleFilter,
      });

      return reply.send({
        success: true,
        data: data.users,
        meta: {
          ...data.pagination,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );

  // GET /admin/drivers (ADMIN ONLY)
  fastify.get(
    "/admin/drivers",
    {
      preHandler: [
        fastify.authenticate,
        fastify.authorize([UserRole.ADMIN]),
      ],
    },
    async (request, reply) => {
      const query = request.query as Record<string, string>;
      const parseResult = paginationQuerySchema.safeParse(query);
      const pagination = parseResult.success ? parseResult.data : { page: 1, limit: 20 };
      const statusFilter = query.status ? (query.status as DriverVerificationStatus) : undefined;

      const data = await adminService.listDrivers({
        status: statusFilter,
        page: pagination.page,
        limit: pagination.limit,
      });

      return reply.send({
        success: true,
        data: data.drivers,
        meta: {
          ...data.pagination,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );

  // PATCH /admin/drivers/:id/verification (ADMIN ONLY)
  fastify.patch(
    "/admin/drivers/:id/verification",
    {
      preHandler: [
        fastify.authenticate,
        fastify.authorize([UserRole.ADMIN]),
      ],
    },
    async (request, reply) => {
      const params = request.params as { id: string };
      const parseResult = verifyDriverSchema.safeParse(request.body);

      if (!parseResult.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid verification update data",
            details: parseResult.error.flatten(),
          },
        });
      }

      const result = await userService.verifyDriver(
        request.user.userId,
        params.id,
        parseResult.data
      );

      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  // GET /admin/vehicles (ADMIN ONLY)
  fastify.get(
    "/admin/vehicles",
    {
      preHandler: [
        fastify.authenticate,
        fastify.authorize([UserRole.ADMIN]),
      ],
    },
    async (request, reply) => {
      const query = request.query as Record<string, string>;
      const parseResult = paginationQuerySchema.safeParse(query);
      const pagination = parseResult.success ? parseResult.data : { page: 1, limit: 20 };

      const data = await adminService.listVehicles({
        page: pagination.page,
        limit: pagination.limit,
      });

      return reply.send({
        success: true,
        data: data.vehicles,
        meta: {
          ...data.pagination,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );

  // GET /admin/partners (ADMIN ONLY)
  fastify.get(
    "/admin/partners",
    {
      preHandler: [
        fastify.authenticate,
        fastify.authorize([UserRole.ADMIN]),
      ],
    },
    async (_request, reply) => {
      const partners = await adminService.listPartners();
      return reply.send({
        success: true,
        data: partners,
      });
    }
  );

  // GET /admin/partners/:partnerId (ADMIN or Authorized Partner Member)
  fastify.get(
    "/admin/partners/:partnerId",
    {
      preHandler: [
        fastify.authenticate,
        fastify.authorize([UserRole.ADMIN, UserRole.PARTNER]),
        fastify.authorizePartner("partnerId"),
      ],
    },
    async (request, reply) => {
      const params = request.params as { partnerId: string };

      const partner = await prisma.partner.findUnique({
        where: { id: params.partnerId },
        include: {
          drivers: {
            select: {
              id: true,
              verificationStatus: true,
              rating: true,
              totalTrips: true,
              isOnline: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  phoneNumber: true,
                },
              },
            },
          },
          vehicles: true,
        },
      });

      if (!partner) {
        return reply.status(404).send({
          success: false,
          error: {
            code: "PARTNER_NOT_FOUND",
            message: "Partner fleet not found",
          },
        });
      }

      return reply.send({
        success: true,
        data: partner,
      });
    }
  );

  // GET /admin/rides (ADMIN ONLY)
  fastify.get(
    "/admin/rides",
    {
      preHandler: [
        fastify.authenticate,
        fastify.authorize([UserRole.ADMIN]),
      ],
    },
    async (request, reply) => {
      const query = request.query as Record<string, string>;
      const parseResult = paginationQuerySchema.safeParse(query);
      const pagination = parseResult.success ? parseResult.data : { page: 1, limit: 20 };
      const statusFilter = query.status ? (query.status as RideStatus) : undefined;

      const data = await adminService.listRides({
        status: statusFilter,
        page: pagination.page,
        limit: pagination.limit,
      });

      return reply.send({
        success: true,
        data: data.rides,
        meta: {
          ...data.pagination,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );
};
