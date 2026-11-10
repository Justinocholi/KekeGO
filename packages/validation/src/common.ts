import { z } from "zod";

/**
 * Common Zod validation primitives for Kekego
 */

export const coordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const geoLocationPointSchema = coordinatesSchema.extend({
  address: z.string().min(1).max(255).optional(),
  landmark: z.string().max(255).optional(),
});

// Nigerian phone numbers: accepts +234XXXXXXXXXX, 234XXXXXXXXXX, or 0XXXXXXXXXX
export const nigerianPhoneSchema = z
  .string()
  .trim()
  .regex(
    /^(?:\+234|234|0)[789][01]\d{8}$/,
    "Invalid Nigerian phone number format. Must start with 0 or +234 followed by 10 digits"
  )
  .transform((val) => {
    // Normalize to standard E.164: +234...
    if (val.startsWith("+234")) return val;
    if (val.startsWith("234")) return `+${val}`;
    if (val.startsWith("0")) return `+234${val.slice(1)}`;
    return val;
  });

export const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{4,6}$/, "OTP must be 4 to 6 numeric digits");

export const tripOtpSchema = z
  .string()
  .trim()
  .regex(/^\d{4}$/, "Trip start code must be exactly 4 digits");

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
