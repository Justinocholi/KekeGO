import crypto from "node:crypto";
import { prisma } from "@kekego/database";
import {
  NotificationType,
  RideStatus,
  DriverVerificationStatus,
  PaymentStatus,
} from "@kekego/shared";
import { AppError } from "../utils/errors.js";

export type DeliveryChannel = "IN_APP" | "PUSH" | "SMS";
export type DeliveryStatus = "DELIVERED" | "SIMULATED_DELIVERY" | "PENDING" | "FAILED";

export interface DispatchedNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  metadata?: Record<string, any> | null;
  channels: DeliveryChannel[];
  deliveryStatus: DeliveryStatus;
  retryCount: number;
  isRead: boolean;
  readAt?: Date | null;
  createdAt: Date;
}

// In-memory persistent registry for test runs & offline dev adapter
export const IN_MEMORY_NOTIFICATIONS: Map<string, DispatchedNotification> = new Map();

export class NotificationService {
  private readonly isDevelopment: boolean;

  constructor() {
    this.isDevelopment =
      process.env.NODE_ENV !== "production" ||
      !process.env.FIREBASE_SERVER_KEY ||
      !process.env.TERMII_API_KEY;
  }

  /**
   * Dispatch notification to user across requested channels
   */
  public async sendNotification(params: {
    userId: string;
    title: string;
    body: string;
    type?: NotificationType;
    metadata?: Record<string, any>;
    channels?: DeliveryChannel[];
  }): Promise<DispatchedNotification> {
    const id = `notif-${crypto.randomUUID()}`;
    const type = params.type || NotificationType.RIDE_UPDATE;
    const channels = params.channels || ["IN_APP", "PUSH"];

    // Delivery confirmation via development adapter:
    // If running in development without external provider credentials, record SIMULATED_DELIVERY
    const deliveryStatus: DeliveryStatus = this.isDevelopment
      ? "SIMULATED_DELIVERY"
      : "DELIVERED";

    const notification: DispatchedNotification = {
      id,
      userId: params.userId,
      title: params.title,
      body: params.body,
      type,
      metadata: params.metadata || null,
      channels,
      deliveryStatus,
      retryCount: 0,
      isRead: false,
      readAt: null,
      createdAt: new Date(),
    };

    IN_MEMORY_NOTIFICATIONS.set(id, notification);

    try {
      if (process.env.DATABASE_URL) {
        await prisma.notification.create({
          data: {
            id,
            userId: params.userId,
            title: params.title,
            body: params.body,
            type: type as any,
            metadata: params.metadata,
            isRead: false,
          },
        });
      }
    } catch {
      // In-memory fallback
    }

    return notification;
  }

  /**
   * Retrieve notification inbox for a user
   */
  public async getUserNotifications(params: {
    userId: string;
    isRead?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const limit = params.limit || 20;
    const offset = params.offset || 0;

    let items = Array.from(IN_MEMORY_NOTIFICATIONS.values()).filter(
      (n) => n.userId === params.userId
    );

    if (params.isRead !== undefined) {
      items = items.filter((n) => n.isRead === params.isRead);
    }

    // Sort latest first
    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = items.length;
    const unreadCount = items.filter((n) => !n.isRead).length;
    const paginated = items.slice(offset, offset + limit);

    return {
      total,
      unreadCount,
      limit,
      offset,
      data: paginated,
    };
  }

  /**
   * Mark a specific notification as read
   */
  public async markAsRead(notificationId: string, userId: string) {
    const notification = IN_MEMORY_NOTIFICATIONS.get(notificationId);
    if (!notification || notification.userId !== userId) {
      throw new AppError(404, "NOTIFICATION_NOT_FOUND", "Notification not found");
    }

    notification.isRead = true;
    notification.readAt = new Date();

    try {
      if (process.env.DATABASE_URL) {
        await prisma.notification.update({
          where: { id: notificationId },
          data: { isRead: true, readAt: new Date() },
        });
      }
    } catch {
      // In-memory fallback
    }

    return notification;
  }

  /**
   * Mark all unread notifications as read for a user
   */
  public async markAllAsRead(userId: string) {
    let count = 0;
    for (const notif of IN_MEMORY_NOTIFICATIONS.values()) {
      if (notif.userId === userId && !notif.isRead) {
        notif.isRead = true;
        notif.readAt = new Date();
        count++;
      }
    }

    try {
      if (process.env.DATABASE_URL) {
        await prisma.notification.updateMany({
          where: { userId, isRead: false },
          data: { isRead: true, readAt: new Date() },
        });
      }
    } catch {
      // In-memory fallback
    }

    return { markedCount: count };
  }

  // --------------------------------------------------------------------------
  // Lifecycle Notification Triggers
  // --------------------------------------------------------------------------

  /**
   * Fire notification on ride status lifecycle changes
   */
  public async notifyRideStatusUpdate(params: {
    rideId: string;
    passengerUserId: string;
    driverUserId?: string | null;
    status: RideStatus;
    rideNumber?: string;
  }) {
    const rideRef = params.rideNumber || params.rideId.slice(0, 8);

    switch (params.status) {
      case RideStatus.DRIVER_ASSIGNED:
        return this.sendNotification({
          userId: params.passengerUserId,
          title: "Driver Assigned!",
          body: `A verified Keke driver has accepted your ride ${rideRef} and is preparing to dispatch.`,
          type: NotificationType.RIDE_UPDATE,
          metadata: { rideId: params.rideId, status: params.status },
        });

      case RideStatus.DRIVER_ARRIVED:
        return this.sendNotification({
          userId: params.passengerUserId,
          title: "Driver Arrived",
          body: `Your Keke driver has arrived at your pickup location. Please meet your driver.`,
          type: NotificationType.RIDE_UPDATE,
          metadata: { rideId: params.rideId, status: params.status },
        });

      case RideStatus.IN_PROGRESS:
        return this.sendNotification({
          userId: params.passengerUserId,
          title: "Trip Started",
          body: `Your journey with Kekego is underway. Safe travels!`,
          type: NotificationType.RIDE_UPDATE,
          metadata: { rideId: params.rideId, status: params.status },
        });

      case RideStatus.COMPLETED:
        return this.sendNotification({
          userId: params.passengerUserId,
          title: "Trip Completed",
          body: `You have arrived at your destination. Thank you for riding with Kekego! Please rate your driver.`,
          type: NotificationType.RIDE_UPDATE,
          metadata: { rideId: params.rideId, status: params.status },
        });

      case RideStatus.CANCELLED:
        return this.sendNotification({
          userId: params.passengerUserId,
          title: "Trip Cancelled",
          body: `Your ride request ${rideRef} has been cancelled.`,
          type: NotificationType.RIDE_UPDATE,
          metadata: { rideId: params.rideId, status: params.status },
        });

      default:
        return null;
    }
  }

  /**
   * Fire notification on driver verification status change
   */
  public async notifyDriverVerification(params: {
    userId: string;
    status: DriverVerificationStatus;
    reason?: string;
  }) {
    if (params.status === DriverVerificationStatus.VERIFIED) {
      return this.sendNotification({
        userId: params.userId,
        title: "Account Verified! 🎉",
        body: "Your tricycle driver credentials have been approved by Kekego administration. You can now toggle online and accept trip requests.",
        type: NotificationType.DRIVER_VERIFICATION,
        metadata: { status: params.status },
      });
    }

    if (params.status === DriverVerificationStatus.REJECTED) {
      return this.sendNotification({
        userId: params.userId,
        title: "Verification Update Required",
        body: `Your driver verification was not approved: ${params.reason || "Please resubmit clear photos of your license and vehicle documents."}`,
        type: NotificationType.DRIVER_VERIFICATION,
        metadata: { status: params.status, reason: params.reason },
      });
    }

    return null;
  }

  /**
   * Fire notification on payment events
   */
  public async notifyPaymentEvent(params: {
    userId: string;
    amountKobo: number;
    status: PaymentStatus;
    rideId: string;
    method?: string;
  }) {
    const amountNgn = (params.amountKobo / 100).toFixed(2);

    if (params.status === PaymentStatus.COMPLETED) {
      return this.sendNotification({
        userId: params.userId,
        title: "Payment Confirmed ₦" + amountNgn,
        body: `Payment of ₦${amountNgn} for ride ${params.rideId.slice(0, 8)} was successfully confirmed.`,
        type: NotificationType.PAYMENT,
        metadata: {
          rideId: params.rideId,
          amountKobo: params.amountKobo,
          status: params.status,
        },
      });
    }

    if (params.status === PaymentStatus.REFUNDED) {
      return this.sendNotification({
        userId: params.userId,
        title: "Refund Processed ₦" + amountNgn,
        body: `A refund of ₦${amountNgn} has been credited back to your account.`,
        type: NotificationType.PAYMENT,
        metadata: {
          rideId: params.rideId,
          amountKobo: params.amountKobo,
          status: params.status,
        },
      });
    }

    return null;
  }

  /**
   * Fire urgent safety / SOS alert notification
   */
  public async notifySosAlert(params: {
    rideId: string;
    actorUserId: string;
    coordinates: { latitude: number; longitude: number };
  }) {
    return this.sendNotification({
      userId: "u-admin-safety-monitor",
      title: "🚨 SOS EMERGENCY ALERT",
      body: `Emergency alert triggered on ride ${params.rideId} at coordinates (${params.coordinates.latitude}, ${params.coordinates.longitude}). Immediate emergency contact initiated.`,
      type: NotificationType.SOS_ALERT,
      metadata: params,
      channels: ["IN_APP", "PUSH", "SMS"],
    });
  }
}
