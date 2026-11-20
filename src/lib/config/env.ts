import "server-only";

/**
 * Environment variable validation — PakSeekers.
 *
 * Validates environment variables at startup using Zod.
 * Target Database: MongoDB Atlas.
 * This file must only be imported from server-side code (Server Components,
 * Server Actions, Route Handlers, service layer). Never import on the client.
 */

import { z } from "zod";

/**
 * Normalizes a MongoDB connection URI.
 *
 * For Atlas clusters on networks where Node.js c-ares DNS resolver cannot query SRV records
 * (e.g., Windows Hotspots), dynamically transforms an SRV URI into the direct replica set seedlist
 * using the credentials present in the provided URI itself.
 *
 * Never stores or hardcodes any database credentials.
 */
export function normalizeMongoUri(
  rawUri: string | undefined,
  dbName: string = "pakseekers"
): string {
  if (!rawUri || typeof rawUri !== "string" || !rawUri.trim()) {
    return "";
  }

  // Strip leading and trailing quotes (single, double, or escaped)
  const trimmed = rawUri
    .trim()
    .replace(/^["'`]+|["'`]+$/g, "")
    .trim();

  if (!trimmed) {
    return "";
  }

  // If URI is an Atlas SRV URI referencing the cluster, dynamically convert it to the direct
  // replica set seedlist using credentials extracted from the provided URI itself.
  // This completely eliminates 'querySrv ECONNREFUSED' across Windows Hotspots
  // without hardcoding any user credentials into source code.
  if (trimmed.startsWith("mongodb+srv://") && trimmed.includes("tttoqtk.mongodb.net")) {
    const authMatch = trimmed.match(/^mongodb\+srv:\/\/([^@]+)@/);
    if (authMatch && authMatch[1]) {
      const auth = authMatch[1];
      const targetDb = dbName || "pakseekers";
      return `mongodb://${auth}@ac-2t2vsu4-shard-00-00.tttoqtk.mongodb.net:27017,ac-2t2vsu4-shard-00-01.tttoqtk.mongodb.net:27017,ac-2t2vsu4-shard-00-02.tttoqtk.mongodb.net:27017/${targetDb}?ssl=true&replicaSet=atlas-uj7us8-shard-0&authSource=admin&retryWrites=true&w=majority`;
    }
  }

  // If already a direct replica set URI referencing the cluster, ensure target database name
  if (trimmed.includes("tttoqtk.mongodb.net") && trimmed.includes("replicaSet=")) {
    try {
      const targetDb = dbName || "pakseekers";
      return trimmed.replace(
        /(ac-2t2vsu4-shard-00-02\.tttoqtk\.mongodb\.net:27017\/)([^?#]+)/,
        `$1${targetDb}`
      );
    } catch {
      return trimmed;
    }
  }

  // For standard external URIs, ensure the database name is set on the pathname if specified
  try {
    const url = new URL(trimmed);
    if (dbName && (!url.pathname || url.pathname === "/")) {
      url.pathname = `/${dbName}`;
    }
    return url.toString();
  } catch {
    return trimmed;
  }
}

const envSchema = z
  .object({
    MONGODB_URI: z
      .string()
      .optional()
      .refine(
        (val) => !val || val.startsWith("mongodb://") || val.startsWith("mongodb+srv://"),
        { message: "MONGODB_URI must start with 'mongodb://' or 'mongodb+srv://'" }
      ),
    DATABASE_URL: z
      .string()
      .optional()
      .refine(
        (val) => !val || val.startsWith("mongodb://") || val.startsWith("mongodb+srv://"),
        { message: "DATABASE_URL must start with 'mongodb://' or 'mongodb+srv://'" }
      ),
    DB_MONGODB_URI: z
      .string()
      .optional()
      .refine(
        (val) => !val || val.startsWith("mongodb://") || val.startsWith("mongodb+srv://"),
        { message: "DB_MONGODB_URI must start with 'mongodb://' or 'mongodb+srv://'" }
      ),
    MONGODB_DB: z
      .string()
      .min(1, "MONGODB_DB cannot be empty")
      .default("pakseekers"),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    APP_SECRET: z.string().optional(),
    ADMIN_ENTRY_PATH: z.string().default("/admin-gate"),
  })
  .transform((data) => {
    const rawUri =
      data.MONGODB_URI || data.DATABASE_URL || data.DB_MONGODB_URI || "";
    const resolvedUri = normalizeMongoUri(rawUri, data.MONGODB_DB);
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
