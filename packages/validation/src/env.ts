import { z } from "zod";

/**
 * Backend API Environment Variables Schema
 */
export const apiEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default("0.0.0.0"),
  CORS_ORIGIN: z.string().default("*"),
  DATABASE_URL: z
    .string()
    .url()
    .default("postgresql://kekego:kekego_secret@localhost:5432/kekego?schema=public"),
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  JWT_ACCESS_SECRET: z
    .string()
    .min(16)
    .default("kekego_default_dev_access_secret_do_not_use_in_prod"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(16)
    .default("kekego_default_dev_refresh_secret_do_not_use_in_prod"),
  JWT_ACCESS_EXPIRY: z.string().default("15m"),
  JWT_REFRESH_EXPIRY: z.string().default("7d"),
  PAYSTACK_SECRET_KEY: z.string().default("sk_test_placeholder"),
  PAYSTACK_PUBLIC_KEY: z.string().default("pk_test_placeholder"),
  PAYSTACK_WEBHOOK_SECRET: z.string().default("wh_sec_placeholder"),
  GOOGLE_MAPS_API_KEY: z.string().default("placeholder_maps_key"),
  DEFAULT_SERVICE_AREA_STATE: z.string().default("Nasarawa"),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;
