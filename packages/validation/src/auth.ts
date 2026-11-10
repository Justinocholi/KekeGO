import { z } from "zod";
import { nigerianPhoneSchema } from "./common.js";
import { DriverAvailabilityStatus, DriverVerificationStatus, VehicleType } from "@kekego/shared";

export const registerPassengerSchema = z.object({
  phoneNumber: nigerianPhoneSchema,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  firstName: z.string().trim().min(2, "First name is required"),
  lastName: z.string().trim().min(2, "Last name is required"),
  email: z.string().trim().email("Invalid email address").optional().nullable(),
  emergencyContactName: z.string().trim().optional().nullable(),
  emergencyContactPhone: nigerianPhoneSchema.optional().nullable(),
});

export type RegisterPassengerInput = z.infer<typeof registerPassengerSchema>;

export const registerDriverSchema = z.object({
  phoneNumber: nigerianPhoneSchema,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  firstName: z.string().trim().min(2, "First name is required"),
  lastName: z.string().trim().min(2, "Last name is required"),
  email: z.string().trim().email("Invalid email address").optional().nullable(),
  licenseNumber: z.string().trim().min(5, "Valid driver license number is required"),
  licenseExpiry: z.string().optional().nullable(),
  partnerId: z.string().uuid("Invalid partner UUID").optional().nullable(),
  vehicle: z.object({
    plateNumber: z.string().trim().min(5, "Vehicle plate number is required"),
    make: z.string().trim().default("Bajaj"),
    model: z.string().trim().default("RE 4S"),
    color: z.string().trim().default("Yellow"),
    year: z.number().int().min(2000).max(2030).optional(),
    type: z.nativeEnum(VehicleType).default(VehicleType.KEKE_NAPEP),
  }),
});

export type RegisterDriverInput = z.infer<typeof registerDriverSchema>;

export const loginSchema = z.object({
  identifier: z.string().trim().min(3, "Phone number or email is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(2).optional(),
  lastName: z.string().trim().min(2).optional(),
  email: z.string().trim().email().optional().nullable(),
  emergencyContactName: z.string().trim().optional().nullable(),
  emergencyContactPhone: nigerianPhoneSchema.optional().nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const updateDriverAvailabilitySchema = z.object({
  availabilityStatus: z.nativeEnum(DriverAvailabilityStatus),
});

export type UpdateDriverAvailabilityInput = z.infer<typeof updateDriverAvailabilitySchema>;

export const provisionAdminSchema = z.object({
  bootstrapSecret: z.string().min(1, "Bootstrap secret is required"),
  phoneNumber: nigerianPhoneSchema,
  email: z.string().trim().email("Valid admin email is required"),
  password: z
    .string()
    .min(10, "Admin password must be at least 10 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  firstName: z.string().trim().min(2),
  lastName: z.string().trim().min(2),
});

export type ProvisionAdminInput = z.infer<typeof provisionAdminSchema>;

export const verifyDriverSchema = z.object({
  verificationStatus: z.nativeEnum(DriverVerificationStatus),
  reason: z.string().trim().optional(),
});

export type VerifyDriverInput = z.infer<typeof verifyDriverSchema>;
