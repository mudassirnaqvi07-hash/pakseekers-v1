/**
 * User Service — PakSeekers.
 *
 * Server-layer API for student data: stats, attempts, and profile reads.
 * Pages call this; they never import user-repository directly.
 *
 * Dependency direction:
 *   app/pages  →  server/services/user-service  →  server/repositories/user-repository
 */

import type { TestAttempt, StudentDashboardStats, SafeUser } from "@/types";
import type {
  StudentListFilterOptions,
  PaginatedStudentsResult,
} from "@/server/repositories/user-repository";
import * as userRepo from "@/server/repositories/user-repository";

export type { StudentListFilterOptions, PaginatedStudentsResult };

export async function getStudentDashboardStats(studentId: string): Promise<StudentDashboardStats> {
  return userRepo.getStudentDashboardStats(studentId);
}

export async function getStudentAttempts(studentId: string): Promise<TestAttempt[]> {
  return userRepo.getStudentAttempts(studentId);
}

export async function getAttemptById(attemptId: string): Promise<TestAttempt | null> {
  return userRepo.getAttemptById(attemptId);
}

// ---------------------------------------------------------------------------
// Admin Student Management Accessors
// ---------------------------------------------------------------------------

export async function getAdminStudentsList(
  options: StudentListFilterOptions = {}
): Promise<PaginatedStudentsResult> {
  return userRepo.getStudentsList(options);
}

export const getStudentsList = getAdminStudentsList;

export async function getAdminStudentDetails(studentId: string): Promise<{
  student: SafeUser;
  attempts: TestAttempt[];
  stats: StudentDashboardStats;
} | null> {
  return userRepo.getStudentWithDetails(studentId);
}

export const getStudentWithDetails = getAdminStudentDetails;

export async function updateStudentAccountStatus(
  studentId: string,
  status: "active" | "suspended"
): Promise<SafeUser | null> {
  return userRepo.updateStudentStatus(studentId, status);
}

export async function updateStudentProfileByAdmin(
  studentId: string,
  input: {
    name?: string;
    educationLevel?: string;
    institution?: string;
    targetExam?: string;
    phone?: string;
    status?: "active" | "suspended";
  }
): Promise<SafeUser | null> {
  return userRepo.updateStudentProfileByAdmin(studentId, input);
}
