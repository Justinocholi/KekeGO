import { z } from "zod";
import { geoLocationPointSchema } from "./common.js";
import { RideTier, PaymentMethod } from "@kekego/shared";

export const rideEstimateRequestSchema = z.object({
  pickup: geoLocationPointSchema,
  destination: geoLocationPointSchema,
  tier: z.nativeEnum(RideTier).optional(),
});

export type RideEstimateRequest = z.infer<typeof rideEstimateRequestSchema>;

export const createRideRequestSchema = z.object({
  pickup: geoLocationPointSchema,
  destination: geoLocationPointSchema,
  tier: z.nativeEnum(RideTier).default(RideTier.STANDARD),
  paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.CASH),
});

export type CreateRideRequest = z.infer<typeof createRideRequestSchema>;

export const cancelRideSchema = z.object({
  reason: z.string().trim().max(255).optional(),
});

export type CancelRideInput = z.infer<typeof cancelRideSchema>;

export const createRatingSchema = z.object({
  score: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional(),
  tags: z.array(z.string().trim().max(50)).default([]),
});

export type CreateRatingInput = z.infer<typeof createRatingSchema>;
