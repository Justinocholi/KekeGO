import { z } from "zod";
import { PaymentMethod, LedgerEntryType, LedgerCategory } from "@kekego/shared";

/**
 * Initialize payment for a completed or active ride
 */
export const initializePaymentSchema = z.object({
  rideId: z.string().min(1, "Invalid ride ID format"),
  method: z.nativeEnum(PaymentMethod).default(PaymentMethod.CARD),
  callbackUrl: z.string().url().optional(),
  email: z.string().email().optional(),
});

export type InitializePaymentInput = z.infer<typeof initializePaymentSchema>;

/**
 * Server-side payment verification query/params
 */
export const verifyPaymentSchema = z.object({
  reference: z.string().min(4, "Invalid payment reference"),
});

export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;

/**
 * Confirm offline cash payment collection
 */
export const confirmCashPaymentSchema = z.object({
  rideId: z.string().min(1, "Invalid ride ID format"),
  amountKobo: z.number().int().positive().optional(),
});

export type ConfirmCashPaymentInput = z.infer<typeof confirmCashPaymentSchema>;

/**
 * Digital wallet top-up schema
 */
export const walletTopupSchema = z.object({
  amountKobo: z
    .number()
    .int()
    .min(10000, "Minimum wallet top-up is ₦100 (10,000 kobo)")
    .max(50000000, "Maximum single top-up is ₦500,000 (50,000,000 kobo)"),
  callbackUrl: z.string().url().optional(),
});

export type WalletTopupInput = z.infer<typeof walletTopupSchema>;

/**
 * Administrative refund initiation schema
 */
export const refundPaymentSchema = z.object({
  paymentId: z.string().min(1, "Invalid payment ID format"),
  amountKobo: z.number().int().positive().optional(),
  reason: z.string().min(3, "Reason must be at least 3 characters").max(500),
});

export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>;

/**
 * Driver earnings payout / withdrawal request schema (NUBAN)
 */
export const driverPayoutSchema = z.object({
  amountKobo: z
    .number()
    .int()
    .min(50000, "Minimum driver withdrawal is ₦500 (50,000 kobo)")
    .max(10000000, "Maximum single withdrawal is ₦100,000"),
  accountNumber: z
    .string()
    .regex(/^\d{10}$/, "NUBAN account number must be exactly 10 digits"),
  bankCode: z.string().min(3).max(6, "Invalid CBN bank code"),
  accountName: z.string().min(2).optional(),
});

export type DriverPayoutInput = z.infer<typeof driverPayoutSchema>;

/**
 * Financial reconciliation query schema
 */
export const ledgerQuerySchema = z.object({
  walletId: z.string().min(1).optional(),
  partnerId: z.string().min(1).optional(),
  rideId: z.string().min(1).optional(),
  category: z.nativeEnum(LedgerCategory).optional(),
  entryType: z.nativeEnum(LedgerEntryType).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type LedgerQueryInput = z.infer<typeof ledgerQuerySchema>;
