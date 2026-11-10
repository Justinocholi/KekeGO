import { z } from "zod";
import { RideTier } from "@kekego/shared";

export const nearbyDriversQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radiusMeters: z.coerce.number().min(100).max(25000).default(3500),
  tier: z.nativeEnum(RideTier).optional(),
});

export type NearbyDriversQuery = z.infer<typeof nearbyDriversQuerySchema>;

export const rejectRideSchema = z.object({
  reason: z
    .enum([
      "TOO_FAR",
      "OUT_OF_FUEL",
      "OFFLINE_SOON",
      "TRAFFIC_JAM",
      "UNAVAILABLE",
      "OTHER",
    ])
    .default("UNAVAILABLE"),
  comment: z.string().trim().max(255).optional(),
});

export type RejectRideInput = z.infer<typeof rejectRideSchema>;

export const dispatchConfigSchema = z.object({
  timeoutSeconds: z.number().int().min(5).max(60).default(15),
  initialRadiusMeters: z.number().int().min(500).max(10000).default(3500),
  expansionStepMeters: z.number().int().min(500).max(5000).default(2000),
  maxRadiusMeters: z.number().int().min(1000).max(25000).default(8000),
  maxRetries: z.number().int().min(1).max(5).default(3),
});

export type DispatchConfig = z.infer<typeof dispatchConfigSchema>;
