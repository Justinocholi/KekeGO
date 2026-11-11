import type { FastifyPluginAsync } from "fastify";
import { UserRole } from "@kekego/database";
import {
  createRatingSchema,
  createSupportTicketSchema,
  updateSupportTicketStatusSchema,
  notificationQuerySchema,
  supportTicketQuerySchema,
} from "@kekego/validation";
import { RatingService } from "../services/rating.service.js";
import { NotificationService } from "../services/notification.service.js";
import { SupportService } from "../services/support.service.js";

export const feedbackRoutes: FastifyPluginAsync = async (app) => {
  const ratingService = new RatingService();
  const notificationService = new NotificationService();
  const supportService = new SupportService(notificationService);

  // --------------------------------------------------------------------------
  // 1. Ratings & Reviews Endpoints
  // --------------------------------------------------------------------------

  app.get(
    "/rides/:id/rating",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const rating = await ratingService.getRideRating(id);

      return reply.status(200).send({
        success: true,
        data: rating,
      });
    }
  );

  app.get("/drivers/:id/ratings", async (request, reply) => {
    const { id } = request.params as { id: string };
    const summary = await ratingService.getDriverRatingSummary(id);

    return reply.status(200).send({
      success: true,
      data: summary,
    });
  });

  // --------------------------------------------------------------------------
  // 2. In-App Notifications Endpoints
  // --------------------------------------------------------------------------

  app.get(
    "/notifications",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const query = notificationQuerySchema.parse(request.query);
      const user = request.user as { userId: string };

      const result = await notificationService.getUserNotifications({
        userId: user.userId,
        isRead: query.isRead,
        limit: query.limit,
        offset: query.offset,
      });

      return reply.status(200).send({
        success: true,
        data: result,
      });
    }
  );

  app.patch(
    "/notifications/:id/read",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = request.user as { userId: string };

      const updated = await notificationService.markAsRead(id, user.userId);

      return reply.status(200).send({
        success: true,
        data: updated,
      });
    }
  );

  app.patch(
    "/notifications/read-all",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = request.user as { userId: string };

      const result = await notificationService.markAllAsRead(user.userId);

      return reply.status(200).send({
        success: true,
        data: result,
      });
    }
  );

  // --------------------------------------------------------------------------
  // 3. Support Tickets & Disputes Endpoints
  // --------------------------------------------------------------------------

  app.post(
    "/support/tickets",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const input = createSupportTicketSchema.parse(request.body);
      const user = request.user as { userId: string };

      const ticket = await supportService.createTicket(user.userId, input);

      return reply.status(201).send({
        success: true,
        data: ticket,
      });
    }
  );

  app.get(
    "/support/tickets",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = request.user as { userId: string };
      const tickets = await supportService.getUserTickets(user.userId);

      return reply.status(200).send({
        success: true,
        data: tickets,
      });
    }
  );

  app.get(
    "/support/tickets/:id",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = request.user as { userId: string; role: UserRole };

      const ticket = await supportService.getTicketById(
        id,
        user.userId,
        user.role
      );

      return reply.status(200).send({
        success: true,
        data: ticket,
      });
    }
  );

  app.get(
    "/admin/support/tickets",
    { preHandler: [app.authenticate, app.authorize([UserRole.ADMIN])] },
    async (request, reply) => {
      const query = supportTicketQuerySchema.parse(request.query);
      const result = await supportService.getAdminTickets(query);

      return reply.status(200).send({
        success: true,
        data: result,
      });
    }
  );

  app.patch(
    "/admin/support/tickets/:id/status",
    { preHandler: [app.authenticate, app.authorize([UserRole.ADMIN])] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const input = updateSupportTicketStatusSchema.parse(request.body);
      const admin = request.user as { userId: string };

      const updated = await supportService.updateTicketStatus(
        id,
        admin.userId,
        input
      );

      return reply.status(200).send({
        success: true,
        data: updated,
      });
    }
  );
};
