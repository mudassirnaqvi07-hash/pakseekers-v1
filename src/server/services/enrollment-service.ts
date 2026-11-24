import "server-only";

/**
 * Student Enrollment & Approval Service — PakSeekers.
 *
 * Implements:
 * - Authoritative server-side access enforcement (canAccessExamination)
 * - Approval-gated enrollment lifecycle (PENDING -> APPROVED / REJECTED -> REVOKED)
 * - Future subscription eligibility compatibility hook
 * - Enriched Admin enrollment roster queries
 */

import type {
  ActionResult,
  Exam,
  StudentEnrollment,
  EnrollmentSource,
  EnrollmentStatus,
  EnrolledExamDetails,
  Test,
} from "@/types";
import * as enrollmentRepo from "@/server/repositories/enrollment-repository";
import * as contentRepo from "@/server/repositories/content-repository";
import { findUserById, getStudentsList } from "@/server/repositories/user-repository";
import { getMongoDb, COLLECTIONS, toSafeUser, type UserDoc } from "@/server/db";

export interface AdminEnrollmentView {
  enrollment: StudentEnrollment;
  student: {
    id: string;
    name: string;
    email: string;
    targetExam?: string;
    status?: string;
  } | null;
  exam: {
    id: string;
    code: string;
    title: string;
  } | null;
  approver: {
    id: string;
    name: string;
    email: string;
  } | null;
}

/**
 * Authoritative access check for an examination track.
 *
 * Rules:
 * 1. Admin users always have full access.
 * 2. Students MUST possess an APPROVED (or legacy ACTIVE) enrollment record.
 * 3. PENDING, REJECTED, REVOKED, REMOVED, or unauthenticated users are strictly denied access.
 */
export async function canAccessExamination(
  userId: string,
  examId: string
): Promise<boolean> {
  if (!userId || !examId) return false;

  const user = await findUserById(userId);
  if (!user) return false;
  if (user.role === "admin") {
    return true;
  }

  // Staff use /staff/* portal, not student exam learning workspaces
  if (user.role !== "student") {
    return false;
  }

  const approvedEnrollment = await enrollmentRepo.findActiveEnrollment(userId, examId);
  return approvedEnrollment !== null;
}

/**
 * Decoupled eligibility hook for future paid subscriptions or prerequisite checks.
 * Currently allows any active, verified student to submit an enrollment request.
 */
export async function checkEnrollmentEligibility(
  studentId: string,
  examId: string
): Promise<{ eligible: boolean; reason?: string; autoApprove?: boolean }> {
  const user = await findUserById(studentId);
  if (!user || user.role !== "student") {
    return { eligible: false, reason: "Only student accounts can apply for exam enrollment." };
  }
  if ((user.status || "").toLowerCase() === "suspended") {
    return { eligible: false, reason: "Your account is currently suspended." };
  }
  if (user.isEmailVerified === false) {
    return { eligible: false, reason: "Please verify your email address before requesting enrollment." };
  }

  const exam = await contentRepo.getExamById(examId);
  if (!exam || exam.status !== "active") {
    return { eligible: false, reason: "This examination is not currently open for enrollment." };
  }

  return { eligible: true, autoApprove: false };
}

/**
 * Verifies if a student can access a specific test based on its parent examination.
 */
export async function verifyTestAccess(
  studentId: string,
  testId: string
): Promise<{ canAccess: boolean; examId?: string; test?: Test; error?: string }> {
  if (!studentId || !testId) {
    return { canAccess: false, error: "Student ID and Test ID are required." };
  }

  const test = await contentRepo.getTestById(testId);
  if (!test || test.status !== "published") {
    return { canAccess: false, error: "The requested test is not available." };
  }

  const hasAccess = await canAccessExamination(studentId, test.examId);
  if (!hasAccess) {
    return {
      canAccess: false,
      examId: test.examId,
      test,
      error: "Approved enrollment in the parent examination is required to access this test.",
    };
  }

  return { canAccess: true, examId: test.examId, test };
}

/**
 * Student workflow: Submit a PENDING enrollment request for an examination.
 * Prevents duplicate requests and handles concurrent requests safely.
 */
export async function requestExamEnrollment(
  studentId: string,
  examId: string,
  source: EnrollmentSource = "STUDENT_REQUEST"
): Promise<ActionResult<StudentEnrollment>> {
  try {
    if (!studentId || !examId) {
      return { success: false, error: "Student ID and Exam ID are required." };
    }

    const eligibility = await checkEnrollmentEligibility(studentId, examId);
    if (!eligibility.eligible) {
      return { success: false, error: eligibility.reason || "Not eligible for enrollment." };
    }

    // Future paid subscription fast-path without changing access checks
    if (eligibility.autoApprove || source === "SUBSCRIPTION") {
      const approved = await enrollmentRepo.createOrReactivateEnrollment(
        studentId,
        examId.trim(),
        source
      );
      return { success: true, data: approved };
    }

    const exam = await contentRepo.getExamById(examId);
    if (!exam) {
      return { success: false, error: "Examination not found." };
    }

    const reqRes = await enrollmentRepo.requestEnrollment(studentId, exam.id, source);
    if (!reqRes.created) {
      if (reqRes.conflict === "ALREADY_PENDING") {
        return {
          success: false,
          error: "You already have a pending enrollment request for this examination.",
        };
      }
      if (reqRes.conflict === "ALREADY_APPROVED") {
        return {
          success: false,
          error: "Your enrollment for this examination is already approved.",
        };
      }
      if (reqRes.conflict === "ALREADY_REJECTED") {
        return {
          success: false,
          error: "Your previous enrollment request for this examination was rejected. Please contact an administrator.",
        };
      }
      return {
        success: false,
        error: "Your enrollment access for this examination has been revoked by an administrator.",
      };
    }

    return {
      success: true,
      data: reqRes.enrollment,
      message: `Enrollment request submitted for ${exam.code}. An administrator will review your request shortly.`,
    };
  } catch (err) {
    console.error(`Failed to request enrollment for ${studentId} in ${examId}:`, err);
    return {
      success: false,
      error: "Failed to submit enrollment request. Please try again.",
    };
  }
}

/**
 * Admin workflow: Approve, Reject, or Revoke an enrollment.
 */
export async function decideStudentEnrollment(
  studentId: string,
  examId: string,
  decision: "APPROVED" | "REJECTED" | "REVOKED",
  adminId: string,
  notes?: string
): Promise<ActionResult<StudentEnrollment>> {
  try {
    if (!studentId || !examId || !adminId) {
      return { success: false, error: "Student ID, Exam ID, and Admin ID are required." };
    }

    const [student, exam] = await Promise.all([
      findUserById(studentId),
      contentRepo.getExamById(examId),
    ]);

    if (!student || student.role !== "student") {
      return { success: false, error: "Student account not found." };
    }
    if (!exam) {
      return { success: false, error: "Examination not found." };
    }

    const updated = await enrollmentRepo.decideEnrollment(
      studentId,
      exam.id,
      decision,
      adminId,
      notes
    );
    if (!updated) {
      return { success: false, error: "No enrollment record found for this student and examination." };
    }

    return { success: true, data: updated };
  } catch (err) {
    console.error(`Failed to apply enrollment decision (${decision}):`, err);
    return { success: false, error: "Failed to update enrollment decision." };
  }
}

/**
 * Backward-compatible direct grant (strictly for Admin grant or subscription fulfillment).
 */
export async function enrollStudent(
  studentId: string,
  examId: string,
  source: EnrollmentSource = "ADMIN_GRANTED",
  adminId?: string
): Promise<ActionResult<StudentEnrollment>> {
  try {
    if (!studentId || !examId) {
      return { success: false, error: "Student ID and Exam ID are required." };
    }

    const [user, exam] = await Promise.all([
      findUserById(studentId),
      contentRepo.getExamById(examId),
    ]);
    if (!user) return { success: false, error: "Student account not found." };
    if (!exam) return { success: false, error: "Examination not found." };

    const enrollment = await enrollmentRepo.createOrReactivateEnrollment(
      studentId,
      exam.id,
      source,
      adminId
    );
    return { success: true, data: enrollment };
  } catch (err) {
    console.error(`Failed to enroll student ${studentId} in exam ${examId}:`, err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to complete enrollment.",
    };
  }
}

/**
 * Soft-removes or revokes a student's enrollment.
 */
export async function removeEnrollment(
  studentId: string,
  examId: string,
  status: "REVOKED" | "REMOVED" = "REVOKED",
  adminId?: string
): Promise<ActionResult<void>> {
  try {
    if (!studentId || !examId) {
      return { success: false, error: "Student ID and Exam ID are required." };
    }

    const activeEnrollment = await enrollmentRepo.findActiveEnrollment(studentId, examId);
    if (!activeEnrollment) {
      return {
        success: false,
        error: "No approved enrollment found in this examination track.",
      };
    }

    const removed = await enrollmentRepo.removeEnrollment(studentId, examId, status, adminId);
    if (!removed) {
      return { success: false, error: "Could not update enrollment status." };
    }

    return { success: true, data: undefined };
  } catch (err) {
    console.error(`Failed to remove enrollment for ${studentId} in ${examId}:`, err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update enrollment.",
    };
  }
}

/**
 * Retrieves all APPROVED examinations for a student.
 */
export async function getStudentActiveExams(studentId: string): Promise<Exam[]> {
  if (!studentId) return [];
  const enrollments = await enrollmentRepo.getStudentEnrollments(studentId, "APPROVED");
  if (enrollments.length === 0) return [];

  const examIds = enrollments.map((e) => e.examinationId.toLowerCase());
  const allExams = await contentRepo.getAllExams();
  return allExams.filter((exam) => examIds.includes(exam.id.toLowerCase()));
}

/**
 * Retrieves enriched APPROVED exam details for the student dashboard.
 */
export async function getStudentEnrolledExamsDetails(
  studentId: string
): Promise<EnrolledExamDetails[]> {
  if (!studentId) return [];

  const enrollments = await enrollmentRepo.getStudentEnrollments(studentId, "APPROVED");
  if (enrollments.length === 0) return [];

  const allExams = await contentRepo.getAllExams();
  const examMap = new Map<string, Exam>();
  for (const exam of allExams) {
    examMap.set(exam.id, exam);
    examMap.set(exam.id.toLowerCase(), exam);
  }

  const { getStudentAttempts } = await import("@/server/repositories/user-repository");
  const attempts = await getStudentAttempts(studentId);

  const results: EnrolledExamDetails[] = [];
  for (const enr of enrollments) {
    const exam = examMap.get(enr.examinationId) || examMap.get(enr.examinationId.toLowerCase());
    if (!exam) continue;

    const examAttempts = attempts.filter(
      (a) =>
        a.examId === exam.id ||
        a.examId?.toLowerCase() === exam.id.toLowerCase() ||
        a.examTitle?.toLowerCase() === exam.code?.toLowerCase()
    );

    const completedAttempts = examAttempts.filter((a) => a.status === "completed").length;
    const avgScore =
      completedAttempts > 0
        ? Math.round(
            examAttempts.reduce((acc, a) => acc + (a.percentage || 0), 0) / completedAttempts
          )
        : null;

    const tests = await contentRepo.getAllTests({ examId: exam.id, status: "published" });

    results.push({
      exam,
      enrollment: enr,
      totalSubjects: exam.totalSubjects || 0,
      totalTests: tests.length,
      completedAttempts,
      averageScore: avgScore,
    });
  }

  return results;
}

/**
 * Checks if a student has an approved enrollment in an examination.
 */
export async function isStudentEnrolledInExam(
  studentId: string,
  examId: string
): Promise<boolean> {
  const enrollment = await enrollmentRepo.findActiveEnrollment(studentId, examId);
  return enrollment !== null;
}

/**
 * Enriched Admin Enrollment Management feed (requests + student + exam + approver).
 */
export async function getAdminEnrollmentRequests(options?: {
  status?: EnrollmentStatus;
  examId?: string;
  search?: string;
}): Promise<{
  items: AdminEnrollmentView[];
  counts: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    revoked: number;
  };
}> {
  const db = await getMongoDb();

  const [allEnrollments, allExams, studentsResult, adminDocs] = await Promise.all([
    enrollmentRepo.getAllEnrollments({
      examinationId: options?.examId,
    }),
    contentRepo.getAllExams(),
    getStudentsList({ limit: 100 }),
    db.collection<UserDoc>(COLLECTIONS.USERS).find({ role: "admin" }).toArray(),
  ]);

  const examMap = new Map(allExams.map((e) => [e.id.toLowerCase(), e]));
  const studentMap = new Map(studentsResult.students.map((s) => [s.id, s]));
  const adminMap = new Map(
    adminDocs.map((a) => {
      const safe = toSafeUser(a);
      return [a.id, safe];
    })
  );

  // Compute global status counts before status filter
  const counts = {
    total: allEnrollments.length,
    pending: 0,
    approved: 0,
    rejected: 0,
    revoked: 0,
  };
  for (const enr of allEnrollments) {
    if (enr.status === "PENDING") counts.pending++;
    else if (enr.status === "APPROVED" || enr.status === "ACTIVE") counts.approved++;
    else if (enr.status === "REJECTED") counts.rejected++;
    else if (enr.status === "REVOKED" || enr.status === "REMOVED") counts.revoked++;
  }

  // Join details
  let items: AdminEnrollmentView[] = await Promise.all(
    allEnrollments.map(async (enr) => {
      let student = studentMap.get(enr.studentId) || null;
      if (!student) {
        student = await findUserById(enr.studentId);
      }
      const exam = examMap.get(enr.examinationId.toLowerCase()) || null;
      const approver = enr.approvedBy ? adminMap.get(enr.approvedBy) || null : null;

      return {
        enrollment: enr,
        student: student
          ? {
              id: student.id,
              name: student.name,
              email: student.email,
              targetExam: student.profile?.targetExam,
              status: student.status,
            }
          : null,
        exam: exam ? { id: exam.id, code: exam.code, title: exam.title } : null,
        approver: approver
          ? { id: approver.id, name: approver.name, email: approver.email }
          : null,
      };
    })
  );

  // Apply status filter
  if (options?.status) {
    const target = options.status;
    items = items.filter((item) => {
      const s = item.enrollment.status;
      if (target === "APPROVED" || target === "ACTIVE") {
        return s === "APPROVED" || s === "ACTIVE";
      }
      if (target === "REVOKED" || target === "REMOVED") {
        return s === "REVOKED" || s === "REMOVED";
      }
      return s === target;
    });
  }

  // Apply text search filter
  if (options?.search && options.search.trim().length > 0) {
    const q = options.search.trim().toLowerCase();
    items = items.filter(
      (item) =>
        item.student?.name.toLowerCase().includes(q) ||
        item.student?.email.toLowerCase().includes(q) ||
        item.exam?.code.toLowerCase().includes(q) ||
        item.exam?.title.toLowerCase().includes(q)
    );
  }

  return { items, counts };
}
