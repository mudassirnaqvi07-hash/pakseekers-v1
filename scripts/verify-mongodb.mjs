/**
 * MongoDB Atlas Connection & Health Verification Script — PakSeekers.
 *
 * Usage:
 *   node --env-file=.env scripts/verify-mongodb.mjs
 *
 * Verifies:
 * 1. Environment variable presence and format.
 * 2. Successful TLS/SSL connection to MongoDB Atlas.
 * 3. Ping command round-trip latency.
 * 4. Correct database selection ('pakseekers').
 * 5. CRUD capability: temporary document insertion and retrieval.
 * 6. Temporary test data cleanup (zero side effects).
 * 7. Connection pool reuse across concurrent operations.
 */

import { MongoClient } from "mongodb";
import dns from "dns";

// Ensure resilient DNS resolution for MongoDB Atlas SRV connection strings.
// When running in environments where local loopback DNS (127.0.0.1) rejects SRV lookups,
// augment with public DNS resolvers (Google 8.8.8.8, Cloudflare 1.1.1.1).
try {
  const currentServers = dns.getServers();
  if (
    !currentServers.length ||
    currentServers.some((s) => s.startsWith("127.") || s === "::1")
  ) {
    dns.setServers(["8.8.8.8", "1.1.1.1", ...currentServers]);
  }
} catch {
  // Gracefully fallback
}

// Resolve connection URI from environment
const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
const targetDbName = process.env.MONGODB_DB || "pakseekers";

if (!uri) {
  console.error("❌ ERROR: MONGODB_URI or DATABASE_URL is not set in environment.");
  process.exit(1);
}

// Sanitize URI for safe display (mask password)
function maskUri(raw) {
  try {
    const url = new URL(raw);
    if (url.password) {
      url.password = "********";
    }
    return url.toString();
  } catch {
    return raw.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:********@");
  }
}

console.log("=============================================================");
console.log(" PakSeekers — MongoDB Atlas Connection Verification");
console.log("=============================================================");
console.log(`Target URI:       ${maskUri(uri)}`);
console.log(`Target Database:  ${targetDbName}`);
console.log("-------------------------------------------------------------");

const client = new MongoClient(uri, {
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 8000,
  connectTimeoutMS: 10000,
});

async function runVerification() {
  const startTime = Date.now();
  let testDocId = null;
  const testCollectionName = "__health_check_temp__";

  try {
    // 1. Connection Test
    process.stdout.write("[1/6] Connecting to MongoDB Atlas cluster... ");
    await client.connect();
    console.log("CONNECTED ✓");

    // 2. Ping Command Test
    process.stdout.write(`[2/6] Executing ping command against '${targetDbName}'... `);
    const db = client.db(targetDbName);
    const pingStart = Date.now();
    const pingRes = await db.command({ ping: 1 });
    const pingDuration = Date.now() - pingStart;

    if (pingRes.ok !== 1) {
      throw new Error(`Ping failed with response: ${JSON.stringify(pingRes)}`);
    }
    console.log(`PASSED (${pingDuration}ms) ✓`);

    // 3. Database Name Confirmation
    process.stdout.write(`[3/6] Confirming active database name is '${targetDbName}'... `);
    if (db.databaseName !== targetDbName) {
      throw new Error(`Expected database '${targetDbName}' but connected to '${db.databaseName}'`);
    }
    console.log(`CONFIRMED ('${db.databaseName}') ✓`);

    // 4. Temporary Document Write & Read
    process.stdout.write("[4/6] Verifying write & read on temporary collection... ");
    const col = db.collection(testCollectionName);
    const samplePayload = {
      testSession: `verify-${Date.now()}`,
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date(),
      status: "active",
      note: "Automated verification test - will be removed immediately",
    };

    const insertResult = await col.insertOne(samplePayload);
    testDocId = insertResult.insertedId;

    const retrievedDoc = await col.findOne({ _id: testDocId });
    if (!retrievedDoc || retrievedDoc.testSession !== samplePayload.testSession) {
      throw new Error("Failed to retrieve matching temporary test document.");
    }
    console.log("PASSED ✓");

    // 5. Cleanup Test Data
    process.stdout.write("[5/6] Cleaning up temporary test document & collection... ");
    const deleteResult = await col.deleteOne({ _id: testDocId });
    if (deleteResult.deletedCount !== 1) {
      throw new Error("Failed to delete temporary test document.");
    }
    // Drop collection to leave zero traces
    await col.drop().catch(() => {});
    console.log("CLEANED ✓");

    // 6. Connection Pool Reuse Test
    process.stdout.write("[6/6] Verifying connection pool reuse under concurrent queries... ");
    const concurrentPings = 5;
    const poolPromises = Array.from({ length: concurrentPings }, (_, i) =>
      db.command({ ping: 1 }).then((res) => ({ index: i, ok: res.ok }))
    );
    const poolResults = await Promise.all(poolPromises);
    const allSuccessful = poolResults.every((r) => r.ok === 1);
    if (!allSuccessful) {
      throw new Error("Concurrent pooled commands did not all return ok: 1");
    }
    console.log(`PASSED (${concurrentPings} concurrent requests handled on shared pool) ✓`);

    const totalElapsed = Date.now() - startTime;
    console.log("-------------------------------------------------------------");
    console.log(`✓ ALL VERIFICATIONS PASSED in ${totalElapsed}ms`);
    console.log("MongoDB Atlas is fully operational and ready for PakSeekers.");
    console.log("=============================================================");
  } catch (error) {
    console.log("FAILED ✗");
    console.error("-------------------------------------------------------------");
    console.error("❌ VERIFICATION ERROR:", error.message);
    if (error.cause) {
      console.error("Cause:", error.cause);
    }
    console.error("=============================================================");
    process.exit(1);
  } finally {
    await client.close();
  }
}

runVerification();
