/**
 * Environment variable validation.
 *
 * Validates all required environment variables at startup using Zod.
 * This file must only be imported from server-side code (Server Components,
 * Server Actions, Route Handlers, service layer). Never import on the client.
 *
 * Usage:
 *   import { env } from "@/lib/config/env";
 *   const db = new PrismaClient({ datasourceUrl: env.DATABASE_URL });
 */

import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

function validateEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const formatted = parsed.error.flatten().fieldErrors;
    console.error("❌ Invalid environment variables:", formatted);
    throw new Error(
      `Invalid environment configuration.\n${JSON.stringify(formatted, null, 2)}`
    );
  }

  return parsed.data;
}

export const env = validateEnv();
