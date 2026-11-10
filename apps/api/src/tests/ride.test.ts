import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { createServer } from "../server.js";
import { calculateDistanceMeters } from "../services/ride.service.js";
import { UserRole } from "@kekego/database";

describe("Phase 5: Ride Services & Endpoints", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("Haversine Distance & Route Calculation", () => {
    it("should calculate realistic urban distance between two coordinates in Nasarawa", () => {
      // Lafia Modern Market (~8.4900, 8.5200) to Isa Mustapha Agwai Polytechnic (~8.5150, 8.5350)
      const lat1 = 8.49;
      const lon1 = 8.52;
      const lat2 = 8.515;
      const lon2 = 8.535;

      const distance = calculateDistanceMeters(lat1, lon1, lat2, lon2);

      // Distance should be approximately 3.5 - 5.5 km with urban winding factor
      expect(distance).toBeGreaterThan(3000);
      expect(distance).toBeLessThan(6000);
    });

    it("should return 0 meters for identical coordinates", () => {
      const distance = calculateDistanceMeters(8.5, 8.5, 8.5, 8.5);
      expect(distance).toBe(0);
    });
  });

  describe("POST /rides/estimate (Fare Estimation)", () => {
    it("should estimate fares across all 3 tiers with integer kobo amounts", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/rides/estimate",
        payload: {
          pickup: {
            latitude: 8.4932,
            longitude: 8.5158,
            address: "Lafia Modern Market, Nasarawa",
          },
          destination: {
            latitude: 8.5305,
            longitude: 8.528,
            address: "Federal University of Lafia (Permanent Site)",
          },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.estimates).toHaveLength(3);

      const tiers = body.data.estimates.map((e: { tier: string }) => e.tier);
      expect(tiers).toContain("STANDARD");
      expect(tiers).toContain("CHARTER");
      expect(tiers).toContain("CARGO");

      // Verify each tier contains integer kobo currency calculations
      for (const estimate of body.data.estimates) {
        expect(Number.isInteger(estimate.estimatedDistanceMeters)).toBe(true);
        expect(Number.isInteger(estimate.estimatedDurationSeconds)).toBe(true);
        expect(Number.isInteger(estimate.fareBreakdown.totalFareKobo)).toBe(true);
        expect(estimate.fareBreakdown.currency).toBe("NGN");
        expect(estimate.fareBreakdown.totalFareKobo).toBeGreaterThan(0);
      }
    });

    it("should reject fare estimation with invalid coordinate ranges", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/rides/estimate",
        payload: {
          pickup: {
            latitude: 195.0, // Invalid latitude (> 90)
            longitude: 8.5158,
          },
          destination: {
            latitude: 8.5305,
            longitude: 8.528,
          },
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("POST /rides (Ride Creation Security)", () => {
    it("should reject unauthenticated ride creation requests with 401", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/rides",
        payload: {
          tier: "STANDARD",
          pickup: {
            latitude: 8.4932,
            longitude: 8.5158,
          },
          destination: {
            latitude: 8.5305,
            longitude: 8.528,
          },
          paymentMethod: "CASH",
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("UNAUTHORIZED");
    });

    it("should reject non-passenger role trying to request a ride", async () => {
      const driverToken = app.jwt.sign({
        userId: "driver-uuid-1",
        phoneNumber: "+2348022222222",
        role: UserRole.DRIVER,
      });

      const response = await app.inject({
        method: "POST",
        url: "/rides",
        headers: {
          authorization: `Bearer ${driverToken}`,
        },
        payload: {
          tier: "STANDARD",
          pickup: {
            latitude: 8.4932,
            longitude: 8.5158,
          },
          destination: {
            latitude: 8.5305,
            longitude: 8.528,
          },
          paymentMethod: "CASH",
        },
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("FORBIDDEN");
    });
  });

  describe("POST /rides/:id/rating (Rating Validation)", () => {
    it("should reject rating score outside 1 to 5 range", async () => {
      const passengerToken = app.jwt.sign({
        userId: "passenger-uuid-1",
        phoneNumber: "+2348011111111",
        role: UserRole.PASSENGER,
      });

      const response = await app.inject({
        method: "POST",
        url: "/rides/ride-123/rating",
        headers: {
          authorization: `Bearer ${passengerToken}`,
        },
        payload: {
          score: 6, // Invalid: exceeds 5
          comment: "Too fast",
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });
  });
});
