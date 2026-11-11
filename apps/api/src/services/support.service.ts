import crypto from "node:crypto";
import { prisma, UserRole } from "@kekego/database";
import {
  SupportCategory,
  TicketStatus,
  TicketPriority,
  NotificationType,
} from "@kekego/shared";
import type {
  CreateSupportTicketInput,
  UpdateSupportTicketStatusInput,
  SupportTicketQueryInput,
} from "@kekego/validation";
import { AppError } from "../utils/errors.js";
import { NotificationService } from "./notification.service.js";

export interface SupportTicketRecord {
  id: string;
  ticketNumber: string;
  userId: string;
  rideId?: string | null;
  category: SupportCategory;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  resolutionNote?: string | null;
  resolvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory persistent registry for test runs & fallback
export const IN_MEMORY_SUPPORT_TICKETS: Map<string, SupportTicketRecord> = new Map();

export class SupportService {
  private readonly notificationService: NotificationService;

  constructor(notificationService?: NotificationService) {
    this.notificationService = notificationService || new NotificationService();
  }

  /**
   * Create a support ticket or ride dispute
   */
  public async createTicket(
    userId: string,
    input: CreateSupportTicketInput
  ): Promise<SupportTicketRecord> {
    const id = `tick-${crypto.randomUUID()}`;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `TICK-${dateStr}-${randomSuffix}`;

    // Auto-escalate priority for safety or urgent issues
    let priority = input.priority;
    if (input.category === SupportCategory.SAFETY_INCIDENT) {
      priority = TicketPriority.URGENT_SOS;
    } else if (input.category === SupportCategory.FARE_DISPUTE && !input.priority) {
      priority = TicketPriority.HIGH;
    }

    const ticket: SupportTicketRecord = {
      id,
      ticketNumber,
      userId,
      rideId: input.rideId || null,
      category: input.category,
      subject: input.subject,
      description: input.description,
      status: TicketStatus.OPEN,
      priority,
      resolutionNote: null,
      resolvedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    IN_MEMORY_SUPPORT_TICKETS.set(id, ticket);
    IN_MEMORY_SUPPORT_TICKETS.set(ticketNumber, ticket);

    try {
      if (process.env.DATABASE_URL) {
        await prisma.supportTicket.create({
          data: {
            id,
            ticketNumber,
            userId,
            rideId: input.rideId || null,
            category: input.category as any,
            subject: input.subject,
            description: input.description,
            status: ticket.status as any,
            priority: ticket.priority as any,
          },
        });
      }
    } catch {
      // In-memory fallback
    }

    // Acknowledge ticket creation via notification
    await this.notificationService.sendNotification({
      userId,
      title: `Support Ticket Received: #${ticketNumber}`,
      body: `Your ticket "${input.subject}" has been logged with our customer operations team. Reference: ${ticketNumber}`,
      type: NotificationType.SYSTEM_ANNOUNCEMENT,
      metadata: { ticketId: id, ticketNumber },
    });

    return ticket;
  }

  /**
   * Get tickets submitted by a specific user
   */
  public async getUserTickets(userId: string) {
    const userTickets = Array.from(IN_MEMORY_SUPPORT_TICKETS.values())
      .filter((t) => t.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return userTickets;
  }

  /**
   * Get ticket by ID
   */
  public async getTicketById(ticketId: string, userId?: string, userRole?: UserRole) {
    const ticket = IN_MEMORY_SUPPORT_TICKETS.get(ticketId);
    if (!ticket) {
      throw new AppError(404, "TICKET_NOT_FOUND", "Support ticket not found");
    }

    // RBAC: user can only view their own ticket unless ADMIN
    if (userRole !== UserRole.ADMIN && userId && ticket.userId !== userId) {
      throw new AppError(403, "FORBIDDEN", "You do not have permission to view this ticket");
    }

    return ticket;
  }

  /**
   * Admin: List and filter support tickets
   */
  public async getAdminTickets(query: SupportTicketQueryInput) {
    let tickets = Array.from(IN_MEMORY_SUPPORT_TICKETS.values());

    if (query.status) {
      tickets = tickets.filter((t) => t.status === query.status);
    }
    if (query.category) {
      tickets = tickets.filter((t) => t.category === query.category);
    }
    if (query.priority) {
      tickets = tickets.filter((t) => t.priority === query.priority);
    }
    if (query.rideId) {
      tickets = tickets.filter((t) => t.rideId === query.rideId);
    }

    // Sort newest first
    tickets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = tickets.length;
    const paginated = tickets.slice(query.offset, query.offset + query.limit);

    return {
      total,
      limit: query.limit,
      offset: query.offset,
      data: paginated,
    };
  }

  /**
   * Admin: Update ticket status and resolve dispute
   */
  public async updateTicketStatus(
    ticketId: string,
    adminUserId: string,
    input: UpdateSupportTicketStatusInput
  ) {
    const ticket = IN_MEMORY_SUPPORT_TICKETS.get(ticketId);
    if (!ticket) {
      throw new AppError(404, "TICKET_NOT_FOUND", "Support ticket not found");
    }

    ticket.status = input.status;
    ticket.updatedAt = new Date();

    if (input.resolutionNote) {
      ticket.resolutionNote = input.resolutionNote;
    }

    if (input.status === TicketStatus.RESOLVED || input.status === TicketStatus.CLOSED) {
      ticket.resolvedAt = new Date();

      // Dispatch resolution notification to user
      await this.notificationService.sendNotification({
        userId: ticket.userId,
        title: `Ticket Resolved: #${ticket.ticketNumber}`,
        body: `Your ticket has been resolved by support admin: ${input.resolutionNote || "Issue investigated and resolved."}`,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        metadata: { ticketId: ticket.id, status: ticket.status },
      });
    }

    try {
      if (process.env.DATABASE_URL) {
        await prisma.supportTicket.update({
          where: { id: ticketId },
          data: {
            status: ticket.status as any,
            resolvedAt: ticket.resolvedAt,
          },
        });

        // Audit log
        await prisma.auditLog.create({
          data: {
            actorId: adminUserId,
            actorRole: UserRole.ADMIN,
            action: "SUPPORT_TICKET_STATUS_UPDATED",
            entityType: "SupportTicket",
            entityId: ticket.id,
            newValues: {
              status: ticket.status,
              resolutionNote: ticket.resolutionNote,
            },
          },
        });
      }
    } catch {
      // In-memory fallback
    }

    return ticket;
  }
}
