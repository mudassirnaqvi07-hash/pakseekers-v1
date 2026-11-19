/**
 * Environment variable validation — PakSeekers.
 *
 * Validates environment variables at startup using Zod.
 * Target Database: MongoDB Atlas (Phase 1).
 * This file must only be imported from server-side code (Server Components,
 * Server Actions, Route Handlers, service layer). Never import on the client.
 */

import { z } from "zod";

function normalizeMongoUri(rawUri: string | undefined): string {
  const directReplicaSetUri =
    "mongodb://syedmudassir0932_db_user:8pxv8SELRwlNtSfy@ac-2t2vsu4-shard-00-00.tttoqtk.mongodb.net:27017,ac-2t2vsu4-shard-00-01.tttoqtk.mongodb.net:27017,ac-2t2vsu4-shard-00-02.tttoqtk.mongodb.net:27017/pakseekers?ssl=true&replicaSet=atlas-uj7us8-shard-0&authSource=admin&retryWrites=true&w=majority";

  if (!rawUri || typeof rawUri !== "string" || !rawUri.trim()) {
    return directReplicaSetUri;
  }

  // Strip leading and trailing quotes (single, double, or escaped)
  const trimmed = rawUri
    .trim()
    .replace(/^["'`]+|["'`]+$/g, "")
    .trim();

  // If URI references the PakSeekers cluster, ALWAYS convert to the direct replica set seedlist.
  // This completely eliminates 'querySrv ECONNREFUSED' across Windows Hotspots (192.168.137.1)
  // and local network adapters where Node.js c-ares DNS resolver cannot query SRV records.
  if (trimmed.includes("tttoqtk.mongodb.net")) {
    let db = "pakseekers";
    try {
      const matchDb = trimmed.match(/tttoqtk\.mongodb\.net(?::\d+)?\/([^?#]+)/);
      if (matchDb && matchDb[1]) {
        db = matchDb[1];
      }
    } catch {
      // Default to pakseekers
    }
    return `mongodb://syedmudassir0932_db_user:8pxv8SELRwlNtSfy@ac-2t2vsu4-shard-00-00.tttoqtk.mongodb.net:27017,ac-2t2vsu4-shard-00-01.tttoqtk.mongodb.net:27017,ac-2t2vsu4-shard-00-02.tttoqtk.mongodb.net:27017/${db}?ssl=true&replicaSet=atlas-uj7us8-shard-0&authSource=admin&retryWrites=true&w=majority`;
  }

  return trimmed;
}

const envSchema = z
  .object({
    MONGODB_URI: z.string().optional(),
    DATABASE_URL: z.string().optional(),
    MONGODB_DB: z.string().default("pakseekers"),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    APP_SECRET: z.string().optional(),
  })
  .transform((data) => {
    const rawUri = data.MONGODB_URI || data.DATABASE_URL || "";
    const resolvedUri = normalizeMongoUri(rawUri);
    return {
      ...data,
      MONGODB_URI: resolvedUri,
      DATABASE_URL: resolvedUri,
    };
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
