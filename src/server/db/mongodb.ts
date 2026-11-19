import "server-only";

/**
 * MongoDB Atlas Centralized Connection Manager — PakSeekers.
 *
 * Implements a singleton MongoClient with connection pooling.
 * Follows official Next.js best practices for persistent database connections,
 * caching the connection promise across development hot reloads (HMR) to avoid
 * connection pool exhaustion.
 *
 * Layer: Data Access / Infrastructure Layer (server-only)
 */

import { MongoClient, type Db, type MongoClientOptions } from "mongodb";
import dns from "dns";
import { env } from "@/lib/config/env";

// Ensure resilient DNS resolution for MongoDB Atlas across Windows Hotspots and local proxies.
// Default to public DNS resolvers (Google 8.8.8.8, Cloudflare 1.1.1.1) to prevent
// 'querySrv ECONNREFUSED' errors on Windows c-ares resolver.
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
  if (typeof dns.setDefaultResultOrder === "function") {
    dns.setDefaultResultOrder("ipv4first");
  }
} catch {
  // If environment restricts setServers, proceed with platform defaults
}

const DEFAULT_DB_NAME = env.MONGODB_DB || "pakseekers";

const DIRECT_REPLICA_SET_URI =
  "mongodb://syedmudassir0932_db_user:8pxv8SELRwlNtSfy@ac-2t2vsu4-shard-00-00.tttoqtk.mongodb.net:27017,ac-2t2vsu4-shard-00-01.tttoqtk.mongodb.net:27017,ac-2t2vsu4-shard-00-02.tttoqtk.mongodb.net:27017/pakseekers?ssl=true&replicaSet=atlas-uj7us8-shard-0&authSource=admin&retryWrites=true&w=majority";

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

function normalizeMongoUri(rawUri: string | undefined): string {
  if (!rawUri || typeof rawUri !== "string" || !rawUri.trim()) {
    return DIRECT_REPLICA_SET_URI;
  }

  // Strip leading and trailing quotes (single, double, or backticks)
  const trimmed = rawUri
    .trim()
    .replace(/^["'`]+|["'`]+$/g, "")
    .trim();

  // If URI references the PakSeekers cluster, ALWAYS convert to the direct replica set seedlist.
  // This completely eliminates 'querySrv ECONNREFUSED' across Windows Hotspots (192.168.137.1)
  // and local network adapters where Node.js c-ares DNS resolver cannot query SRV records.
  if (trimmed.includes("tttoqtk.mongodb.net")) {
    let db = DEFAULT_DB_NAME;
    try {
      const matchDb = trimmed.match(/tttoqtk\.mongodb\.net(?::\d+)?\/([^?#]+)/);
      if (matchDb && matchDb[1]) {
        db = matchDb[1];
      }
    } catch {
      // Default to DEFAULT_DB_NAME
    }
    return `mongodb://syedmudassir0932_db_user:8pxv8SELRwlNtSfy@ac-2t2vsu4-shard-00-00.tttoqtk.mongodb.net:27017,ac-2t2vsu4-shard-00-01.tttoqtk.mongodb.net:27017,ac-2t2vsu4-shard-00-02.tttoqtk.mongodb.net:27017/${db}?ssl=true&replicaSet=atlas-uj7us8-shard-0&authSource=admin&retryWrites=true&w=majority`;
  }

  return trimmed;
}

function getMongoUri(): string {
  const uri = env.MONGODB_URI || process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!uri) {
    throw new Error(
      "MongoDB Atlas connection string is missing. Please ensure MONGODB_URI or DATABASE_URL is set in your environment."
    );
  }
  return normalizeMongoUri(uri);
}

/**
 * Creates and connects a MongoClient with automated retry on transient network errors (ECONNRESET, ETIMEDOUT).
 */
async function createConnectedClient(uri: string): Promise<MongoClient> {
  const primaryUri = normalizeMongoUri(uri);
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

  // Guaranteed Fallback: Direct PakSeekers Cluster0 replica set seedlist if different from primaryUri
  if (primaryUri !== DIRECT_REPLICA_SET_URI) {
    try {
      console.log("Retrying with guaranteed direct replica set seedlist...");
      const fallbackClient = new MongoClient(DIRECT_REPLICA_SET_URI, MONGODB_OPTIONS);
      await fallbackClient.connect();
      console.log("✓ Connected to MongoDB Atlas via guaranteed replica set fallback.");
      return fallbackClient;
    } catch (fbErr) {
      console.warn("Guaranteed replica set fallback failed:", fbErr instanceof Error ? fbErr.message : fbErr);
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
 * Defaults to the 'pakseekers' database.
 *
 * @param dbName Optional database name override (defaults to 'pakseekers')
 */
export async function getMongoDb(dbName: string = DEFAULT_DB_NAME): Promise<Db> {
  try {
    const client = await getMongoClient();
    return client.db(dbName);
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
  try {
    const db = await getMongoDb(dbName);
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
      database: dbName,
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
    }
  } catch (err) {
    console.warn("Error while closing MongoDB connection:", err instanceof Error ? err.message : err);
  }
}
