import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { createServer } from "../server.js";
import { isPointInPolygon } from "../services/geofence.service.js";
import { UserRole, RideTier } from "@kekego/database";

describe("Phase 7: Geofencing & Service-Area Engine", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  // --------------------------------------------------------------------------
  // 1. Ray-Casting Algorithm Unit Tests
  // --------------------------------------------------------------------------
  describe("Ray-Casting Algorithm (isPointInPolygon)", () => {
    // Simple 10x10 square polygon
    const squareRing: [number, number][] = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
      [0, 0],
    ];

    it("should return true for points strictly inside the polygon", () => {
      expect(isPointInPolygon([5, 5], squareRing)).toBe(true);
      expect(isPointInPolygon([1, 1], squareRing)).toBe(true);
      expect(isPointInPolygon([9, 9], squareRing)).toBe(true);
    });

    it("should return false for points outside the polygon", () => {
      expect(isPointInPolygon([15, 5], squareRing)).toBe(false);
      expect(isPointInPolygon([-1, 5], squareRing)).toBe(false);
      expect(isPointInPolygon([5, 12], squareRing)).toBe(false);
      expect(isPointInPolygon([5, -2], squareRing)).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Point Geofence Validation Endpoint (POST /geofence/validate-point)
  // --------------------------------------------------------------------------
  describe("POST /geofence/validate-point", () => {
    it("should validate Lafia urban coordinates as inside operating zone", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/geofence/validate-point",
        payload: {
          latitude: 8.50,
          longitude: 8.52,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.isInside).toBe(true);
      expect(body.data.isCharterBorderExtension).toBe(false);
    });

    it("should validate Keffi commercial corridor coordinates as inside operating zone", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/geofence/validate-point",
        payload: {
          latitude: 8.85,
          longitude: 7.87,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.isInside).toBe(true);
      expect(body.data.zoneName).toContain("Keffi");
    });

    it("should detect FCT-Abuja border extension corridor coordinates", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/geofence/validate-point",
        payload: {
          latitude: 9.02,
          longitude: 7.51,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.isInside).toBe(true);
      expect(body.data.isCharterBorderExtension).toBe(true);
    });

    it("should reject outside coordinates (e.g. Lagos, Nigeria)", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/geofence/validate-point",
        payload: {
          latitude: 6.5244,
          longitude: 3.3792,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.isInside).toBe(false);
    });

    it("should return 400 validation error for invalid latitude/longitude", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/geofence/validate-point",
        payload: {
          latitude: 999, // Out of valid latitude range
          longitude: 8.5,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  // --------------------------------------------------------------------------
  // 3. Trip Geofence Validation Policy (POST /geofence/validate-trip)
  // --------------------------------------------------------------------------
  describe("POST /geofence/validate-trip", () => {
    it("should approve valid intra-Nasarawa trip for standard keke", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/geofence/validate-trip",
        payload: {
          pickup: {
            latitude: 8.4932,
            longitude: 8.5158,
            address: "Lafia Modern Market",
          },
          destination: {
            latitude: 8.5305,
            longitude: 8.528,
            address: "Federal University of Lafia",
          },
          tier: RideTier.STANDARD,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.isValid).toBe(true);
      expect(body.data.isCrossBoundary).toBe(false);
      expect(body.data.allowedTiers).toContain(RideTier.STANDARD);
    });

    it("should reject pickup outside Nasarawa with 422 OUT_OF_SERVICE_AREA", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/geofence/validate-trip",
        payload: {
          pickup: {
            latitude: 6.5244, // Lagos
            longitude: 3.3792,
            address: "Victoria Island, Lagos",
          },
          destination: {
            latitude: 8.5305,
            longitude: 8.528,
            address: "Lafia",
          },
          tier: RideTier.STANDARD,
        },
      });

      expect(response.statusCode).toBe(422);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("OUT_OF_SERVICE_AREA");
    });

    it("should reject pickup starting in FCT border extension with 422 (Pickups restricted to Nasarawa)", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/geofence/validate-trip",
        payload: {
          pickup: {
            latitude: 9.02, // In FCT border extension
            longitude: 7.51,
            address: "Nyanya Outpost, FCT Border",
          },
          destination: {
            latitude: 8.85,
            longitude: 7.87,
            address: "Keffi Market",
          },
          tier: RideTier.CHARTER,
        },
      });

      expect(response.statusCode).toBe(422);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("OUT_OF_SERVICE_AREA");
    });

    it("should allow cross-boundary trip to FCT border extension for CHARTER tier", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/geofence/validate-trip",
        payload: {
          pickup: {
            latitude: 9.01, // Karu-Mararaba, Nasarawa
            longitude: 7.58,
            address: "Mararaba Orange Market, Nasarawa",
          },
          destination: {
            latitude: 9.02, // FCT Border Extension
            longitude: 7.51,
            address: "Nyanya Interchange, FCT Border",
          },
          tier: RideTier.CHARTER,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.isValid).toBe(true);
      expect(body.data.isCrossBoundary).toBe(true);
      expect(body.data.allowedTiers).toEqual([RideTier.CHARTER]);
      expect(body.data.policyNotice).toBeDefined();
    });

    it("should reject cross-boundary trip to FCT border extension for STANDARD tier with 422 CROSS_BOUNDARY_RESTRICTED", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/geofence/validate-trip",
        payload: {
          pickup: {
            latitude: 9.01,
            longitude: 7.58,
            address: "Mararaba Orange Market, Nasarawa",
          },
          destination: {
            latitude: 9.02,
            longitude: 7.51,
            address: "Nyanya Interchange, FCT Border",
          },
          tier: RideTier.STANDARD,
        },
      });

      expect(response.statusCode).toBe(422);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("CROSS_BOUNDARY_RESTRICTED");
      expect(body.error.details.allowedTier).toBe(RideTier.CHARTER);
    });

    it("should reject destination outside all boundaries with 422 OUT_OF_SERVICE_AREA", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/geofence/validate-trip",
        payload: {
          pickup: {
            latitude: 8.50,
            longitude: 8.52,
            address: "Lafia Modern Market",
          },
          destination: {
            latitude: 12.0, // Kano, Nigeria
            longitude: 8.5,
            address: "Kano City",
          },
          tier: RideTier.CHARTER,
        },
      });

      expect(response.statusCode).toBe(422);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("OUT_OF_SERVICE_AREA");
    });
  });

  // --------------------------------------------------------------------------
  // 4. Admin Service-Area Management Endpoints
  // --------------------------------------------------------------------------
  describe("Admin Service-Area Endpoints (Security & Management)", () => {
    it("should reject unauthenticated request to GET /admin/service-areas with 401", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/admin/service-areas",
      });

      expect(response.statusCode).toBe(401);
    });

    it("should reject passenger role from accessing GET /admin/service-areas with 403", async () => {
      const passengerToken = app.jwt.sign({
        userId: "passenger-uuid-1",
        phoneNumber: "+2348011111111",
        role: UserRole.PASSENGER,
      });

      const response = await app.inject({
        method: "GET",
        url: "/admin/service-areas",
        headers: {
          authorization: `Bearer ${passengerToken}`,
        },
      });

      expect(response.statusCode).toBe(403);
    });

    it("should allow ADMIN to retrieve active service areas list", async () => {
      const adminToken = app.jwt.sign({
        userId: "admin-uuid-1",
        phoneNumber: "+2348099999999",
        role: UserRole.ADMIN,
      });

      const response = await app.inject({
        method: "GET",
        url: "/admin/service-areas",
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThanOrEqual(4);

      // Verify Lafia and Keffi zones exist
      const areaNames = body.data.map((a: { name: string }) => a.name);
      expect(areaNames.some((n: string) => n.includes("Lafia"))).toBe(true);
      expect(areaNames.some((n: string) => n.includes("Keffi"))).toBe(true);
      expect(areaNames.some((n: string) => n.includes("Karu-Mararaba"))).toBe(true);
    });

    it("should allow ADMIN to retrieve service area by ID", async () => {
      const adminToken = app.jwt.sign({
        userId: "admin-uuid-1",
        phoneNumber: "+2348099999999",
        role: UserRole.ADMIN,
      });

      const response = await app.inject({
        method: "GET",
        url: "/admin/service-areas/a0000000-0000-0000-0000-000000000002",
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.name).toContain("Lafia");
      expect(body.data.boundaryGeoJson.type).toBe("Polygon");
    });

    it("should allow ADMIN to create a new service area zone", async () => {
      const adminToken = app.jwt.sign({
        userId: "admin-uuid-1",
        phoneNumber: "+2348099999999",
        role: UserRole.ADMIN,
      });

      const newZonePayload = {
        name: "Akwanga Transit Hub",
        state: "Nasarawa",
        country: "Nigeria",
        isActive: true,
        isCharterBorderExtension: false,
        boundaryGeoJson: {
          type: "Polygon" as const,
          coordinates: [
            [
              [8.35, 8.85],
              [8.45, 8.85],
              [8.45, 8.95],
              [8.35, 8.95],
              [8.35, 8.85],
            ],
          ],
        },
      };

      const response = await app.inject({
        method: "POST",
        url: "/admin/service-areas",
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: newZonePayload,
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe("Akwanga Transit Hub");
    });

    it("should allow ADMIN to toggle service area active status", async () => {
      const adminToken = app.jwt.sign({
        userId: "admin-uuid-1",
        phoneNumber: "+2348099999999",
        role: UserRole.ADMIN,
      });

      const response = await app.inject({
        method: "POST",
        url: "/admin/service-areas/a0000000-0000-0000-0000-000000000003/toggle",
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: {
          isActive: false,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.isActive).toBe(false);

      // Re-enable for test idempotency
      await app.inject({
        method: "POST",
        url: "/admin/service-areas/a0000000-0000-0000-0000-000000000003/toggle",
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: {
          isActive: true,
        },
      });
    });
  });
});
