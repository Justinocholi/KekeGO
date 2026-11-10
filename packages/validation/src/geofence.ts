import { z } from "zod";
import { geoLocationPointSchema } from "./common.js";
import { RideTier } from "@kekego/shared";

// GeoJSON Polygon coordinate array schema: [ [ [lng, lat], ... ] ]
export const geoJsonPolygonSchema = z.object({
  type: z.literal("Polygon"),
  coordinates: z.array(
    z.array(z.tuple([z.number(), z.number()])).min(4, "A polygon must have at least 4 coordinate pairs (closed ring)")
  ).min(1),
});

export type GeoJsonPolygon = z.infer<typeof geoJsonPolygonSchema>;

export const createServiceAreaSchema = z.object({
  name: z.string().trim().min(3, "Service area name must be at least 3 characters"),
  state: z.string().trim().default("Nasarawa"),
  country: z.string().trim().default("Nigeria"),
  isActive: z.boolean().default(true),
  boundaryGeoJson: geoJsonPolygonSchema,
  isCharterBorderExtension: z.boolean().default(false),
});

export type CreateServiceAreaInput = z.infer<typeof createServiceAreaSchema>;

export const updateServiceAreaSchema = z.object({
  name: z.string().trim().min(3).optional(),
  state: z.string().trim().optional(),
  isActive: z.boolean().optional(),
  boundaryGeoJson: geoJsonPolygonSchema.optional(),
  isCharterBorderExtension: z.boolean().optional(),
});

export type UpdateServiceAreaInput = z.infer<typeof updateServiceAreaSchema>;

export const validateTripGeofenceSchema = z.object({
  pickup: geoLocationPointSchema,
  destination: geoLocationPointSchema,
  tier: z.nativeEnum(RideTier).default(RideTier.STANDARD),
});

export type ValidateTripGeofenceInput = z.infer<typeof validateTripGeofenceSchema>;

export const validatePointGeofenceSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type ValidatePointGeofenceInput = z.infer<typeof validatePointGeofenceSchema>;
