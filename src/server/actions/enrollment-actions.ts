"use server";

/**
 * Examination Enrollment & Admin Approval Server Actions — PakSeekers.
 *
 * Security:
 * - Students can ONLY submit PENDING enrollment requests (never self-approve).
 * - Only verified ADMIN accounts can Approve, Reject, or Revoke enrollments.
 * - Staff and Students are strictly rejected from approval/revocation actions.
 */

import { revalidatePath } from "next/cache";
import type { ActionResult, StudentEnrollment } from "@/types";
import { getCurrentUser, verifyAdminAuth } from "@/server/auth/session";
import {
  requestExamEnrollment,
  decideStudentEnrollment,
  enrollStudent,
  removeEnrollment,
  canAccessExamination,
} from "@/server/services/enrollment-service";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Graceful outside Next.js request context
  }
}

function revalidateEnrollmentPaths(examId: string, studentId?: string) {
  safeRevalidate("/student/dashboard");
  safeRevalidate("/student/tests");
  safeRevalidate("/exams");
  safeRevalidate(`/exams/${examId}`);
  safeRevalidate("/tests");
  safeRevalidate("/admin/enrollments");
  safeRevalidate("/admin/students");
  if (studentId) {
    safeRevalidate(`/admin/students/${studentId}`);
  }
}

/**
 * Student action: Submits a PENDING enrollment request for an examination.
 */
export async function requestExamEnrollmentAction(
  examId: string
): Promise<ActionResult<StudentEnrollment>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: "You must be signed in to apply for examination enrollment.",
      };
    }

    if ((user.status || "").toLowerCase() === "suspended") {
      return {
        success: false,
        error: "Your account has been suspended by an administrator.",
      };
    }

    if (user.role !== "student") {
      return {
        success: false,
        error: "Only student accounts can submit enrollment requests.",
      };
    }

    if (!examId || examId.trim() === "") {
      return { success: false, error: "Valid examination ID is required." };
    }

    const result = await requestExamEnrollment(user.id, examId.trim(), "STUDENT_REQUEST");
    if (!result.success) {
      return result;
    }

    revalidateEnrollmentPaths(examId.trim(), user.id);
    return result;
  } catch (err) {
    console.error("requestExamEnrollmentAction error:", err);
    return {
      success: false,
      error: "An unexpected error occurred while submitting your request.",
    };
  }
}

/**
 * Backward-compatible alias routed strictly through requestExamEnrollmentAction
 * so students cannot bypass Admin approval.
 */
export async function enrollInExamAction(
  examId: string
): Promise<ActionResult<StudentEnrollment>> {
  return requestExamEnrollmentAction(examId);
}

/**
 * Student soft-removal of an existing approved track.
 */
export async function removeExamEnrollmentAction(
  examId: string
): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: "You must be signed in to manage your examination preparations.",
      };
    }

    if ((user.status || "").toLowerCase() === "suspended") {
      return {
        success: false,
        error: "Your account has been suspended by an administrator.",
      };
    }

    if (!examId || examId.trim() === "") {
      return { success: false, error: "Valid examination ID is required." };
    }

    const result = await removeEnrollment(user.id, examId.trim(), "REMOVED");
    if (!result.success) {
      return result;
    }

    revalidateEnrollmentPaths(examId.trim(), user.id);
    return result;
  } catch (err) {
    console.error("removeExamEnrollmentAction error:", err);
    return {
      success: false,
      error: "An unexpected error occurred while removing the examination.",
    };
  }
}

/**
 * Checks whether the current user holds approved access to an exam.
 */
export async function checkExamAccessAction(
  examId: string
): Promise<{ hasAccess: boolean; isAuthenticated: boolean }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { hasAccess: false, isAuthenticated: false };
    }

    const hasAccess = await canAccessExamination(user.id, examId);
    return { hasAccess, isAuthenticated: true };
  } catch {
    return { hasAccess: false, isAuthenticated: false };
  }
}

// ---------------------------------------------------------------------------
// Admin-Only Enrollment Confirmation & Lifecycle Actions
// ---------------------------------------------------------------------------

export async function approveEnrollmentAction(
  studentId: string,
  examId: string,
  notes?: string
): Promise<ActionResult<StudentEnrollment>> {
  const auth = await verifyAdminAuth();
  if ("error" in auth) return auth.error;

  const res = await decideStudentEnrollment(
    studentId,
    examId,
    "APPROVED",
    auth.user.id,
    notes
  );
  if (res.success) {
    revalidateEnrollmentPaths(examId, studentId);
  }
  return res;
}

export async function rejectEnrollmentAction(
  studentId: string,
  examId: string,
  notes?: string
): Promise<ActionResult<StudentEnrollment>> {
  const auth = await verifyAdminAuth();
  if ("error" in auth) return auth.error;

  const res = await decideStudentEnrollment(
    studentId,
    examId,
    "REJECTED",
    auth.user.id,
    notes
  );
  if (res.success) {
    revalidateEnrollmentPaths(examId, studentId);
  }
  return res;
}

export async function revokeEnrollmentAction(
  studentId: string,
  examId: string,
  notes?: string
): Promise<ActionResult<StudentEnrollment>> {
  const auth = await verifyAdminAuth();
  if ("error" in auth) return auth.error;

  const res = await decideStudentEnrollment(
    studentId,
    examId,
    "REVOKED",
    auth.user.id,
    notes
  );
  if (res.success) {
    revalidateEnrollmentPaths(examId, studentId);
  }
  return res;
}

/**
 * Administrative action: Grant or revoke enrollment status for any student.
 */
export async function adminUpdateStudentEnrollmentAction(
  studentId: string,
  examId: string,
  status: "ACTIVE" | "APPROVED" | "REMOVED" | "REVOKED",
  notes?: string
): Promise<ActionResult<void>> {
  const auth = await verifyAdminAuth();
  if ("error" in auth) return auth.error;

  try {
    if (status === "ACTIVE" || status === "APPROVED") {
      const res = await enrollStudent(studentId, examId, "ADMIN_GRANTED", auth.user.id);
      if (!res.success) {
        return { success: false, error: res.error };
      }
    } else {
      const res = await decideStudentEnrollment(
        studentId,
        examId,
        "REVOKED",
        auth.user.id,
        notes
      );
      if (!res.success) {
        return { success: false, error: res.error };
      }
    }

    revalidateEnrollmentPaths(examId, studentId);
    return { success: true, data: undefined };
  } catch (err) {
    console.error("adminUpdateStudentEnrollmentAction error:", err);
    return {
      success: false,
      error: "Failed to update student enrollment.",
    };
  }
}
