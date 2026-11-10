import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { createServer } from "../server.js";
import { UserRole } from "@kekego/database";

describe("Phase 6: Driver Services & Dispatch Endpoints", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("GET /rides/driver/dispatches (Security & Authorization)", () => {
    it("should reject unauthenticated request with 401", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/rides/driver/dispatches",
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("UNAUTHORIZED");
    });

    it("should reject non-driver passenger role with 403", async () => {
      const passengerToken = app.jwt.sign({
        userId: "passenger-uuid-1",
        phoneNumber: "+2348011111111",
        role: UserRole.PASSENGER,
      });

      const response = await app.inject({
        method: "GET",
        url: "/rides/driver/dispatches",
        headers: {
          authorization: `Bearer ${passengerToken}`,
        },
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("FORBIDDEN");
    });
  });

  describe("POST /rides/:id/accept (Driver Acceptance)", () => {
    it("should reject unauthenticated call to accept ride", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/rides/ride-uuid-123/accept",
      });

      expect(response.statusCode).toBe(401);
    });

    it("should reject passenger role trying to accept ride dispatch", async () => {
      const passengerToken = app.jwt.sign({
        userId: "passenger-uuid-1",
        phoneNumber: "+2348011111111",
        role: UserRole.PASSENGER,
      });

      const response = await app.inject({
        method: "POST",
        url: "/rides/ride-uuid-123/accept",
        headers: {
          authorization: `Bearer ${passengerToken}`,
        },
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe("PATCH /rides/:id/status (Trip Transitions & OTP Validation)", () => {
    it("should reject invalid status update payloads", async () => {
      const driverToken = app.jwt.sign({
        userId: "driver-uuid-1",
        phoneNumber: "+2348022222222",
        role: UserRole.DRIVER,
      });

      const response = await app.inject({
        method: "PATCH",
        url: "/rides/ride-uuid-123/status",
        headers: {
          authorization: `Bearer ${driverToken}`,
        },
        payload: {
          status: "INVALID_STATUS_NAME",
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject invalid start OTP length (must be 4 digits)", async () => {
      const driverToken = app.jwt.sign({
        userId: "driver-uuid-1",
        phoneNumber: "+2348022222222",
        role: UserRole.DRIVER,
      });

      const response = await app.inject({
        method: "PATCH",
        url: "/rides/ride-uuid-123/status",
        headers: {
          authorization: `Bearer ${driverToken}`,
        },
        payload: {
          status: "IN_PROGRESS",
          startOtp: "12", // Invalid: only 2 digits
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET /rides/driver/earnings (Metrics Security)", () => {
    it("should reject unauthenticated request to earnings", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/rides/driver/earnings",
      });

      expect(response.statusCode).toBe(401);
    });

    it("should reject passenger role accessing driver earnings", async () => {
      const passengerToken = app.jwt.sign({
        userId: "passenger-uuid-1",
        phoneNumber: "+2348011111111",
        role: UserRole.PASSENGER,
      });

      const response = await app.inject({
        method: "GET",
        url: "/rides/driver/earnings",
        headers: {
          authorization: `Bearer ${passengerToken}`,
        },
      });

      expect(response.statusCode).toBe(403);
    });
  });
});
