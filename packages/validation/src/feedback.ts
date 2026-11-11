import { z } from "zod";
import {
  SupportCategory,
  TicketStatus,
  TicketPriority,
} from "@kekego/shared";

/**
 * Support ticket and dispute creation schema
 */
export const createSupportTicketSchema = z.object({
  rideId: z.string().min(1).optional(),
  category: z.nativeEnum(SupportCategory).default(SupportCategory.ACCOUNT_ISSUE),
  subject: z
    .string()
    .min(5, "Subject must be at least 5 characters")
    .max(150, "Subject cannot exceed 150 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description cannot exceed 2000 characters"),
  priority: z.nativeEnum(TicketPriority).default(TicketPriority.MEDIUM),
});

export type CreateSupportTicketInput = z.infer<typeof createSupportTicketSchema>;

/**
 * Admin support ticket status update schema
 */
export const updateSupportTicketStatusSchema = z.object({
  status: z.nativeEnum(TicketStatus),
  resolutionNote: z
    .string()
    .max(1000, "Resolution note cannot exceed 1000 characters")
    .optional(),
});

export type UpdateSupportTicketStatusInput = z.infer<
  typeof updateSupportTicketStatusSchema
>;

/**
 * Notification list query schema
 */
export const notificationQuerySchema = z.object({
  isRead: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type NotificationQueryInput = z.infer<typeof notificationQuerySchema>;

/**
 * Support ticket filter query schema
 */
export const supportTicketQuerySchema = z.object({
  status: z.nativeEnum(TicketStatus).optional(),
  category: z.nativeEnum(SupportCategory).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  rideId: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type SupportTicketQueryInput = z.infer<typeof supportTicketQuerySchema>;
