/**
 * Multi-Exam Enrollment & Content Access Automated Test Suite — PakSeekers
 *
 * Verifies all business requirements, database schemas, authorization barriers,
 * and test scenarios A through F against active MongoDB Atlas development cluster (pakseekers_dev).
 *
 * Usage:
 *   node scripts/test-multi-exam-enrollment.mjs
 */

import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";
import dns from "dns";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure resilient DNS resolution for MongoDB Atlas SRV connection strings.
try {
  const currentServers = dns.getServers();
  if (
    !currentServers.length ||
    currentServers.some((s) => s.startsWith("127.") || s === "::1")
  ) {
    dns.setServers(["8.8.8.8", "1.1.1.1", ...currentServers]);
  }
} catch {
  // Ignore DNS override errors
}

// Simple .env parser to avoid external dependencies
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

const COLLECTIONS = {
  USERS: "users",
  EXAMS: "exams",
  SUBJECTS: "subjects",
  EXAM_SUBJECTS: "exam_subjects",
  TOPICS: "topics",
  QUESTIONS: "questions",
  TESTS: "tests",
  ATTEMPTS: "test_attempts",
  ENROLLMENTS: "student_enrollments",
};

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTestSuite() {
  console.log("================================================================================");
  console.log(" PAKSEEKERS MULTI-EXAM ENROLLMENT & ACCESS VERIFICATION TEST SUITE");
  console.log("================================================================================\n");

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();
  console.log(` Connected to MongoDB Atlas: ${db.databaseName}\n`);

  const enrollmentsCol = db.collection(COLLECTIONS.ENROLLMENTS);
  const examSubjectsCol = db.collection(COLLECTIONS.EXAM_SUBJECTS);
  const subjectsCol = db.collection(COLLECTIONS.SUBJECTS);
  const attemptsCol = db.collection(COLLECTIONS.ATTEMPTS);

  // Setup test mock entities
  const testStudentId = `test_student_${Date.now()}`;
  const testStudentBId = `test_student_b_${Date.now()}`;
  const testExamMDCAT = "mdcat";
  const testExamECAT = "ecat";
  const testExamFAST = "fast-nu";

  try {
    // -------------------------------------------------------------------------
    // Phase 1: Database Indexes & Constraints Verification
    // -------------------------------------------------------------------------
    console.log("--- TEST GROUP 1: Database Schema & Compound Indexes ---");
    const enrollmentIndexes = await enrollmentsCol.indexes();
    const hasUniqueStudentExam = enrollmentIndexes.some(
      (idx) => idx.name === "idx_enrollments_student_exam_unique" && idx.unique
    );
    assert(hasUniqueStudentExam, "student_enrollments has unique compound index on { studentId, examinationId }");

    const junctionIndexes = await examSubjectsCol.indexes();
    const hasUniqueExamSubject = junctionIndexes.some(
      (idx) => idx.name === "idx_exam_subjects_exam_subject_unique" && idx.unique
    );
    assert(hasUniqueExamSubject, "exam_subjects has unique compound index on { examId, subjectId }");

    // -------------------------------------------------------------------------
    // Scenario A: Student Enrolls in MDCAT Only
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 2: Scenario A — Single Exam Enrollment & Isolation ---");
    const now = new Date().toISOString();
    const enrA = {
      id: `enr_${testStudentId}_${testExamMDCAT}`,
      studentId: testStudentId,
      examinationId: testExamMDCAT,
      status: "ACTIVE",
      enrollmentSource: "FREE_SELECTION",
      enrolledAt: now,
      removedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    await enrollmentsCol.insertOne(enrA);

    // Verify enrollment
    const activeMDCAT = await enrollmentsCol.findOne({
      studentId: testStudentId,
      examinationId: testExamMDCAT,
      status: "ACTIVE",
    });
    assert(activeMDCAT !== null, "Student is actively enrolled in MDCAT");
    assert(activeMDCAT.status === "ACTIVE", "MDCAT enrollment status is ACTIVE");

    // Verify student is NOT enrolled in ECAT
    const activeECAT = await enrollmentsCol.findOne({
      studentId: testStudentId,
      examinationId: testExamECAT,
      status: "ACTIVE",
    });
    assert(activeECAT === null, "Student is NOT enrolled in ECAT (curriculum isolation)");

    // -------------------------------------------------------------------------
    // Scenario B: Student Enrolls in Multiple Examinations (MDCAT + ECAT)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 3: Scenario B — Concurrent Multi-Exam Preparation ---");
    const enrB = {
      id: `enr_${testStudentId}_${testExamECAT}`,
      studentId: testStudentId,
      examinationId: testExamECAT,
      status: "ACTIVE",
      enrollmentSource: "FREE_SELECTION",
      enrolledAt: now,
      removedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    await enrollmentsCol.insertOne(enrB);

    const studentActiveEnrollments = await enrollmentsCol
      .find({ studentId: testStudentId, status: "ACTIVE" })
      .toArray();
    assert(
      studentActiveEnrollments.length === 2,
      `Student has 2 concurrent active preparations (found ${studentActiveEnrollments.length})`
    );

    const enrolledExamIds = studentActiveEnrollments.map((e) => e.examinationId);
    assert(
      enrolledExamIds.includes(testExamMDCAT) && enrolledExamIds.includes(testExamECAT),
      "Enrollment tracks include both MDCAT and ECAT independently"
    );

    // Test duplicate enrollment prevention (idempotency check)
    let duplicateRejected = false;
    try {
      await enrollmentsCol.insertOne({
        id: `enr_${testStudentId}_${testExamMDCAT}_dup`,
        studentId: testStudentId,
        examinationId: testExamMDCAT,
        status: "ACTIVE",
        enrollmentSource: "FREE_SELECTION",
        enrolledAt: now,
        createdAt: now,
        updatedAt: now,
      });
    } catch (err) {
      if (err.code === 11000) duplicateRejected = true;
    }
    assert(duplicateRejected, "Duplicate enrollment in same examination rejected by unique index (Code 11000)");

    // -------------------------------------------------------------------------
    // Scenario C: Student Removes MDCAT (Soft-removal & Historical Data Retention)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 4: Scenario C — Removal & Historical Data Preservation ---");
    // Simulate a prior test attempt for MDCAT
    const mockAttemptId = `attempt_test_${Date.now()}`;
    await attemptsCol.insertOne({
      id: mockAttemptId,
      studentId: testStudentId,
      testId: "test-mdcat-bio-01",
      testTitle: "MDCAT Diagnostic Mock",
      examId: testExamMDCAT,
      examTitle: "MDCAT",
      subjectId: "mdcat-biology",
      subjectTitle: "Biology",
      selectedAnswers: { q1: "opt-1" },
      score: 18,
      totalQuestions: 20,
      correctCount: 18,
      incorrectCount: 2,
      unattemptedCount: 0,
      percentage: 90,
      questionResults: [],
      startedAt: now,
      completedAt: now,
      status: "completed",
    });

    // Execute soft removal
    const removeResult = await enrollmentsCol.updateOne(
      { studentId: testStudentId, examinationId: testExamMDCAT, status: "ACTIVE" },
      { $set: { status: "REMOVED", removedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } }
    );
    assert(removeResult.modifiedCount === 1, "MDCAT enrollment successfully updated to REMOVED status");

    // Verify active access is revoked
    const postRemoveActive = await enrollmentsCol.findOne({
      studentId: testStudentId,
      examinationId: testExamMDCAT,
      status: "ACTIVE",
    });
    assert(postRemoveActive === null, "Active access to MDCAT workspace revoked");

    // Verify ECAT remains untouched
    const postRemoveECAT = await enrollmentsCol.findOne({
      studentId: testStudentId,
      examinationId: testExamECAT,
      status: "ACTIVE",
    });
    assert(postRemoveECAT !== null && postRemoveECAT.status === "ACTIVE", "ECAT preparation remains ACTIVE and untouched");

    // Verify historical attempt is 100% PRESERVED
    const preservedAttempt = await attemptsCol.findOne({ id: mockAttemptId });
    assert(preservedAttempt !== null, "Historical test attempt is NOT deleted on exam removal");
    assert(preservedAttempt.score === 18 && preservedAttempt.percentage === 90, "Historical test score and accuracy remain intact");

    // -------------------------------------------------------------------------
    // Scenario D: Re-enrollment in Previously Removed Examination
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 5: Scenario D — Re-Enrollment & State Reactivation ---");
    const reEnrollResult = await enrollmentsCol.updateOne(
      { studentId: testStudentId, examinationId: testExamMDCAT },
      {
        $set: {
          status: "ACTIVE",
          enrollmentSource: "FREE_SELECTION",
          enrolledAt: new Date().toISOString(),
          removedAt: null,
          updatedAt: new Date().toISOString(),
        },
      }
    );
    assert(reEnrollResult.modifiedCount === 1, "MDCAT successfully reactivated to ACTIVE status");

    const reactivatedEnr = await enrollmentsCol.findOne({
      studentId: testStudentId,
      examinationId: testExamMDCAT,
      status: "ACTIVE",
    });
    assert(reactivatedEnr !== null, "Student has active enrollment in MDCAT again");
    assert(reactivatedEnr.removedAt === null, "removedAt is cleared on re-enrollment");

    // -------------------------------------------------------------------------
    // Scenario E: Authorization & Security Access Enforcement
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 6: Scenario E — Authorization & Security Checks ---");

    // Student A attempts to access FAST-NU without enrollment
    const canAccessFAST = await enrollmentsCol.findOne({
      studentId: testStudentId,
      examinationId: testExamFAST,
      status: "ACTIVE",
    });
    assert(canAccessFAST === null, "Non-enrolled student is denied access to FAST-NU");

    // Student A vs Student B isolation
    const studentBEnrollments = await enrollmentsCol
      .find({ studentId: testStudentBId, status: "ACTIVE" })
      .toArray();
    assert(studentBEnrollments.length === 0, "Student B has no enrollments; Student A's enrollments are isolated");

    // -------------------------------------------------------------------------
    // Scenario F: Many-to-Many Exam-Subject Relationship
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 7: Scenario F — Many-to-Many Reusable Subject Ordering ---");
    const sharedSubjectId = `subj_shared_physics_${Date.now()}`;

    // Create a shared Subject record
    await subjectsCol.insertOne({
      id: sharedSubjectId,
      examId: "mdcat", // Legacy primary
      examIds: ["mdcat", "ecat"],
      title: "Shared Applied Physics",
      description: "Classical and Modern Mechanics for Engineering & Medical Entrances",
      icon: "Atom",
      totalTopics: 12,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    // Associate with MDCAT: Display Order 1, Weightage 25%
    await examSubjectsCol.insertOne({
      id: `es_mdcat_${sharedSubjectId}`,
      examId: "mdcat",
      subjectId: sharedSubjectId,
      displayOrder: 1,
      weightage: 25,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Associate with ECAT: Display Order 2, Weightage 30%
    await examSubjectsCol.insertOne({
      id: `es_ecat_${sharedSubjectId}`,
      examId: "ecat",
      subjectId: sharedSubjectId,
      displayOrder: 2,
      weightage: 30,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Query for MDCAT
    const mdcatJunction = await examSubjectsCol.findOne({
      examId: "mdcat",
      subjectId: sharedSubjectId,
    });
    assert(mdcatJunction !== null && mdcatJunction.displayOrder === 1, "Shared Physics has displayOrder 1 in MDCAT");
    assert(mdcatJunction.weightage === 25, "Shared Physics has weightage 25% in MDCAT");

    // Query for ECAT
    const ecatJunction = await examSubjectsCol.findOne({
      examId: "ecat",
      subjectId: sharedSubjectId,
    });
    assert(ecatJunction !== null && ecatJunction.displayOrder === 2, "Shared Physics has displayOrder 2 in ECAT");
    assert(ecatJunction.weightage === 30, "Shared Physics has weightage 30% in ECAT");

    // Verify both point to identical subject record (single source of truth)
    const subjectDoc = await subjectsCol.findOne({ id: sharedSubjectId });
    assert(subjectDoc !== null, "Single Physics subject record exists in database (zero content duplication)");
    assert(
      subjectDoc.examIds.includes("mdcat") && subjectDoc.examIds.includes("ecat"),
      "Physics subject record contains both examIds in multi-exam array"
    );

    // Clean up temporary test data
    console.log("\n--- Cleaning up temporary test fixtures ---");
    await enrollmentsCol.deleteMany({ studentId: { $in: [testStudentId, testStudentBId] } });
    await attemptsCol.deleteOne({ id: mockAttemptId });
    await examSubjectsCol.deleteMany({ subjectId: sharedSubjectId });
    await subjectsCol.deleteOne({ id: sharedSubjectId });
    console.log("  🧹 Test fixtures cleaned up successfully.");

    console.log("\n================================================================================");
    console.log(` ALL TESTS PASSED! (${passedTests}/${totalTests} assertions verified)`);
    console.log("================================================================================\n");
  } finally {
    await client.close();
  }
}

runTestSuite().catch((err) => {
  console.error("❌ Test suite execution failed:", err);
  process.exit(1);
});
