import type { FastifyPluginAsync } from "fastify";
import { UserRole } from "@kekego/shared";
import { paginationQuerySchema, verifyDriverSchema } from "@kekego/validation";
import { UserService } from "../services/user.service.js";
import { prisma } from "@kekego/database";

export const adminRoutes: FastifyPluginAsync = async (fastify) => {
  const userService = new UserService();

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
};
