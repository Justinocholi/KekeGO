import dotenv from "dotenv";
import { apiEnvSchema, type ApiEnv } from "@kekego/validation";

dotenv.config();

const parsedEnv = apiEnvSchema.safeParse(process.env);

if (!parsedEnv.success) {
  // eslint-disable-next-line no-console
  console.error("❌ Invalid environment variables:", parsedEnv.error.format());
  process.exit(1);
}

export const env: ApiEnv = parsedEnv.data;
