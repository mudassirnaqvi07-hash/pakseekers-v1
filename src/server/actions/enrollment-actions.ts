"use server";

/**
 * Examination Enrollment Server Actions — PakSeekers.
 *
 * Provides authenticated student and admin server actions to manage multi-exam
 * enrollments.
 *
 * Security:
 * - Always re-verifies session identity server-side (never trusts client identity).
 * - Enforces role-based permissions.
 * - Idempotent execution.
 */

import { revalidatePath } from "next/cache";
import type { ActionResult, StudentEnrollment } from "@/types";
import { getCurrentUser } from "@/server/auth/session";
import {
  enrollStudent,
  removeEnrollment,
  canAccessExamination,
} from "@/server/services/enrollment-service";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Graceful handling outside active Next.js render cycle (e.g. tests or script invocations)
  }
}

/**
 * Enrolls the currently authenticated student into an examination track.
 */
export async function enrollInExamAction(
  examId: string
): Promise<ActionResult<StudentEnrollment>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: "You must be signed in to enroll in an examination track.",
      };
    }

    if (user.role !== "student" && user.role !== "admin") {
      return {
        success: false,
        error: "Only student accounts can enroll in examination tracks.",
      };
    }

    if (!examId || examId.trim() === "") {
      return {
        success: false,
        error: "Valid examination ID is required.",
      };
    }

    const result = await enrollStudent(user.id, examId.trim(), "FREE_SELECTION");
    if (!result.success) {
      return result;
    }

    // Refresh student dashboard and exam pages
    safeRevalidate("/student/dashboard");
    safeRevalidate("/student/tests");
    safeRevalidate("/exams");
    safeRevalidate(`/exams/${examId}`);
    safeRevalidate(`/student/exams/${examId}`);

    return result;
  } catch (err) {
    console.error("enrollInExamAction error:", err);
    return {
      success: false,
      error: "An unexpected error occurred during enrollment. Please try again.",
    };
  }
}

/**
 * Removes an examination from the current student's preparations.
 * Soft-removal: retains all historical attempts and analytics.
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

    if (!examId || examId.trim() === "") {
      return {
        success: false,
        error: "Valid examination ID is required.",
      };
    }

    const result = await removeEnrollment(user.id, examId.trim());
    if (!result.success) {
      return result;
    }

    // Refresh affected pages
    safeRevalidate("/student/dashboard");
    safeRevalidate("/student/tests");
    safeRevalidate("/exams");
    safeRevalidate(`/exams/${examId}`);
    safeRevalidate(`/student/exams/${examId}`);

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
 * Checks if the currently authenticated student has active access to an examination.
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

/**
 * Administrative action: Manage enrollment status for any student.
 */
export async function adminUpdateStudentEnrollmentAction(
  studentId: string,
  examId: string,
  status: "ACTIVE" | "REMOVED"
): Promise<ActionResult<void>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      return {
        success: false,
        error: "Administrative privileges are required to manage student enrollments.",
      };
    }

    if (status === "ACTIVE") {
      const res = await enrollStudent(studentId, examId, "ADMIN_GRANTED");
      if (!res.success) {
        return { success: false, error: res.error };
      }
    } else {
      const res = await removeEnrollment(studentId, examId);
      if (!res.success) {
        return { success: false, error: res.error };
      }
    }

    safeRevalidate(`/admin/students/${studentId}`);
    safeRevalidate("/admin/students");
    safeRevalidate("/student/dashboard");

    return { success: true, data: undefined };
  } catch (err) {
    console.error("adminUpdateStudentEnrollmentAction error:", err);
    return {
      success: false,
      error: "Failed to update student enrollment.",
    };
  }
}
