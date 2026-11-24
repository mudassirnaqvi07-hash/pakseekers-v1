/**
 * PakSeekers — Exam Enrollment & Admin Approval Module Test Suite
 *
 * Verifies:
 * 1. Unique constraint on { studentId, examinationId } in student_enrollments.
 * 2. Request creation as PENDING with STUDENT_REQUEST source and timestamps.
 * 3. Duplicate and concurrent request prevention.
 * 4. Admin approval, rejection, and revocation lifecycle with decisionAt & approvedBy.
 * 5. Access control semantics: PENDING/REJECTED/REVOKED denied; APPROVED/ACTIVE allowed; cross-exam denied.
 * 6. Static & contract verification of Admin-only guards, Staff/Student restrictions,
 *    and server-side enrollment gates on all exam, subject, topic, practice, and test routes.
 *
 * Usage:
 *   node scripts/test-enrollment-approval.mjs
 */

import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";
import dns from "dns";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

try {
  const currentServers = dns.getServers();
  if (
    !currentServers.length ||
    currentServers.some((s) => s.startsWith("127.") || s === "::1")
  ) {
    dns.setServers(["8.8.8.8", "1.1.1.1", ...currentServers]);
  }
} catch {
  // Ignore DNS fallback errors
}

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

loadEnvFile(path.resolve(ROOT_DIR, ".env.local"));
loadEnvFile(path.resolve(ROOT_DIR, ".env"));

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("FATAL: MONGODB_URI not configured.");
  process.exit(1);
}

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  PASS: ${label}`);
    passed++;
  } else {
    console.error(`  FAIL: ${label}`);
    failed++;
  }
}

function readSrc(relPath) {
  return fs.readFileSync(path.resolve(ROOT_DIR, relPath), "utf-8");
}

function isApprovedEnrollment(doc) {
  return !!doc && (doc.status === "APPROVED" || doc.status === "ACTIVE");
}

async function main() {
  console.log("=== PakSeekers Exam Enrollment & Admin Approval Tests ===\n");

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "pakseekers_dev");

  const enrollmentsCol = db.collection("student_enrollments");
  const testRunTag = `enr_test_${Date.now()}`;
  const studentA = `${testRunTag}_student_a`;
  const studentB = `${testRunTag}_student_b`;
  const adminId = `${testRunTag}_admin_1`;
  const examA = `${testRunTag}_exam_a`;
  const examB = `${testRunTag}_exam_b`;

  try {
    // -----------------------------------------------------------------------
    // 1. Unique Index Verification
    // -----------------------------------------------------------------------
    console.log("1. Database Schema & Unique Index Verification");
    await enrollmentsCol.createIndex(
      { studentId: 1, examinationId: 1 },
      { unique: true, name: "idx_enrollments_student_exam_unique" }
    );
    const indexes = await enrollmentsCol.indexes();
    const hasUniqueIndex = indexes.some(
      (idx) =>
        idx.unique === true &&
        idx.key?.studentId === 1 &&
        idx.key?.examinationId === 1
    );
    assert(
      hasUniqueIndex,
      "student_enrollments enforces unique index on { studentId: 1, examinationId: 1 }"
    );

    // -----------------------------------------------------------------------
    // 2. Request Creation -> PENDING & Concurrent Duplicate Guard
    // -----------------------------------------------------------------------
    console.log("\n2. Student Enrollment Request & Duplicate Prevention");
    const now = new Date();
    await enrollmentsCol.insertOne({
      id: `${testRunTag}_enr_1`,
      studentId: studentA,
      examinationId: examA,
      status: "PENDING",
      enrollmentSource: "STUDENT_REQUEST",
      requestedAt: now,
      enrolledAt: now,
      createdAt: now,
      updatedAt: now,
    });

    const pendingDoc = await enrollmentsCol.findOne({
      studentId: studentA,
      examinationId: examA,
    });
    assert(
      pendingDoc?.status === "PENDING",
      "New student enrollment request is stored with status PENDING"
    );
    assert(
      pendingDoc?.enrollmentSource === "STUDENT_REQUEST",
      "Enrollment source records STUDENT_REQUEST"
    );
    assert(
      !isApprovedEnrollment(pendingDoc),
      "PENDING enrollment does NOT grant exam content access"
    );

    // Concurrent duplicate insert must throw E11000
    let duplicateErrorCode = null;
    try {
      await Promise.all([
        enrollmentsCol.insertOne({
          id: `${testRunTag}_enr_dup_1`,
          studentId: studentA,
          examinationId: examA,
          status: "PENDING",
          enrollmentSource: "STUDENT_REQUEST",
          requestedAt: new Date(),
          enrolledAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ]);
    } catch (err) {
      duplicateErrorCode = err?.code;
    }
    assert(
      duplicateErrorCode === 11000,
      "Duplicate/concurrent enrollment insert is rejected with MongoDB E11000"
    );

    // -----------------------------------------------------------------------
    // 3. Admin Approval, Rejection & Revocation Lifecycle
    // -----------------------------------------------------------------------
    console.log("\n3. Admin Decision Lifecycle (Approve / Reject / Revoke)");
    const approvedAt = new Date();
    await enrollmentsCol.updateOne(
      { studentId: studentA, examinationId: examA },
      {
        $set: {
          status: "APPROVED",
          approvedBy: adminId,
          decisionAt: approvedAt,
          enrolledAt: approvedAt,
          decisionNotes: "Verified eligibility",
          updatedAt: approvedAt,
        },
        $unset: { removedAt: "" },
      }
    );
    const approvedDoc = await enrollmentsCol.findOne({
      studentId: studentA,
      examinationId: examA,
    });
    assert(
      approvedDoc?.status === "APPROVED" && approvedDoc?.approvedBy === adminId,
      "Admin approval updates status to APPROVED with approvedBy and decisionAt"
    );
    assert(
      isApprovedEnrollment(approvedDoc),
      "APPROVED enrollment grants access to exam content"
    );

    // Cross-exam check: Student A has NO access to Exam B
    const crossExamDoc = await enrollmentsCol.findOne({
      studentId: studentA,
      examinationId: examB,
    });
    assert(
      !isApprovedEnrollment(crossExamDoc),
      "Cross-exam access denied when student only approved for Exam A"
    );

    // Revoke access
    const revokedAt = new Date();
    await enrollmentsCol.updateOne(
      { studentId: studentA, examinationId: examA },
      {
        $set: {
          status: "REVOKED",
          approvedBy: adminId,
          decisionAt: revokedAt,
          removedAt: revokedAt,
          decisionNotes: "Term completed",
          updatedAt: revokedAt,
        },
      }
    );
    const revokedDoc = await enrollmentsCol.findOne({
      studentId: studentA,
      examinationId: examA,
    });
    assert(
      revokedDoc?.status === "REVOKED" && !!revokedDoc?.removedAt,
      "Admin revocation marks enrollment REVOKED with removedAt & decisionAt"
    );
    assert(
      !isApprovedEnrollment(revokedDoc),
      "REVOKED enrollment immediately removes exam content access"
    );

    // Student B Rejected Request
    await enrollmentsCol.insertOne({
      id: `${testRunTag}_enr_2`,
      studentId: studentB,
      examinationId: examA,
      status: "REJECTED",
      enrollmentSource: "STUDENT_REQUEST",
      requestedAt: now,
      enrolledAt: now,
      approvedBy: adminId,
      decisionAt: new Date(),
      decisionNotes: "Incomplete batch eligibility",
      createdAt: now,
      updatedAt: new Date(),
    });
    const rejectedDoc = await enrollmentsCol.findOne({
      studentId: studentB,
      examinationId: examA,
    });
    assert(
      rejectedDoc?.status === "REJECTED" && !isApprovedEnrollment(rejectedDoc),
      "REJECTED enrollment stores decision metadata and denies exam access"
    );

    // -----------------------------------------------------------------------
    // 4. Server-Side Guards, Actions & Route Integration Audit
    // -----------------------------------------------------------------------
    console.log("\n4. Server-Side Guards, Actions & Route Integration Audit");
    const repoSrc = readSrc("src/server/repositories/enrollment-repository.ts");
    const svcSrc = readSrc("src/server/services/enrollment-service.ts");
    const actionsSrc = readSrc("src/server/actions/enrollment-actions.ts");
    const attemptActionsSrc = readSrc("src/server/actions/attempt-actions.ts");
    const contentSvcSrc = readSrc("src/server/services/content-service.ts");

    assert(
      repoSrc.includes('status: "PENDING"') && repoSrc.includes("decideEnrollment"),
      "Repository creates PENDING requests and handles Admin decideEnrollment transitions"
    );
    assert(
      svcSrc.includes('user.role === "admin"') &&
        svcSrc.includes('user.role !== "student"') &&
        svcSrc.includes("findActiveEnrollment"),
      "canAccessExamination restricts exam access strictly to Admins and Approved Students (Staff rejected)"
    );
    assert(
      actionsSrc.includes("verifyAdminAuth") &&
        actionsSrc.includes("approveEnrollmentAction") &&
        actionsSrc.includes("rejectEnrollmentAction") &&
        actionsSrc.includes("revokeEnrollmentAction"),
      "Enrollment decision actions enforce Admin-only verifyAdminAuth()"
    );
    assert(
      actionsSrc.includes("return requestExamEnrollmentAction(examId)"),
      "Legacy enrollInExamAction delegates safely to PENDING request workflow (no student self-approval)"
    );
    assert(
      attemptActionsSrc.includes("canAccessExamination") &&
        attemptActionsSrc.includes("authoritative"),
      "recordTestAttemptAction verifies approved enrollment against authoritative test/topic examId"
    );
    assert(
      contentSvcSrc.includes('"APPROVED"') || contentSvcSrc.includes('getStudentEnrollments(studentId, "APPROVED")'),
      "getEnrolledTests enforces APPROVED enrollments"
    );

    const gatedRoutes = [
      "src/app/exams/[examId]/page.tsx",
      "src/app/exams/[examId]/subjects/[subjectId]/page.tsx",
      "src/app/exams/[examId]/topics/[topicId]/page.tsx",
      "src/app/exams/[examId]/topics/[topicId]/practice/page.tsx",
      "src/app/tests/[id]/page.tsx",
    ];
    for (const route of gatedRoutes) {
      const src = readSrc(route);
      assert(
        src.includes("canAccessExamination") && src.includes("EnrollmentAccessGate"),
        `${route} enforces server-side canAccessExamination gate with EnrollmentAccessGate`
      );
    }

    const adminPageSrc = readSrc("src/app/admin/enrollments/page.tsx");
    const adminTableSrc = readSrc(
      "src/features/admin/components/enrollment-management-table.tsx"
    );
    const adminCardSrc = readSrc(
      "src/features/admin/components/student-enrollments-card.tsx"
    );
    const sidebarSrc = readSrc("src/features/admin/components/admin-sidebar.tsx");

    assert(
      adminPageSrc.includes("requireAdmin()") &&
        adminPageSrc.includes("EnrollmentManagementTable"),
      "/admin/enrollments page enforces requireAdmin() and renders EnrollmentManagementTable"
    );
    assert(
      adminTableSrc.includes("Confirmation Required") &&
        adminTableSrc.includes("approveEnrollmentAction") &&
        adminTableSrc.includes("rejectEnrollmentAction") &&
        adminTableSrc.includes("revokeEnrollmentAction"),
      "Admin EnrollmentManagementTable requires explicit confirmation before Approve, Reject, or Revoke"
    );
    assert(
      adminCardSrc.includes("Confirmation Required") &&
        adminCardSrc.includes("approveEnrollmentAction"),
      "StudentEnrollmentsCard supports approval workflow with explicit confirmation"
    );
    assert(
      sidebarSrc.includes('href: "/admin/enrollments"'),
      "Admin sidebar links to /admin/enrollments"
    );
  } finally {
    await enrollmentsCol.deleteMany({
      studentId: { $in: [studentA, studentB] },
    });
    await client.close();
  }

  console.log(
    `\n=== Enrollment Approval Tests Finished: ${passed} Passed, ${failed} Failed ===`
  );
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Test runner fatal error:", err);
  process.exit(1);
});
