import "server-only";

/**
 * MongoDB Atlas Centralized Connection Manager — PakSeekers.
 *
 * Implements a singleton MongoClient with connection pooling.
 * Follows official Next.js best practices for persistent database connections,
 * caching the connection promise across development hot reloads (HMR) to avoid
 * connection pool exhaustion.
 *
 * Security:
 * - Credentials must be supplied strictly via environment variables (MONGODB_URI / DATABASE_URL).
 * - Target database selection is driven by MONGODB_DB.
 * - ZERO hardcoded database connection strings, credentials, or fallback secrets.
 * - Server-only: Protected against client-side bundling.
 *
 * Layer: Data Access / Infrastructure Layer (server-only)
 */

import { MongoClient, type Db, type MongoClientOptions } from "mongodb";
import dns from "dns";
import { env, normalizeMongoUri } from "@/lib/config/env";

// Ensure resilient DNS resolution for MongoDB Atlas across Windows Hotspots and local proxies.
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
  if (typeof dns.setDefaultResultOrder === "function") {
    dns.setDefaultResultOrder("ipv4first");
  }
} catch {
  // If environment restricts setServers, proceed with platform defaults
}

const DEFAULT_DB_NAME = process.env.MONGODB_DB || env.MONGODB_DB || "pakseekers";

const MONGODB_OPTIONS: MongoClientOptions = {
  maxPoolSize: 10,
  minPoolSize: 0, // Never keep idle connections open across NAT/firewall idle timeout windows
  maxIdleTimeMS: 30000, // Recycle idle connections before NAT tables or Atlas drops them (prevents ECONNRESET)
  serverSelectionTimeoutMS: 15000,
  connectTimeoutMS: 20000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  retryReads: true,
};

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

/**
 * Resolves the active MongoDB connection URI from environment variables.
 * Throws a descriptive configuration error if no URI is configured.
 */
function getMongoUri(): string {
  const rawUri =
    process.env.MONGODB_URI ||
    env.MONGODB_URI ||
    process.env.DATABASE_URL ||
    process.env.DB_MONGODB_URI;

  if (!rawUri || !rawUri.trim()) {
    throw new Error(
      "MongoDB Atlas connection string is missing. Please ensure MONGODB_URI or DATABASE_URL is set in your server environment."
    );
  }

  const activeDb = process.env.MONGODB_DB || env.MONGODB_DB || "pakseekers";
  return normalizeMongoUri(rawUri, activeDb);
}

/**
 * Creates and connects a MongoClient with automated retry on transient network errors.
 */
async function createConnectedClient(uri: string): Promise<MongoClient> {
  const activeDb = process.env.MONGODB_DB || env.MONGODB_DB || "pakseekers";
  const primaryUri = normalizeMongoUri(uri, activeDb);

  if (!primaryUri) {
    throw new Error(
      "MongoDB connection URI is invalid. Please check your MONGODB_URI environment variable."
    );
  }

  const maxRetries = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const client = new MongoClient(primaryUri, MONGODB_OPTIONS);
      await client.connect();
      return client;
    } catch (err: unknown) {
      lastError = err;
      const errMessage = err instanceof Error ? err.message : String(err);
      console.warn(`⚠️ MongoDB connection attempt ${attempt}/${maxRetries} failed:`, errMessage);

      // Brief backoff before next attempt to allow socket reset to settle
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 400));
      }
    }
  }

  throw lastError;
}

let clientPromise: Promise<MongoClient> | null = null;

/**
 * Retrieves the connected singleton MongoClient instance.
 * Reuses the underlying connection pool across calls.
 */
export async function getMongoClient(): Promise<MongoClient> {
  if (process.env.NODE_ENV === "development") {
    // In development mode, use a global variable preserved across HMR.
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = createConnectedClient(getMongoUri()).catch((err) => {
        // Clear cached promise on error so subsequent requests can retry fresh
        global._mongoClientPromise = undefined;
        console.error("❌ Failed to connect to MongoDB Atlas (development):", err.message);
        throw err;
      });
    }
    try {
      return await global._mongoClientPromise;
    } catch (err) {
      global._mongoClientPromise = undefined;
      throw err;
    }
  }

  // In production mode, maintain module singleton with retry on error
  if (!clientPromise) {
    clientPromise = createConnectedClient(getMongoUri()).catch((err) => {
      clientPromise = null;
      console.error("❌ Failed to connect to MongoDB Atlas (production):", err.message);
      throw err;
    });
  }
  try {
    return await clientPromise;
  } catch (err) {
    clientPromise = null;
    throw err;
  }
}

/**
 * Retrieves a connected Db instance for the specified database name.
 * Target database is determined by:
 *   1. Explicit `dbName` parameter (if passed)
 *   2. `process.env.MONGODB_DB` environment variable
 *   3. `DEFAULT_DB_NAME` ("pakseekers")
 *
 * @param dbName Optional database name override
 */
export async function getMongoDb(dbName: string = DEFAULT_DB_NAME): Promise<Db> {
  const targetDb = dbName || process.env.MONGODB_DB || env.MONGODB_DB || "pakseekers";
  try {
    const client = await getMongoClient();
    return client.db(targetDb);
  } catch (err) {
    // Clear cached promise so next request attempts a fresh connection
    if (process.env.NODE_ENV === "development") {
      global._mongoClientPromise = undefined;
    } else {
      clientPromise = null;
    }
    throw err;
  }
}

/**
 * Health check utility for MongoDB Atlas.
 * Issues a 'ping' command against the database and measures round-trip latency.
 */
export async function checkMongoHealth(dbName: string = DEFAULT_DB_NAME): Promise<{
  ok: boolean;
  database: string;
  latencyMs: number;
  error?: string;
}> {
  const startTime = Date.now();
  const targetDb = dbName || process.env.MONGODB_DB || env.MONGODB_DB || "pakseekers";
  try {
    const db = await getMongoDb(targetDb);
    const pingResult = await db.command({ ping: 1 });
    const latencyMs = Date.now() - startTime;
    const ok = pingResult.ok === 1;

    return {
      ok,
      database: db.databaseName,
      latencyMs,
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    return {
      ok: false,
      database: targetDb,
      latencyMs,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Gracefully closes the MongoDB connection pool.
 * Typically used in test suites or migration scripts.
 */
export async function closeMongoConnection(): Promise<void> {
  try {
    const client = await getMongoClient();
    if (client) {
      await client.close();
    }
    if (process.env.NODE_ENV === "development") {
      global._mongoClientPromise = undefined;
    } else {
      clientPromise = null;
    }
  } catch (err) {
    console.warn("Error while closing MongoDB connection:", err instanceof Error ? err.message : err);
  }
}
