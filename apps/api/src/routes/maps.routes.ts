import type { FastifyPluginAsync } from "fastify";
import {
  mapsAutocompleteQuerySchema,
  mapsPlaceDetailsQuerySchema,
  mapsGeocodeQuerySchema,
  mapsReverseGeocodeQuerySchema,
  mapsRouteComputeSchema,
} from "@kekego/validation";
import { googleMapsService, NASARAWA_GAZETTEER } from "../services/maps.service.js";
import { AppError } from "../utils/errors.js";

export const mapsRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /maps/autocomplete
   * Location search & suggestions powered by Google Places API (New) with Nasarawa Gazetteer fallback
   */
  fastify.get("/maps/autocomplete", async (request, reply) => {
    const parsed = mapsAutocompleteQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid autocomplete query parameters", {
        details: parsed.error.format(),
      });
    }

    const result = await googleMapsService.autocomplete(parsed.data);

    return reply.send({
      success: true,
      data: result,
    });
  });

  /**
   * GET /maps/place-details
   * Fetch full details & coordinates for a specific place ID
   */
  fastify.get("/maps/place-details", async (request, reply) => {
    const parsed = mapsPlaceDetailsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid place-details query parameters", {
        details: parsed.error.format(),
      });
    }

    const result = await googleMapsService.getPlaceDetails(parsed.data);

    return reply.send({
      success: true,
      data: result,
    });
  });

  /**
   * GET /maps/geocode
   * Convert address string to coordinates
   */
  fastify.get("/maps/geocode", async (request, reply) => {
    const parsed = mapsGeocodeQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid geocode query parameters", {
        details: parsed.error.format(),
      });
    }

    const result = await googleMapsService.geocode(parsed.data);

    return reply.send({
      success: true,
      data: result,
    });
  });

  /**
   * GET /maps/reverse-geocode
   * Convert latitude/longitude coordinates to formatted street address
   */
  fastify.get("/maps/reverse-geocode", async (request, reply) => {
    const parsed = mapsReverseGeocodeQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid reverse-geocode query parameters", {
        details: parsed.error.format(),
      });
    }

    const result = await googleMapsService.reverseGeocode(parsed.data);

    return reply.send({
      success: true,
      data: result,
    });
  });

  /**
   * POST /maps/route
   * Calculate turn-by-turn road route, real road distance, and travel duration
   */
  fastify.post("/maps/route", async (request, reply) => {
    const parsed = mapsRouteComputeSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid route computation parameters", {
        details: parsed.error.format(),
      });
    }

    const result = await googleMapsService.computeRoute(parsed.data);

    return reply.send({
      success: true,
      data: result,
    });
  });

  /**
   * GET /maps/gazetteer
   * Returns curated list of verified Nasarawa commercial landmarks & hubs
   */
  fastify.get("/maps/gazetteer", async (_request, reply) => {
    return reply.send({
      success: true,
      data: NASARAWA_GAZETTEER,
    });
  });
};
