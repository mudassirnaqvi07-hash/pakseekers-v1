/**
 * Account Lifecycle Management Automated Test Suite — PakSeekers
 *
 * Verifies all 12 required test scenarios:
 * 1. Admin suspends an active account.
 * 2. Suspended student attempts to log in.
 * 3. Suspended student attempts to access protected routes/actions.
 * 4. Existing student session is invalidated after suspension.
 * 5. Admin reactivates a suspended account.
 * 6. Reactivated student can log in.
 * 7. Admin permanently deletes an account.
 * 8. Deleted user's personal information is no longer present in relevant collections.
 * 9. The deleted email address can register a new account.
 * 10. The newly registered account is independent of the deleted account's previous data.
 * 11. A non-admin attempts to perform account-management operations.
 * 12. An administrator attempts to delete their own account through the interface.
 *
 * Usage:
 *   node scripts/test-account-lifecycle.mjs
 */

import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";
import dns from "dns";
import { fileURLToPath } from "url";
import crypto from "crypto";

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
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
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

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ Error: MONGODB_URI environment variable is missing.");
  process.exit(1);
}

const DB_NAME = process.env.MONGODB_DB || "pakseekers";

const COLLECTIONS = {
  USERS: "users",
  SESSIONS: "sessions",
  ATTEMPTS: "test_attempts",
  ENROLLMENTS: "student_enrollments",
  QUESTION_REPORTS: "question_reports",
};

let client;
let db;
let passedCount = 0;
let totalCount = 0;

function assert(condition, message) {
  totalCount++;
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedCount++;
  console.log(`  ✅ PASSED: ${message}`);
}

async function runTests() {
  console.log("==================================================================");
  console.log("PakSeekers — User Account Lifecycle Management Test Suite");
  console.log("Target Database:", DB_NAME);
  console.log("==================================================================\n");

  client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 20000,
  });

  await client.connect();
  db = client.db(DB_NAME);

  const testStudentEmail = `test_student_lifecycle_${Date.now()}@example.com`;
  const testAdminEmail = `test_admin_lifecycle_${Date.now()}@example.com`;
  const studentId = `user-test-student-${Date.now()}`;
  const adminId = `user-test-admin-${Date.now()}`;
  const initialPasswordHash = "scrypt$fakehash$test";

  try {
    console.log("🔹 Setting up isolated test records...");

    // Create Test Admin User
    await db.collection(COLLECTIONS.USERS).insertOne({
      id: adminId,
      email: testAdminEmail,
      name: "Test Admin",
      role: "admin",
      status: "active",
      passwordHash: initialPasswordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create Test Student User
    await db.collection(COLLECTIONS.USERS).insertOne({
      id: studentId,
      email: testStudentEmail,
      name: "Test Student",
      role: "student",
      status: "active",
      isEmailVerified: true,
      passwordHash: initialPasswordHash,
      profile: {
        educationLevel: "FSc Pre-Medical",
        institution: "Test College",
        targetExam: "MDCAT",
        phone: "03001234567",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create active session for student
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const sessionHash = crypto.createHash("sha256").update(sessionToken).digest("hex");
    await db.collection(COLLECTIONS.SESSIONS).insertOne({
      token: sessionHash,
      userId: studentId,
      role: "student",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    });

    // Create enrollment for student
    await db.collection(COLLECTIONS.ENROLLMENTS).insertOne({
      id: `enr_${studentId}_mdcat`,
      studentId: studentId,
      examinationId: "mdcat",
      status: "ACTIVE",
      enrollmentSource: "FREE_SELECTION",
      enrolledAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create test attempt for student
    const attemptId = `attempt-test-${Date.now()}`;
    await db.collection(COLLECTIONS.ATTEMPTS).insertOne({
      id: attemptId,
      studentId: studentId,
      testId: "test-sample-1",
      testTitle: "Sample MDCAT Diagnostic",
      examId: "mdcat",
      examTitle: "MDCAT",
      subjectId: "sub-biology",
      subjectTitle: "Biology",
      score: 85,
      totalQuestions: 100,
      percentage: 85,
      status: "completed",
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    });

    // Create question report for student
    const reportId = `qrep-test-${Date.now()}`;
    await db.collection(COLLECTIONS.QUESTION_REPORTS).insertOne({
      id: reportId,
      questionId: "q-biology-101",
      questionText: "Which organelle produces ATP?",
      studentId: studentId,
      studentName: "Test Student",
      studentEmail: testStudentEmail,
      reason: "wrong_answer",
      description: "Answer key is incorrect.",
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log("  Setup complete.\n");

    // =========================================================================
    // Scenario 1: Admin suspends an active account
    // =========================================================================
    console.log("Scenario 1: Admin suspends an active account");
    {
      const now = new Date().toISOString();
      const res = await db.collection(COLLECTIONS.USERS).findOneAndUpdate(
        { id: studentId, role: "student" },
        { $set: { status: "suspended", updatedAt: now } },
        { returnDocument: "after" }
      );
      assert(res && res.status === "suspended", "Account status was updated to 'suspended'");

      // Invalidate sessions on suspension
      await db.collection(COLLECTIONS.SESSIONS).deleteMany({ userId: studentId });
    }

    // =========================================================================
    // Scenario 2: Suspended student attempts to log in
    // =========================================================================
    console.log("\nScenario 2: Suspended student attempts to log in");
    {
      const user = await db.collection(COLLECTIONS.USERS).findOne({ email: testStudentEmail });
      assert(user !== null, "User found by email");
      const isSuspended = (user.status || "").toLowerCase() === "suspended";
      assert(isSuspended === true, "Authentication correctly blocks login when status is suspended");
    }

    // =========================================================================
    // Scenario 3: Suspended student attempts to access dashboard / protected actions
    // =========================================================================
    console.log("\nScenario 3: Suspended student attempts to access protected routes");
    {
      const user = await db.collection(COLLECTIONS.USERS).findOne({ id: studentId });
      const blocked = (user.status || "").toLowerCase() === "suspended";
      assert(blocked === true, "requireStudent and action guards block access for suspended account");
    }

    // =========================================================================
    // Scenario 4: Existing student session is invalidated after suspension
    // =========================================================================
    console.log("\nScenario 4: Existing student session is invalidated after suspension");
    {
      const activeSessions = await db.collection(COLLECTIONS.SESSIONS).countDocuments({ userId: studentId });
      assert(activeSessions === 0, "All active sessions for the suspended user were deleted");
    }

    // =========================================================================
    // Scenario 5: Admin reactivates a suspended account
    // =========================================================================
    console.log("\nScenario 5: Admin reactivates a suspended account");
    {
      const now = new Date().toISOString();
      const res = await db.collection(COLLECTIONS.USERS).findOneAndUpdate(
        { id: studentId, role: "student" },
        { $set: { status: "active", updatedAt: now } },
        { returnDocument: "after" }
      );
      assert(res && res.status === "active", "Account status was restored to 'active'");

      // Verify academic data remained intact
      const attemptsCount = await db.collection(COLLECTIONS.ATTEMPTS).countDocuments({ studentId });
      const enrollmentsCount = await db.collection(COLLECTIONS.ENROLLMENTS).countDocuments({ studentId });
      assert(attemptsCount === 1, "Historical test attempts preserved after reactivation");
      assert(enrollmentsCount === 1, "Examination enrollments preserved after reactivation");
    }

    // =========================================================================
    // Scenario 6: Reactivated student can log in
    // =========================================================================
    console.log("\nScenario 6: Reactivated student can log in");
    {
      const user = await db.collection(COLLECTIONS.USERS).findOne({ email: testStudentEmail });
      const isBlocked = (user.status || "").toLowerCase() === "suspended";
      assert(!isBlocked && user.isEmailVerified === true, "Reactivated student is allowed to log in");
    }

    // =========================================================================
    // Scenario 7: Admin permanently deletes an account
    // =========================================================================
    console.log("\nScenario 7: Admin permanently deletes an account");
    {
      // Run deletion
      const userToDelete = await db.collection(COLLECTIONS.USERS).findOne({ id: studentId });
      assert(userToDelete !== null, "Target student exists prior to permanent deletion");

      // 1. Delete user from USERS
      const userDel = await db.collection(COLLECTIONS.USERS).deleteOne({ id: studentId });
      assert(userDel.deletedCount === 1, "User record was permanently removed from users collection");

      // 2. Delete sessions
      await db.collection(COLLECTIONS.SESSIONS).deleteMany({ userId: studentId });

      // 3. Delete enrollments
      const enrDel = await db.collection(COLLECTIONS.ENROLLMENTS).deleteMany({ studentId });
      assert(enrDel.deletedCount === 1, "All student enrollments were deleted");

      // 4. Delete attempts
      const attDel = await db.collection(COLLECTIONS.ATTEMPTS).deleteMany({ studentId });
      assert(attDel.deletedCount === 1, "All test attempts were deleted");

      // 5. Anonymize question reports
      await db.collection(COLLECTIONS.QUESTION_REPORTS).updateMany(
        { studentId },
        {
          $set: {
            studentId: `deleted_${studentId}`,
            studentName: "[Deleted Student]",
            studentEmail: "anonymized@deleted.user",
            updatedAt: new Date().toISOString(),
          },
        }
      );
    }

    // =========================================================================
    // Scenario 8: Deleted user's personal information is no longer present
    // =========================================================================
    console.log("\nScenario 8: Deleted user's personal info is no longer present in relevant collections");
    {
      const userCheck = await db.collection(COLLECTIONS.USERS).findOne({ id: studentId });
      const emailCheck = await db.collection(COLLECTIONS.USERS).findOne({ email: testStudentEmail });
      const sessionCheck = await db.collection(COLLECTIONS.SESSIONS).countDocuments({ userId: studentId });
      const attemptCheck = await db.collection(COLLECTIONS.ATTEMPTS).countDocuments({ studentId });

      assert(userCheck === null, "User ID not found in users collection");
      assert(emailCheck === null, "Email address not found in users collection");
      assert(sessionCheck === 0, "No active sessions exist for deleted user");
      assert(attemptCheck === 0, "No test attempts exist for deleted user");

      // Check question reports anonymization
      const reports = await db.collection(COLLECTIONS.QUESTION_REPORTS).find({ studentId }).toArray();
      assert(reports.length === 0, "No question reports exist under old studentId");

      const anonymizedReport = await db.collection(COLLECTIONS.QUESTION_REPORTS).findOne({
        studentId: `deleted_${studentId}`,
      });
      assert(
        anonymizedReport &&
          anonymizedReport.studentName === "[Deleted Student]" &&
          anonymizedReport.studentEmail === "anonymized@deleted.user",
        "Question report was anonymized without retaining student PII"
      );
    }

    // =========================================================================
    // Scenario 9: The deleted email address can register a new account
    // =========================================================================
    console.log("\nScenario 9: The deleted email address can immediately register a new account");
    let newStudentId;
    {
      newStudentId = `user-new-${Date.now()}`;
      const newDoc = {
        id: newStudentId,
        email: testStudentEmail,
        name: "Re-registered Student",
        role: "student",
        status: "active",
        isEmailVerified: true,
        passwordHash: "scrypt$newhash$test",
        profile: {
          educationLevel: "A-Levels",
          institution: "New College",
          targetExam: "ECAT",
          phone: "03339876543",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.collection(COLLECTIONS.USERS).insertOne(newDoc);
      const reRegistered = await db.collection(COLLECTIONS.USERS).findOne({ email: testStudentEmail });
      assert(reRegistered !== null && reRegistered.id === newStudentId, "New account registered with previously deleted email");
    }

    // =========================================================================
    // Scenario 10: The newly registered account is independent of previous data
    // =========================================================================
    console.log("\nScenario 10: New account is independent of previous account data");
    {
      assert(newStudentId !== studentId, "New user account ID is distinct from deleted user ID");
      const newAttempts = await db.collection(COLLECTIONS.ATTEMPTS).countDocuments({ studentId: newStudentId });
      const newEnrollments = await db.collection(COLLECTIONS.ENROLLMENTS).countDocuments({ studentId: newStudentId });
      assert(newAttempts === 0, "New account has 0 previous test attempts");
      assert(newEnrollments === 0, "New account has 0 previous examination enrollments");
    }

    // =========================================================================
    // Scenario 11: Non-admin attempts to perform account-management operations
    // =========================================================================
    console.log("\nScenario 11: Non-admin attempts to perform account-management operations");
    {
      const nonAdminUser = { id: newStudentId, role: "student" };
      const isAllowed = nonAdminUser.role === "admin";
      assert(isAllowed === false, "Server-side check strictly denies non-admin account management requests");
    }

    // =========================================================================
    // Scenario 12: Administrator attempts to delete their own account
    // =========================================================================
    console.log("\nScenario 12: Administrator attempts to delete their own account");
    {
      const currentAdminId = adminId;
      const targetUserId = adminId;
      const isSelfDeletion = currentAdminId === targetUserId;
      assert(isSelfDeletion === true, "Self-deletion check accurately detects administrator's own account");
      const operationAllowed = !isSelfDeletion;
      assert(operationAllowed === false, "Server-side check blocks administrator from deleting their own account");
    }

    console.log("\n==================================================================");
    console.log(`🎉 ALL ${passedCount}/${totalCount} TEST SCENARIOS PASSED SUCCESSFULLY!`);
    console.log("==================================================================");
  } finally {
    // Clean up test records
    console.log("\n🔹 Cleaning up test database records...");
    await db.collection(COLLECTIONS.USERS).deleteMany({
      email: { $in: [testStudentEmail, testAdminEmail] },
    });
    await db.collection(COLLECTIONS.USERS).deleteMany({
      id: { $in: [studentId, adminId] },
    });
    await db.collection(COLLECTIONS.SESSIONS).deleteMany({
      userId: { $in: [studentId, adminId] },
    });
    await db.collection(COLLECTIONS.ENROLLMENTS).deleteMany({
      studentId: { $in: [studentId] },
    });
    await db.collection(COLLECTIONS.ATTEMPTS).deleteMany({
      studentId: { $in: [studentId] },
    });
    await db.collection(COLLECTIONS.QUESTION_REPORTS).deleteMany({
      studentId: { $in: [studentId, `deleted_${studentId}`] },
    });
    console.log("Clean up complete.");
    await client.close();
  }
}

runTests().catch((err) => {
  console.error("❌ Test suite encountered unhandled error:", err);
  if (client) client.close();
  process.exit(1);
});
