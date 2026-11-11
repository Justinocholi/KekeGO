import { z } from "zod";
import { RideTier } from "@kekego/shared";
import { geoLocationPointSchema } from "./common.js";

/**
 * Validation schema for creating a new Fare Rule
 */
export const createFareRuleSchema = z.object({
  tier: z.nativeEnum(RideTier),
  serviceAreaId: z.string().uuid().optional(),
  baseFareKobo: z.number().int().min(0, "Base fare must be non-negative"),
  distanceFarePerKmKobo: z
    .number()
    .int()
    .min(0, "Distance fare must be non-negative"),
  timeFarePerMinKobo: z
    .number()
    .int()
    .min(0, "Time fare must be non-negative"),
  minimumFareKobo: z
    .number()
    .int()
    .min(0, "Minimum fare must be non-negative"),
  cancellationFeeKobo: z
    .number()
    .int()
    .min(0, "Cancellation fee must be non-negative")
    .default(10000)
    .optional(),
  platformCommissionPercent: z
    .number()
    .min(0)
    .max(100)
    .default(15.0)
    .optional(),
  partnerCommissionPercent: z
    .number()
    .min(0)
    .max(100)
    .default(5.0)
    .optional(),
  surgeMultiplier: z
    .number()
    .min(1.0)
    .max(1.0, "Surge pricing is disabled in MVP scope unless explicitly authorized")
    .default(1.0)
    .optional(),
});

export type CreateFareRuleInput = z.input<typeof createFareRuleSchema>;

/**
 * Validation schema for updating / superseding an existing Fare Rule
 */
export const updateFareRuleSchema = createFareRuleSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type UpdateFareRuleInput = z.infer<typeof updateFareRuleSchema>;

/**
 * Validation schema for fare estimation request
 */
export const fareEstimateQuerySchema = z.object({
  pickup: geoLocationPointSchema,
  destination: geoLocationPointSchema,
  tier: z.nativeEnum(RideTier).optional(),
  serviceAreaId: z.string().uuid().optional(),
});

export type FareEstimateQueryInput = z.infer<typeof fareEstimateQuerySchema>;

/**
 * Calculated Fare Breakdown response interface
 */
export interface CalculatedFareBreakdown {
  currency: "NGN";
  tier: RideTier;
  fareRuleId?: string;
  fareRuleVersion: number;
  baseFareKobo: number;
  distanceKm: number;
  distanceChargeKobo: number;
  durationMinutes: number;
  timeChargeKobo: number;
  minimumFareKobo: number;
  subtotalKobo: number;
  surgeMultiplier: number;
  discountKobo: number;
  totalFareKobo: number;
  platformCommissionKobo: number;
  partnerCommissionKobo: number;
  driverEarningsKobo: number;
  cancellationFeeKobo: number;
}
