import "server-only";

/**
 * Student Enrollment Service — PakSeekers.
 *
 * Provides the application-layer API for multi-exam enrollment, access
 * verification, and preparation workspace management.
 *
 * Implements:
 * - Authoritative server-side access enforcement (canAccessExamination)
 * - Multi-exam enrollment lifecycle (enroll, soft-remove, re-enroll)
 * - Scope resolution for dashboard and test-taking
 * - Historical data preservation
 */

import type {
  ActionResult,
  Exam,
  StudentEnrollment,
  EnrollmentSource,
  EnrolledExamDetails,
  Test,
} from "@/types";
import * as enrollmentRepo from "@/server/repositories/enrollment-repository";
import * as contentRepo from "@/server/repositories/content-repository";
import { findUserById } from "@/server/repositories/user-repository";

/**
 * Authoritative access check for an examination track.
 *
 * Rules:
 * 1. Admin users always have full access (bypass).
 * 2. Students must possess an ACTIVE enrollment record for the examination.
 * 3. Anonymous users or removed enrollments are denied access.
 *
 * @param studentId The unique identifier of the student
 * @param examId The unique identifier of the examination
 */
export async function canAccessExamination(
  studentId: string,
  examId: string
): Promise<boolean> {
  if (!studentId || !examId) return false;

  // 1. Check user role — Admins bypass enrollment restrictions
  const user = await findUserById(studentId);
  if (user && user.role === "admin") {
    return true;
  }

  // 2. Query active enrollment
  const activeEnrollment = await enrollmentRepo.findActiveEnrollment(
    studentId,
    examId
  );

  return activeEnrollment !== null;
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
      error: "You are not enrolled in the examination for this test.",
    };
  }

  return { canAccess: true, examId: test.examId, test };
}

/**
 * Enrolls a student into an examination track.
 * Idempotent: if already enrolled, returns active enrollment without duplicating.
 * If previously REMOVED, reactivates to ACTIVE.
 */
export async function enrollStudent(
  studentId: string,
  examId: string,
  source: EnrollmentSource = "FREE_SELECTION"
): Promise<ActionResult<StudentEnrollment>> {
  try {
    if (!studentId || !examId) {
      return { success: false, error: "Student ID and Exam ID are required." };
    }

    // 1. Verify user exists
    const user = await findUserById(studentId);
    if (!user) {
      return { success: false, error: "Student account not found." };
    }

    // 2. Verify exam exists and is active
    const exam = await contentRepo.getExamById(examId);
    if (!exam) {
      return { success: false, error: "Examination not found." };
    }
    if (exam.status !== "active") {
      return { success: false, error: "This examination is not currently open for enrollment." };
    }

    // 3. Create or reactivate enrollment
    const enrollment = await enrollmentRepo.createOrReactivateEnrollment(
      studentId,
      exam.id,
      source
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
 * Soft-removes a student's enrollment from an examination track.
 * Strictly preserves all historical test attempts, scores, and analytics.
 */
export async function removeEnrollment(
  studentId: string,
  examId: string
): Promise<ActionResult<void>> {
  try {
    if (!studentId || !examId) {
      return { success: false, error: "Student ID and Exam ID are required." };
    }

    // Check if actively enrolled
    const activeEnrollment = await enrollmentRepo.findActiveEnrollment(
      studentId,
      examId
    );
    if (!activeEnrollment) {
      return {
        success: false,
        error: "You do not have an active enrollment in this examination track.",
      };
    }

    const removed = await enrollmentRepo.removeEnrollment(studentId, examId);
    if (!removed) {
      return { success: false, error: "Could not remove enrollment. Please try again." };
    }

    return { success: true, data: undefined };
  } catch (err) {
    console.error(`Failed to remove enrollment for student ${studentId} in exam ${examId}:`, err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to remove enrollment.",
    };
  }
}

/**
 * Retrieves all active examinations that a student is currently enrolled in.
 */
export async function getStudentActiveExams(studentId: string): Promise<Exam[]> {
  if (!studentId) return [];
  const enrollments = await enrollmentRepo.getStudentEnrollments(studentId, "ACTIVE");
  if (enrollments.length === 0) return [];

  const examIds = enrollments.map((e) => e.examinationId);
  const allExams = await contentRepo.getAllExams();
  
  return allExams.filter((exam) =>
    examIds.some(
      (id) => id === exam.id || id.toLowerCase() === exam.id.toLowerCase()
    )
  );
}

/**
 * Retrieves enriched active exam details for the student dashboard:
 * includes subject counts, test counts, and student's attempt statistics per exam.
 */
export async function getStudentEnrolledExamsDetails(
  studentId: string
): Promise<EnrolledExamDetails[]> {
  if (!studentId) return [];

  const enrollments = await enrollmentRepo.getStudentEnrollments(studentId, "ACTIVE");
  if (enrollments.length === 0) return [];

  const allExams = await contentRepo.getAllExams();
  const examMap = new Map<string, Exam>();
  for (const exam of allExams) {
    examMap.set(exam.id, exam);
    examMap.set(exam.id.toLowerCase(), exam);
  }

  // Fetch student attempts to compute per-exam metrics
  const { getStudentAttempts } = await import("@/server/repositories/user-repository");
  const attempts = await getStudentAttempts(studentId);

  const results: EnrolledExamDetails[] = [];

  for (const enr of enrollments) {
    const exam = examMap.get(enr.examinationId) || examMap.get(enr.examinationId.toLowerCase());
    if (!exam) continue;

    // Filter attempts for this exam
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
            examAttempts.reduce((acc, a) => acc + (a.percentage || 0), 0) /
              completedAttempts
          )
        : null;

    // Count published tests for this exam
    const tests = await contentRepo.getAllTests({
      examId: exam.id,
      status: "published",
    });

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
 * Checks if a student is actively enrolled in an examination.
 */
export async function isStudentEnrolledInExam(
  studentId: string,
  examId: string
): Promise<boolean> {
  const enrollment = await enrollmentRepo.findActiveEnrollment(studentId, examId);
  return enrollment !== null;
}
