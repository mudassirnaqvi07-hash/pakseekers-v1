/**
 * Data Migration Script: JSON Store -> MongoDB Atlas — PakSeekers Phase 1.
 *
 * Usage:
 *   node --env-file=.env scripts/migrate-json-to-mongodb.mjs
 *
 * Idempotent migration that safely imports records from:
 *   - src/data/content-store.json (Exams, Subjects, Topics, Questions, Tests)
 *   - src/data/user-store.json (Users, Sessions, Attempts)
 * into live MongoDB Atlas collections.
 */

import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";
import dns from "dns";

// Ensure DNS resilience for SRV records on Windows/local environments
try {
  const currentServers = dns.getServers();
  if (
    !currentServers.length ||
    currentServers.some((s) => s.startsWith("127.") || s === "::1")
  ) {
    dns.setServers(["8.8.8.8", "1.1.1.1", ...currentServers]);
  }
} catch {
  // Ignore
}

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
const dbName = process.env.MONGODB_DB || "pakseekers_dev";

if (!uri) {
  console.error("❌ ERROR: MONGODB_URI or DATABASE_URL is required.");
  process.exit(1);
}

const CONTENT_FILE = path.join(process.cwd(), "src", "data", "content-store.json");
const USER_FILE = path.join(process.cwd(), "src", "data", "user-store.json");

if (!fs.existsSync(CONTENT_FILE) || !fs.existsSync(USER_FILE)) {
  console.error("❌ ERROR: JSON store files missing.");
  process.exit(1);
}

const contentData = JSON.parse(fs.readFileSync(CONTENT_FILE, "utf-8"));
const userData = JSON.parse(fs.readFileSync(USER_FILE, "utf-8"));

console.log("=============================================================");
console.log(" PakSeekers — Idempotent JSON -> MongoDB Atlas Migration");
console.log("=============================================================");
console.log(`Target Database: ${dbName}`);
console.log(`Content Store:   ${CONTENT_FILE}`);
console.log(`User Store:      ${USER_FILE}`);
console.log("-------------------------------------------------------------");

const client = new MongoClient(uri, {
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 10000,
});

async function migrateCollection(db, collectionName, records, idField = "id") {
  const col = db.collection(collectionName);
  let upsertedCount = 0;
  let modifiedCount = 0;
  let matchedCount = 0;

  if (!records || records.length === 0) {
    return { total: 0, upserted: 0, modified: 0, matched: 0 };
  }

  const operations = records.map((record) => ({
    updateOne: {
      filter: { [idField]: record[idField] },
      update: { $set: record },
      upsert: true,
    },
  }));

  const res = await col.bulkWrite(operations, { ordered: false });
  upsertedCount = res.upsertedCount;
  modifiedCount = res.modifiedCount;
  matchedCount = res.matchedCount;

  return {
    total: records.length,
    upserted: upsertedCount,
    modified: modifiedCount,
    matched: matchedCount,
  };
}

async function run() {
  const startTime = Date.now();
  try {
    await client.connect();
    const db = client.db(dbName);

    console.log("✓ Connected to MongoDB Atlas cluster.");

    // 1. Migrate Exams
    process.stdout.write("Migrating 'exams'... ");
    const examRes = await migrateCollection(db, "exams", contentData.exams || []);
    console.log(`Done. Total: ${examRes.total} (New: ${examRes.upserted}, Matched: ${examRes.matched})`);

    // 2. Migrate Subjects
    process.stdout.write("Migrating 'subjects'... ");
    const subjectRes = await migrateCollection(db, "subjects", contentData.subjects || []);
    console.log(`Done. Total: ${subjectRes.total} (New: ${subjectRes.upserted}, Matched: ${subjectRes.matched})`);

    // 3. Migrate Topics
    process.stdout.write("Migrating 'topics'... ");
    const topicRes = await migrateCollection(db, "topics", contentData.topics || []);
    console.log(`Done. Total: ${topicRes.total} (New: ${topicRes.upserted}, Matched: ${topicRes.matched})`);

    // 4. Migrate Questions
    process.stdout.write("Migrating 'questions'... ");
    const questionRes = await migrateCollection(db, "questions", contentData.questions || []);
    console.log(`Done. Total: ${questionRes.total} (New: ${questionRes.upserted}, Matched: ${questionRes.matched})`);

    // 5. Migrate Tests
    process.stdout.write("Migrating 'tests'... ");
    const testRes = await migrateCollection(db, "tests", contentData.tests || []);
    console.log(`Done. Total: ${testRes.total} (New: ${testRes.upserted}, Matched: ${testRes.matched})`);

    // 6. Migrate Users
    process.stdout.write("Migrating 'users'... ");
    const userRes = await migrateCollection(db, "users", userData.users || []);
    console.log(`Done. Total: ${userRes.total} (New: ${userRes.upserted}, Matched: ${userRes.matched})`);

    // 7. Migrate Sessions
    process.stdout.write("Migrating 'sessions'... ");
    const sessionRes = await migrateCollection(db, "sessions", userData.sessions || [], "token");
    console.log(`Done. Total: ${sessionRes.total} (New: ${sessionRes.upserted}, Matched: ${sessionRes.matched})`);

    // 8. Migrate Attempts
    process.stdout.write("Migrating 'test_attempts'... ");
    const attemptRes = await migrateCollection(db, "test_attempts", userData.attempts || []);
    console.log(`Done. Total: ${attemptRes.total} (New: ${attemptRes.upserted}, Matched: ${attemptRes.matched})`);

    // 9. Build Indexes
    console.log("-------------------------------------------------------------");
    console.log("Building & verifying collection indexes...");
    const indexResults = [
      await db.collection("users").createIndex({ email: 1 }, { unique: true }),
      await db.collection("users").createIndex({ id: 1 }, { unique: true }),
      await db.collection("sessions").createIndex({ token: 1 }, { unique: true }),
      await db.collection("sessions").createIndex({ userId: 1 }),
      await db.collection("exams").createIndex({ id: 1 }, { unique: true }),
      await db.collection("exams").createIndex({ code: 1 }, { unique: true }),
      await db.collection("subjects").createIndex({ id: 1 }, { unique: true }),
      await db.collection("subjects").createIndex({ examId: 1, status: 1 }),
      await db.collection("topics").createIndex({ id: 1 }, { unique: true }),
      await db.collection("topics").createIndex({ subjectId: 1, examId: 1 }),
      await db.collection("questions").createIndex({ id: 1 }, { unique: true }),
      await db.collection("questions").createIndex({ topicId: 1, status: 1 }),
      await db.collection("questions").createIndex({ examId: 1, subjectId: 1 }),
      await db.collection("tests").createIndex({ id: 1 }, { unique: true }),
      await db.collection("tests").createIndex({ examId: 1, status: 1 }),
      await db.collection("test_attempts").createIndex({ id: 1 }, { unique: true }),
      await db.collection("test_attempts").createIndex({ studentId: 1, completedAt: -1 }),
    ];
    console.log(`✓ Built ${indexResults.length} indexes across all collections.`);

    // 10. Verification of Live Database Counts
    console.log("-------------------------------------------------------------");
    console.log("Verifying live MongoDB Atlas collection counts:");
    const counts = {
      exams: await db.collection("exams").countDocuments(),
      subjects: await db.collection("subjects").countDocuments(),
      topics: await db.collection("topics").countDocuments(),
      questions: await db.collection("questions").countDocuments(),
      tests: await db.collection("tests").countDocuments(),
      users: await db.collection("users").countDocuments(),
      sessions: await db.collection("sessions").countDocuments(),
      attempts: await db.collection("test_attempts").countDocuments(),
    };
    console.table(counts);

    const elapsed = Date.now() - startTime;
    console.log(`✓ Migration completed successfully in ${elapsed}ms.`);
    console.log("=============================================================");
  } catch (error) {
    console.error("❌ Migration failed with error:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

run();
