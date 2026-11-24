/**
 * User Service — PakSeekers.
 *
 * Server-layer API for student data: stats, attempts, and profile reads.
 * Pages call this; they never import user-repository directly.
 *
 * Dependency direction:
 *   app/pages  →  server/services/user-service  →  server/repositories/user-repository
 */

import type {
  TestAttempt,
  StudentDashboardStats,
  SafeUser,
  UserDeviceSession,
  TestPerformanceInsights,
  Permission,
} from "@/types";
import { hashSessionToken } from "@/server/auth/tokens";
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

export async function getTestPerformanceInsights(testId: string): Promise<TestPerformanceInsights> {
  return userRepo.getTestPeerStatistics(testId);
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

export async function permanentlyDeleteStudent(
  studentId: string
): Promise<{ success: boolean; error?: string }> {
  return userRepo.permanentlyDeleteUser(studentId);
}

// ---------------------------------------------------------------------------
// Student Device & Session Management
// ---------------------------------------------------------------------------

export async function getStudentActiveSessions(
  studentId: string,
  currentRawToken?: string
): Promise<UserDeviceSession[]> {
  const sessions = await userRepo.getActiveSessionsForUser(studentId);
  const currentTokenHash = currentRawToken ? hashSessionToken(currentRawToken) : null;

  return sessions.map((s) => ({
    id: s.id || "",
    deviceId: s.deviceId || "unknown_device",
    deviceName: s.deviceName || "Desktop • Browser",
    deviceType: s.deviceType || "desktop",
    browser: s.browser || "Browser",
    operatingSystem: s.operatingSystem || "OS",
    createdAt: s.createdAt,
    lastActiveAt: s.lastActiveAt || s.createdAt,
    expiresAt: s.expiresAt,
    isCurrent: Boolean(
      (currentRawToken && s.token === currentRawToken) ||
        (currentTokenHash && s.token === currentTokenHash)
    ),
  }));
}

export async function countStudentActiveDevices(studentId: string): Promise<number> {
  const sessions = await userRepo.getActiveSessionsForUser(studentId);
  const distinct = new Set(sessions.map((s) => s.deviceId).filter(Boolean));
  return distinct.size;
}

export async function revokeSession(
  sessionId: string,
  studentId?: string
): Promise<boolean> {
  return userRepo.revokeSessionById(sessionId, studentId);
}

export async function revokeAllOtherSessions(
  studentId: string,
  currentRawToken: string
): Promise<number> {
  return userRepo.revokeAllOtherSessions(studentId, currentRawToken);
}

export async function revokeAllStudentSessions(studentId: string): Promise<void> {
  return userRepo.deleteUserSessions(studentId);
}

export async function updateStudentDeviceLimit(
  studentId: string,
  maxDevices: number
): Promise<boolean> {
  return userRepo.updateStudentDeviceLimit(studentId, maxDevices);
}

// ---------------------------------------------------------------------------
// Admin Staff Management Accessors
// ---------------------------------------------------------------------------

export async function getStaffList(options: {
  search?: string;
  status?: string;
} = {}): Promise<SafeUser[]> {
  return userRepo.getStaffList(options);
}

export async function getStaffById(staffId: string): Promise<SafeUser | null> {
  return userRepo.getStaffById(staffId);
}

export async function createStaffAccount(input: {
  name: string;
  email: string;
  password: string;
  staffTitle?: string;
  department?: string;
  permissions?: Permission[];
  createdBy?: string;
}): Promise<SafeUser> {
  return userRepo.createUser({
    ...input,
    role: "staff",
    status: "active",
    isEmailVerified: true,
  });
}

export async function updateStaffDetails(
  staffId: string,
  input: {
    name?: string;
    email?: string;
    staffTitle?: string;
    department?: string;
    password?: string;
  }
): Promise<SafeUser | null> {
  return userRepo.updateStaffDetails(staffId, input);
}

export async function updateStaffPermissions(
  staffId: string,
  permissions: Permission[]
): Promise<SafeUser | null> {
  return userRepo.updateStaffPermissions(staffId, permissions);
}

export async function updateStaffStatus(
  staffId: string,
  status: "active" | "suspended"
): Promise<SafeUser | null> {
  return userRepo.updateStaffStatus(staffId, status);
}

export async function deleteStaffAccount(
  staffId: string
): Promise<{ success: boolean; error?: string }> {
  const target = await userRepo.getStaffById(staffId);
  if (!target || target.role !== "staff") {
    return { success: false, error: "Staff account not found." };
  }
  return userRepo.permanentlyDeleteUser(staffId);
}
