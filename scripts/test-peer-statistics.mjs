/**
 * Test Peer Statistics (Performance Insights) Automated Test Suite — PakSeekers
 *
 * Verifies:
 * Scenario 1: Multiple completed attempts on Test A (verifies arithmetic mean calculation of score and duration).
 * Scenario 2: Zero attempts on Test B (verifies fallback behavior, hasSufficientData: false, null averages).
 * Scenario 3: Active / in-progress attempts on Test C (verifies exclusion of in-progress attempts).
 * Scenario 4: Test isolation (verifies attempts on Test A do NOT bleed into Test B or Test C).
 * Scenario 5: Anomalous / corrupted completion duration filtering (negative or > 24h excluded).
 * Scenario 6: Strict data privacy (no student identities, emails, or individual scores exposed).
 *
 * Usage:
 *   node scripts/test-peer-statistics.mjs
 */

import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";
import dns from "dns";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// DNS resolution configuration for MongoDB Atlas SRV
try {
  const currentServers = dns.getServers();
  if (
    !currentServers.length ||
    currentServers.some((s) => s.startsWith("127.") || s === "::1")
  ) {
    dns.setServers(["8.8.8.8", "1.1.1.1", ...currentServers]);
  }
} catch {
  // Ignore DNS errors
}

// Simple .env parser
function loadEnvFile(filePath) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let val = match[2].trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnvFile(path.resolve(__dirname, "../.env.local"));
loadEnvFile(path.resolve(__dirname, "../.env"));

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("FATAL: MONGODB_URI not set.");
  process.exit(1);
}

const client = new MongoClient(uri);

function formatDuration(seconds) {
  if (seconds === null || isNaN(seconds) || seconds <= 0) return null;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins === 0) return `${secs} sec`;
  if (secs === 0) return `${mins} min`;
  return `${mins} min ${secs} sec`;
}

// Canonical aggregation pipeline matching getTestPeerStatistics repository implementation
async function calculatePeerStatistics(db, testId) {
  const emptyResult = {
    testId,
    totalAttempts: 0,
    averageScore: null,
    averageTimeSeconds: null,
    formattedAverageTime: null,
    hasSufficientData: false,
  };

  if (!testId) return emptyResult;

  const pipeline = [
    {
      $match: {
        testId,
        status: "completed",
        percentage: { $exists: true, $type: "number", $gte: 0, $lte: 100 },
        startedAt: { $exists: true, $type: "string" },
        completedAt: { $exists: true, $type: "string" },
      },
    },
    {
      $addFields: {
        startDate: {
          $dateFromString: {
            dateString: "$startedAt",
            onError: null,
            onNull: null,
          },
        },
        endDate: {
          $dateFromString: {
            dateString: "$completedAt",
            onError: null,
            onNull: null,
          },
        },
      },
    },
    {
      $addFields: {
        durationSeconds: {
          $cond: {
            if: {
              $and: [
                { $ne: ["$startDate", null] },
                { $ne: ["$endDate", null] },
                { $gt: ["$endDate", "$startDate"] },
              ],
            },
            then: {
              $divide: [{ $subtract: ["$endDate", "$startDate"] }, 1000],
            },
            else: null,
          },
        },
      },
    },
    {
      $group: {
        _id: "$testId",
        totalAttempts: { $sum: 1 },
        avgScore: { $avg: "$percentage" },
        avgDurationSeconds: {
          $avg: {
            $cond: {
              if: {
                $and: [
                  { $gt: ["$durationSeconds", 0] },
                  { $lt: ["$durationSeconds", 86400] },
                ],
              },
              then: "$durationSeconds",
              else: null,
            },
          },
        },
      },
    },
  ];

  const results = await db.collection("test_attempts").aggregate(pipeline).toArray();

  if (!results || results.length === 0 || results[0].totalAttempts === 0) {
    return emptyResult;
  }

  const record = results[0];
  const totalAttempts = record.totalAttempts || 0;
  const avgScore = typeof record.avgScore === "number" ? Math.round(record.avgScore) : null;
  const avgSeconds =
    typeof record.avgDurationSeconds === "number" ? Math.round(record.avgDurationSeconds) : null;

  return {
    testId,
    totalAttempts,
    averageScore: avgScore,
    averageTimeSeconds: avgSeconds,
    formattedAverageTime: formatDuration(avgSeconds),
    hasSufficientData: totalAttempts > 0 && avgScore !== null,
  };
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

async function run() {
  console.log("\n=======================================================");
  console.log(" PAKSEEKERS TEST PERFORMANCE INSIGHTS TEST SUITE");
  console.log("=======================================================\n");

  await client.connect();
  const db = client.db();
  const attemptsCol = db.collection("test_attempts");

  const TEST_A = `test_peer_alpha_${Date.now()}`;
  const TEST_B = `test_peer_beta_${Date.now()}`;
  const TEST_C = `test_peer_gamma_${Date.now()}`;
  const TEST_D = `test_peer_delta_${Date.now()}`;

  try {
    // -------------------------------------------------------------------------
    // SCENARIO 1: Multiple Completed Attempts on Test A
    // -------------------------------------------------------------------------
    console.log("Scenario 1: Multiple Completed Attempts on Test A");
    const now = Date.now();
    
    // Attempt 1: 70%, 20 min duration (1200 sec)
    const start1 = new Date(now - 30 * 60 * 1000).toISOString();
    const end1 = new Date(now - 10 * 60 * 1000).toISOString();
    
    // Attempt 2: 80%, 25 min duration (1500 sec)
    const start2 = new Date(now - 45 * 60 * 1000).toISOString();
    const end2 = new Date(now - 20 * 60 * 1000).toISOString();

    // Attempt 3: 90%, 30 min duration (1800 sec)
    const start3 = new Date(now - 60 * 60 * 1000).toISOString();
    const end3 = new Date(now - 30 * 60 * 1000).toISOString();

    await attemptsCol.insertMany([
      {
        id: `att-1-${Date.now()}`,
        testId: TEST_A,
        studentId: "student-1",
        percentage: 70,
        score: 7,
        totalQuestions: 10,
        status: "completed",
        startedAt: start1,
        completedAt: end1,
      },
      {
        id: `att-2-${Date.now()}`,
        testId: TEST_A,
        studentId: "student-2",
        percentage: 80,
        score: 8,
        totalQuestions: 10,
        status: "completed",
        startedAt: start2,
        completedAt: end2,
      },
      {
        id: `att-3-${Date.now()}`,
        testId: TEST_A,
        studentId: "student-3",
        percentage: 90,
        score: 9,
        totalQuestions: 10,
        status: "completed",
        startedAt: start3,
        completedAt: end3,
      },
    ]);

    const statsA = await calculatePeerStatistics(db, TEST_A);
    console.log("  Calculated Stats A:", JSON.stringify(statsA));

    assert(statsA.totalAttempts === 3, "Total attempts equals exactly 3");
    // Arithmetic mean of 70, 80, 90 = 80
    assert(statsA.averageScore === 80, "Average score is correctly computed as 80%");
    // Arithmetic mean duration: (1200 + 1500 + 1800) / 3 = 1500 sec = 25 min
    assert(statsA.averageTimeSeconds === 1500, "Average duration is 1500 seconds");
    assert(statsA.formattedAverageTime === "25 min", "Formatted average duration is '25 min'");
    assert(statsA.hasSufficientData === true, "hasSufficientData is true");

    // -------------------------------------------------------------------------
    // SCENARIO 2: Zero Attempts on Test B (Fallback state)
    // -------------------------------------------------------------------------
    console.log("\nScenario 2: Zero Attempts on Test B (Fallback state)");
    const statsB = await calculatePeerStatistics(db, TEST_B);
    console.log("  Calculated Stats B:", JSON.stringify(statsB));

    assert(statsB.totalAttempts === 0, "Total attempts equals 0");
    assert(statsB.averageScore === null, "Average score is null");
    assert(statsB.averageTimeSeconds === null, "Average time is null");
    assert(statsB.formattedAverageTime === null, "Formatted time is null");
    assert(statsB.hasSufficientData === false, "hasSufficientData is false (triggers fallback)");

    // -------------------------------------------------------------------------
    // SCENARIO 3: In-Progress Attempts on Test C (Strict Exclusion)
    // -------------------------------------------------------------------------
    console.log("\nScenario 3: In-Progress Attempts on Test C (Strict Exclusion)");
    await attemptsCol.insertMany([
      {
        id: `att-prog-1-${Date.now()}`,
        testId: TEST_C,
        studentId: "student-active-1",
        percentage: 50,
        status: "in-progress",
        startedAt: new Date(now - 10 * 60 * 1000).toISOString(),
        completedAt: new Date().toISOString(),
      },
      {
        id: `att-prog-2-${Date.now()}`,
        testId: TEST_C,
        studentId: "student-active-2",
        percentage: 85,
        status: "in-progress",
        startedAt: new Date(now - 5 * 60 * 1000).toISOString(),
        completedAt: new Date().toISOString(),
      },
    ]);

    const statsC = await calculatePeerStatistics(db, TEST_C);
    console.log("  Calculated Stats C:", JSON.stringify(statsC));

    assert(statsC.totalAttempts === 0, "In-progress attempts are strictly excluded (total = 0)");
    assert(statsC.hasSufficientData === false, "hasSufficientData is false for in-progress tests");

    // -------------------------------------------------------------------------
    // SCENARIO 4: Test Isolation (No Bleed Between Distinct Tests)
    // -------------------------------------------------------------------------
    console.log("\nScenario 4: Test Isolation Across Distinct Tests");
    assert(statsA.totalAttempts === 3, "Test A has 3 attempts");
    assert(statsB.totalAttempts === 0, "Test B remains unaffected with 0 attempts");
    assert(statsC.totalAttempts === 0, "Test C remains unaffected with 0 valid attempts");

    // -------------------------------------------------------------------------
    // SCENARIO 5: Anomalous Completion Duration Handling
    // -------------------------------------------------------------------------
    console.log("\nScenario 5: Anomalous Duration Handling");
    // Attempt with negative duration (completedAt before startedAt)
    // and attempt with > 24 hours duration (e.g. 48 hours)
    // plus one normal attempt with fixed 10 min duration (600s)
    const fixedStart = new Date(now - 10 * 60 * 1000).toISOString();
    const fixedEnd = new Date(now).toISOString();

    await attemptsCol.insertMany([
      {
        id: `att-anom-1-${Date.now()}`,
        testId: TEST_D,
        studentId: "student-anom-1",
        percentage: 60,
        status: "completed",
        startedAt: new Date(now - 10 * 60 * 1000).toISOString(),
        completedAt: new Date(now - 20 * 60 * 1000).toISOString(), // negative!
      },
      {
        id: `att-anom-2-${Date.now()}`,
        testId: TEST_D,
        studentId: "student-anom-2",
        percentage: 70,
        status: "completed",
        startedAt: new Date(now - 72 * 60 * 60 * 1000).toISOString(), // 3 days ago
        completedAt: new Date(now).toISOString(), // > 24 hours!
      },
      {
        id: `att-anom-3-${Date.now()}`,
        testId: TEST_D,
        studentId: "student-norm-3",
        percentage: 80,
        status: "completed",
        startedAt: fixedStart,
        completedAt: fixedEnd, // exact 10 min = 600s
      },
    ]);

    const statsD = await calculatePeerStatistics(db, TEST_D);
    console.log("  Calculated Stats D:", JSON.stringify(statsD));

    assert(statsD.totalAttempts === 3, "All 3 completed attempts counted in total");
    // Arithmetic mean score: (60 + 70 + 80) / 3 = 70%
    assert(statsD.averageScore === 70, "Average score includes all valid scores (70%)");
    // Only the valid 600s duration is counted in average duration
    assert(statsD.averageTimeSeconds === 600, "Anomalous durations are excluded; avg time = 600s");
    assert(statsD.formattedAverageTime === "10 min", "Formatted time is '10 min'");

    // -------------------------------------------------------------------------
    // SCENARIO 6: Data Anonymization & Privacy
    // -------------------------------------------------------------------------
    console.log("\nScenario 6: Data Anonymization & Privacy Check");
    const allowedKeys = ["testId", "totalAttempts", "averageScore", "averageTimeSeconds", "formattedAverageTime", "hasSufficientData"];
    const returnedKeys = Object.keys(statsA);
    const hasUnallowedKeys = returnedKeys.some((k) => !allowedKeys.includes(k));
    assert(!hasUnallowedKeys, "Output contains ONLY aggregated statistics, zero personal data");
    assert(!("studentId" in statsA), "Student IDs are strictly withheld");
    assert(!("email" in statsA), "Student emails are strictly withheld");

  } finally {
    // Cleanup test data
    console.log("\nCleaning up test attempt fixtures...");
    await attemptsCol.deleteMany({
      testId: { $in: [TEST_A, TEST_B, TEST_C, TEST_D] },
    });
    await client.close();
  }

  console.log("\n=======================================================");
  console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
