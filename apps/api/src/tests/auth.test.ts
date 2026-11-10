import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { createServer } from "../server.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { UserRole } from "@kekego/database";
import { registerPassengerSchema } from "@kekego/validation";

describe("Phase 3: Authentication, Authorization & User Management", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("Password Hashing & Verification", () => {
    it("should securely hash a plaintext password and verify correctly", async () => {
      const plaintext = "SecureKekegoPass123!";
      const hash = await hashPassword(plaintext);

      expect(hash).not.toBe(plaintext);
      expect(hash.startsWith("$2")).toBe(true);

      const isValid = await comparePassword(plaintext, hash);
      expect(isValid).toBe(true);

      const isInvalid = await comparePassword("WrongPassword123!", hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe("Input Validation & Privilege Escalation Prevention", () => {
    it("should reject passenger registration with invalid Nigerian phone numbers", () => {
      const result = registerPassengerSchema.safeParse({
        phoneNumber: "123456789", // invalid
        password: "ValidPassword1",
        firstName: "Amina",
        lastName: "Yusuf",
      });

      expect(result.success).toBe(false);
    });

    it("should accept valid Nigerian phone numbers and normalize to E.164", () => {
      const result = registerPassengerSchema.safeParse({
        phoneNumber: "08031234567",
        password: "ValidPassword1",
        firstName: "Amina",
        lastName: "Yusuf",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.phoneNumber).toBe("+2348031234567");
      }
    });

    it("should reject weak passwords", () => {
      const result = registerPassengerSchema.safeParse({
        phoneNumber: "08031234567",
        password: "weak", // less than 8 chars, no uppercase, no number
        firstName: "Amina",
        lastName: "Yusuf",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("Authentication & Route Protection (HTTP Inject)", () => {
    it("should reject unauthenticated request to /users/me with 401", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/users/me",
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("UNAUTHORIZED");
    });

    it("should reject passenger token trying to access /admin/users with 403 Forbidden", async () => {
      // Sign token as PASSENGER
      const passengerToken = app.jwt.sign({
        userId: "00000000-0000-0000-0000-000000000001",
        role: UserRole.PASSENGER,
        phoneNumber: "+2348033333333",
      });

      const response = await app.inject({
        method: "GET",
        url: "/admin/users",
        headers: {
          authorization: `Bearer ${passengerToken}`,
        },
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("FORBIDDEN");
    });

    it("should reject passenger token trying to update driver availability with 403 Forbidden", async () => {
      const passengerToken = app.jwt.sign({
        userId: "00000000-0000-0000-0000-000000000001",
        role: UserRole.PASSENGER,
        phoneNumber: "+2348033333333",
      });

      const response = await app.inject({
        method: "PATCH",
        url: "/users/driver/availability",
        headers: {
          authorization: `Bearer ${passengerToken}`,
        },
        payload: {
          availabilityStatus: "ONLINE",
        },
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("FORBIDDEN");
    });

    it("should enforce multi-tenant partner data isolation (reject cross-partner access)", async () => {
      const partnerAToken = app.jwt.sign({
        userId: "00000000-0000-0000-0000-000000000010",
        role: UserRole.PARTNER,
        phoneNumber: "+2348044444444",
        partnerId: "partner-uuid-aaa-111", // Partner A
      });

      // Attempt to access Partner B's resources
      const response = await app.inject({
        method: "GET",
        url: "/admin/partners/partner-uuid-bbb-222",
        headers: {
          authorization: `Bearer ${partnerAToken}`,
        },
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("CROSS_PARTNER_ACCESS_DENIED");
    });

    it("should reject public admin self-registration without valid bootstrap secret", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/auth/admin/provision",
        payload: {
          bootstrapSecret: "invalid-secret",
          phoneNumber: "08011111111",
          email: "fakeadmin@kekego.ng",
          password: "AdminPassword123!",
          firstName: "Fake",
          lastName: "Admin",
        },
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("FORBIDDEN");
    });
  });
});
