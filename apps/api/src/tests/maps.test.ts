import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { createServer } from "../server.js";

describe("Production Google Maps Service & Endpoints Test Suite", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("1. GET /maps/autocomplete returns relevant location predictions", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/maps/autocomplete?input=Lafia",
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.predictions)).toBe(true);
    expect(body.data.predictions.length).toBeGreaterThan(0);
    expect(body.data.predictions[0]).toHaveProperty("primaryText");
    expect(body.data.predictions[0]).toHaveProperty("secondaryText");
    expect(body.data.source).toBeDefined();
  });

  it("2. GET /maps/place-details resolves place metadata and coordinates", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/maps/place-details?placeId=gaz-laf-01",
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.data.name).toContain("Lafia Modern Market");
    expect(body.data.latitude).toBeCloseTo(8.4932, 2);
    expect(body.data.longitude).toBeCloseTo(8.5158, 2);
  });

  it("3. GET /maps/geocode converts address to coordinates", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/maps/geocode?address=Nasarawa%20State%20University%20Keffi",
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.data.latitude).toBeGreaterThan(8.0);
    expect(body.data.longitude).toBeGreaterThan(7.0);
  });

  it("4. GET /maps/reverse-geocode returns formatted street name and landmark", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/maps/reverse-geocode?latitude=8.4980&longitude=8.5180",
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.data.primaryText).toBeDefined();
    expect(body.data.secondaryText).toBeDefined();
  });

  it("5. POST /maps/route calculates road distance and travel duration", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/maps/route",
      payload: {
        origin: { latitude: 8.4932, longitude: 8.5158 },
        destination: { latitude: 8.5305, longitude: 8.528 },
        travelMode: "DRIVE",
        avoidTolls: false,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.data.distanceMeters).toBeGreaterThan(1000);
    expect(body.data.durationSeconds).toBeGreaterThan(60);
    expect(body.data.source).toBeDefined();
  });

  it("6. GET /maps/gazetteer returns verified Nasarawa commercial corridors", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/maps/gazetteer",
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThan(8);
  });
});
