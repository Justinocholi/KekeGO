import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { createServer } from "../server.js";
import { RideTier } from "@kekego/shared";

describe("Phase 14: Automated Smoke & Production Sanity Test Suite", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("1. Health Liveness Probe returns HTTP 200 with service metadata and memory metrics", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBe("kekego-api");
    expect(body.version).toBe("0.1.0");
    expect(body.uptime).toBeGreaterThanOrEqual(0);
    expect(body.memory).toBeDefined();
    expect(body.memory.heapUsedMb).toBeGreaterThan(0);
  });

  it("2. Health Readiness Probe returns HTTP 200 with component status", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/ready",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("ready");
    expect(body.checks.server).toBe("up");
    expect(body.checks.database).toBeDefined();
  });

  it("3. Auth API input validation enforces identifier requirements", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        identifier: "invalid-user",
      },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("4. Service Area Engine validates Nasarawa urban corridors", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/geofence/validate-point",
      payload: {
        latitude: 8.498,
        longitude: 8.518, // Lafia Core
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.isInside).toBe(true);
    expect(body.data.zoneName).toBeDefined();
  });

  it("5. Fare estimation returns structured pricing breakdown for Standard Keke", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/fare/estimate",
      payload: {
        pickup: { latitude: 8.498, longitude: 8.518 }, // Lafia Central
        destination: { latitude: 8.525, longitude: 8.535 }, // Bukuru Express
        tier: RideTier.STANDARD,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.estimates.length).toBeGreaterThan(0);
    expect(body.data.estimates[0].totalFareKobo).toBeGreaterThan(0);
    expect(body.data.estimates[0].currency).toBe("NGN");
    expect(body.data.estimates[0].baseFareKobo).toBeDefined();
  });

  it("6. Security headers are injected by Fastify Helmet", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(res.headers["x-frame-options"]).toBeDefined();
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });
});
