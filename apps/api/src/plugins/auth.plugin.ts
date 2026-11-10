import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import { UserRole } from "@kekego/database";
import { env } from "../config/env.js";
import "../types/auth.js";

const authPluginCallback: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyJwt, {
    secret: env.JWT_ACCESS_SECRET,
  });

  // Authenticate hook decorator
  fastify.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication token is missing, expired, or invalid",
          },
        });
      }
    }
  );

  // Role authorization hook decorator factory
  fastify.decorate(
    "authorize",
    (allowedRoles: UserRole[]) => {
      return async (request: FastifyRequest, reply: FastifyReply) => {
        const user = request.user;
        if (!user || !user.role) {
          return reply.status(401).send({
            success: false,
            error: {
              code: "UNAUTHORIZED",
              message: "Authentication required",
            },
          });
        }

        if (!allowedRoles.includes(user.role)) {
          return reply.status(403).send({
            success: false,
            error: {
              code: "FORBIDDEN",
              message: `Access denied. Requires one of roles: [${allowedRoles.join(", ")}]`,
            },
          });
        }
      };
    }
  );

  // Partner tenant isolation check
  fastify.decorate(
    "authorizePartner",
    (targetPartnerIdParamName = "partnerId") => {
      return async (request: FastifyRequest, reply: FastifyReply) => {
        const user = request.user;
        if (!user || !user.role) {
          return reply.status(401).send({
            success: false,
            error: {
              code: "UNAUTHORIZED",
              message: "Authentication required",
            },
          });
        }

        // Global ADMINs can access all partners
        if (user.role === UserRole.ADMIN) {
          return;
        }

        // PARTNER users can only access their own partner data
        const params = request.params as Record<string, string>;
        const query = request.query as Record<string, string>;
        const requestedPartnerId = params[targetPartnerIdParamName] ?? query[targetPartnerIdParamName];

        if (user.role === UserRole.PARTNER) {
          if (!user.partnerId || (requestedPartnerId && user.partnerId !== requestedPartnerId)) {
            return reply.status(403).send({
              success: false,
              error: {
                code: "CROSS_PARTNER_ACCESS_DENIED",
                message: "Access forbidden: you do not have permission to view other fleet partner data",
              },
            });
          }
          return;
        }

        return reply.status(403).send({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Only fleet partners or administrators can access partner resources",
          },
        });
      };
    }
  );
};

export const authPlugin = fp(authPluginCallback);

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authorize: (
      allowedRoles: UserRole[]
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authorizePartner: (
      targetPartnerIdParamName?: string
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
