import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { createServer } from "../server.js";
import { NotificationService } from "../services/notification.service.js";
import {
  NotificationType,
  SupportCategory,
  TicketStatus,
  TicketPriority,
  RideStatus,
  DriverVerificationStatus,
  PaymentStatus,
} from "@kekego/shared";
import { UserRole } from "@kekego/database";

describe("Phase 12: Notifications, Ratings, and Support Engine", () => {
  let app: FastifyInstance;
  let notificationService: NotificationService;

  let adminToken: string;
  let passengerToken: string;

  const testPassengerId = "u-passenger-feedback-001";
  const testDriverId = "u-driver-feedback-001";

  beforeAll(async () => {
    app = await createServer();
    await app.ready();

    notificationService = new NotificationService();

    adminToken = app.jwt.sign({
      userId: "u-admin-feedback-001",
      role: UserRole.ADMIN,
      phoneNumber: "+2348099990001",
    });

    passengerToken = app.jwt.sign({
      userId: testPassengerId,
      role: UserRole.PASSENGER,
      phoneNumber: "+2348011110001",
    });
  });

  afterAll(async () => {
    await app.close();
  });

  // --------------------------------------------------------------------------
  // 1. Ratings & Driver Aggregate Recalculation
  // --------------------------------------------------------------------------
  describe("Ratings & Reviews Lifecycle", () => {
    it("should submit a 5-star rating for a completed ride and update driver average", async () => {
      const testRideId = "ride-feedback-001";

      const res = await app.inject({
        method: "POST",
        url: `/rides/${testRideId}/rating`,
        headers: {
          authorization: `Bearer ${passengerToken}`,
        },
        payload: {
          score: 5,
          comment: "Driver was very polite and Keke was spotless!",
          tags: ["Clean Keke", "Safe driving", "Polite"],
        },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.score).toBe(5);
      expect(body.data.tags).toContain("Clean Keke");
      expect(body.data.driverUpdatedAverage).toBe(5.0);
      expect(body.data.totalRatingsCount).toBe(1);
    });

    it("should reject duplicate rating for the same trip by the same user role (400)", async () => {
      const testRideId = "ride-feedback-001";

      const res = await app.inject({
        method: "POST",
        url: `/rides/${testRideId}/rating`,
        headers: {
          authorization: `Bearer ${passengerToken}`,
        },
        payload: {
          score: 4,
          comment: "Attempting duplicate review",
        },
      });

      expect(res.statusCode).toBe(400);
      const body = res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("DUPLICATE_RATING");
    });

    it("GET /rides/:id/rating should retrieve submitted review for a trip", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/rides/ride-feedback-001/rating",
        headers: {
          authorization: `Bearer ${passengerToken}`,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.score).toBe(5);
      expect(body.data.tags).toContain("Polite");
    });

    it("GET /drivers/:id/ratings should return driver aggregate summary and top tags", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/drivers/driver-prof-001/ratings",
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.averageRating).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(body.data.topFeedbackTags)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Notifications & Delivery Adapter
  // --------------------------------------------------------------------------
  describe("Notifications & Development Delivery Adapter", () => {
    it("should trigger ride lifecycle notification and record in-app delivery", async () => {
      const notif = await notificationService.notifyRideStatusUpdate({
        rideId: "ride-notif-001",
        passengerUserId: testPassengerId,
        status: RideStatus.DRIVER_ASSIGNED,
        rideNumber: "KEKE-9921",
      });

      expect(notif).toBeDefined();
      expect(notif?.title).toBe("Driver Assigned!");
      expect(notif?.type).toBe(NotificationType.RIDE_UPDATE);
      expect(notif?.deliveryStatus).toBe("SIMULATED_DELIVERY");
      expect(notif?.isRead).toBe(false);
    });

    it("should trigger driver verification notification on approval", async () => {
      const notif = await notificationService.notifyDriverVerification({
        userId: testDriverId,
        status: DriverVerificationStatus.VERIFIED,
      });

      expect(notif).toBeDefined();
      expect(notif?.title).toContain("Account Verified");
      expect(notif?.type).toBe(NotificationType.DRIVER_VERIFICATION);
    });

    it("should trigger payment confirmation notification", async () => {
      const notif = await notificationService.notifyPaymentEvent({
        userId: testPassengerId,
        amountKobo: 75000,
        status: PaymentStatus.COMPLETED,
        rideId: "ride-pay-notif-001",
      });

      expect(notif).toBeDefined();
      expect(notif?.title).toContain("Payment Confirmed ₦750.00");
      expect(notif?.type).toBe(NotificationType.PAYMENT);
    });

    it("should trigger SOS emergency alert notification with coordinates", async () => {
      const notif = await notificationService.notifySosAlert({
        rideId: "ride-sos-001",
        actorUserId: testPassengerId,
        coordinates: { latitude: 8.498, longitude: 8.518 },
      });

      expect(notif).toBeDefined();
      expect(notif?.title).toContain("SOS EMERGENCY ALERT");
      expect(notif?.type).toBe(NotificationType.SOS_ALERT);
      expect(notif?.channels).toContain("SMS");
    });

    it("GET /notifications should retrieve user mailbox and unread count", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/notifications",
        headers: {
          authorization: `Bearer ${passengerToken}`,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.total).toBeGreaterThan(0);
      expect(body.data.unreadCount).toBeGreaterThan(0);
      expect(Array.isArray(body.data.data)).toBe(true);
    });

    it("PATCH /notifications/:id/read should mark a notification as read", async () => {
      // Fetch first notification
      const listRes = await app.inject({
        method: "GET",
        url: "/notifications",
        headers: {
          authorization: `Bearer ${passengerToken}`,
        },
      });
      const firstNotif = listRes.json().data.data[0];

      const readRes = await app.inject({
        method: "PATCH",
        url: `/notifications/${firstNotif.id}/read`,
        headers: {
          authorization: `Bearer ${passengerToken}`,
        },
      });

      expect(readRes.statusCode).toBe(200);
      const readBody = readRes.json();
      expect(readBody.success).toBe(true);
      expect(readBody.data.isRead).toBe(true);
      expect(readBody.data.readAt).toBeDefined();
    });

    it("PATCH /notifications/read-all should mark all user notifications read", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: "/notifications/read-all",
        headers: {
          authorization: `Bearer ${passengerToken}`,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.markedCount).toBeGreaterThanOrEqual(0);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Support Tickets & Ride Dispute Resolution Workflow
  // --------------------------------------------------------------------------
  describe("Support Tickets & Dispute Resolution", () => {
    let createdTicketId: string;
    let createdTicketNumber: string;

    it("should submit a support ticket / dispute and auto-generate ticket number", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/support/tickets",
        headers: {
          authorization: `Bearer ${passengerToken}`,
        },
        payload: {
          rideId: "ride-dispute-001",
          category: SupportCategory.FARE_DISPUTE,
          subject: "Driver requested cash beyond agreed app fare",
          description: "Driver claimed fuel pump price in Karu was higher and refused to move without ₦300 extra.",
          priority: TicketPriority.HIGH,
        },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.ticketNumber).toMatch(/^TICK-\d{8}-\d{4}$/);
      expect(body.data.status).toBe(TicketStatus.OPEN);
      expect(body.data.priority).toBe(TicketPriority.HIGH);

      createdTicketId = body.data.id;
      createdTicketNumber = body.data.ticketNumber;
    });

    it("should auto-escalate SAFETY_INCIDENT to URGENT_SOS priority", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/support/tickets",
        headers: {
          authorization: `Bearer ${passengerToken}`,
        },
        payload: {
          category: SupportCategory.SAFETY_INCIDENT,
          subject: "Reckless driving along Keffi Express",
          description: "Tricycle was overloaded with 4 passengers and speeding into oncoming traffic.",
        },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.data.priority).toBe(TicketPriority.URGENT_SOS);
    });

    it("GET /support/tickets should return passenger submitted tickets", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/support/tickets",
        headers: {
          authorization: `Bearer ${passengerToken}`,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
    });

    it("GET /support/tickets/:id should return ticket details for owner", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/support/tickets/${createdTicketId}`,
        headers: {
          authorization: `Bearer ${passengerToken}`,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.ticketNumber).toBe(createdTicketNumber);
    });

    it("GET /admin/support/tickets should list and filter tickets for operations admin", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/admin/support/tickets?limit=10",
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.total).toBeGreaterThan(0);
      expect(Array.isArray(body.data.data)).toBe(true);
    });

    it("PATCH /admin/support/tickets/:id/status should allow admin to resolve dispute", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/admin/support/tickets/${createdTicketId}/status`,
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: {
          status: TicketStatus.RESOLVED,
          resolutionNote: "Driver issued formal strike for off-app cash demand. Passenger credited ₦300 wallet refund.",
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.status).toBe(TicketStatus.RESOLVED);
      expect(body.data.resolutionNote).toContain("Driver issued formal strike");
      expect(body.data.resolvedAt).toBeDefined();
    });

    it("should protect admin support ticket routes against unprivileged users (403)", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/admin/support/tickets",
        headers: {
          authorization: `Bearer ${passengerToken}`, // Passenger forbidden!
        },
      });

      expect(res.statusCode).toBe(403);
    });
  });
});
