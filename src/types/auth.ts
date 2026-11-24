/**
 * Authentication, User, Profile, and Test Attempt Domain Models — PakSeekers Phase 4.
 */

import type { QuestionResultItem, UserAnswers } from "./content";

export type UserRole = "student" | "staff" | "admin";

export type Permission =
  // Exam Management
  | "EXAM_VIEW"
  | "EXAM_CREATE"
  | "EXAM_EDIT"
  | "EXAM_DELETE"
  // Subject Management
  | "SUBJECT_VIEW"
  | "SUBJECT_CREATE"
  | "SUBJECT_EDIT"
  | "SUBJECT_DELETE"
  // Topic Management
  | "TOPIC_VIEW"
  | "TOPIC_CREATE"
  | "TOPIC_EDIT"
  | "TOPIC_DELETE"
  // Question Management
  | "QUESTION_VIEW"
  | "QUESTION_CREATE"
  | "QUESTION_EDIT"
  | "QUESTION_DELETE"
  | "QUESTION_IMPORT"
  // Test Management
  | "TEST_VIEW"
  | "TEST_CREATE"
  | "TEST_EDIT"
  | "TEST_DELETE"
  | "TEST_PUBLISH"
  // Analytics
  | "ANALYTICS_VIEW"
  | "TEST_PERFORMANCE_VIEW"
  // Student Management
  | "STUDENT_VIEW"
  | "STUDENT_SUSPEND"
  | "STUDENT_REACTIVATE"
  | "STUDENT_DELETE"
  // Administration
  | "STAFF_MANAGE"
  | "ROLE_MANAGE"
  | "PLATFORM_SETTINGS_MANAGE"
  | "SECURITY_SETTINGS_MANAGE";

export interface StudentProfile {
  educationLevel: string; // e.g. "FSc Pre-Medical", "FSc Pre-Engineering", "A-Levels", "ICS", "Other"
  institution: string; // e.g. "Punjab Group of Colleges", "KIPS", "APS", etc.
  targetExam: string; // e.g. "MDCAT", "FAST-NU", "NET", "NTS", "ECAT"
  phone?: string;
  city?: string;
}

export type UserStatus = "active" | "suspended";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status?: UserStatus;
  permissions?: Permission[];
  staffTitle?: string;
  department?: string;
  createdBy?: string;
  passwordHash: string;
  isEmailVerified?: boolean;
  emailVerificationTokenHash?: string | null;
  emailVerificationExpiresAt?: string | null;
  otpCodeHash?: string | null;
  otpExpiresAt?: string | null;
  otpLastSentAt?: string | null;
  otpAttempts?: number;
  profile: StudentProfile;
  phone?: string;
  targetExam?: string;
  educationLevel?: string;
  city?: string;
  maxDevices?: number;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Sanitized user object without sensitive credentials (passwordHash, verification token hashes, OTP hash), safe for presentation.
 */
export type SafeUser = Omit<User, "passwordHash" | "emailVerificationTokenHash" | "otpCodeHash">;

export type DeviceType = "desktop" | "mobile" | "tablet";
export type SessionStatus = "active" | "revoked" | "expired";

export interface UserSession {
  id?: string;
  token: string;
  userId: string;
  role: UserRole;
  deviceId?: string;
  deviceName?: string;
  deviceType?: DeviceType;
  browser?: string;
  operatingSystem?: string;
  createdAt: string;
  lastActiveAt?: string;
  expiresAt: string;
  revokedAt?: string | null;
  status?: SessionStatus;
  isCurrent?: boolean;
}

export interface UserDeviceSession {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceType: DeviceType;
  browser: string;
  operatingSystem: string;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export interface TestAttempt {
  id: string;
  studentId: string;
  testId: string;
  testTitle: string;
  examId: string;
  examTitle: string;
  subjectId: string;
  subjectTitle: string;
  topicId?: string;
  topicTitle?: string;
  selectedAnswers: UserAnswers; // questionId -> optionId
  score: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  percentage: number;
  questionResults: QuestionResultItem[];
  startedAt: string;
  completedAt: string;
  status: "completed" | "in-progress";
}

export interface SubjectProgress {
  subjectId: string;
  subjectTitle: string;
  examTitle: string;
  averageScore: number;
  attemptsCount: number;
  questionsSolved: number;
}

export interface WeakAreaItem {
  topicId?: string;
  topicTitle: string;
  subjectTitle: string;
  examId?: string;
  accuracy: number;
  totalQuestions: number;
  incorrectCount: number;
}

export interface StudentDashboardStats {
  testsAttempted: number;
  completedTests: number;
  questionsSolved: number;
  averageScore: number | null; // null if 0 attempts
  bestScore: number | null;
  recentScore: number | null;
  subjectProgress: SubjectProgress[];
  weakAreas: WeakAreaItem[];
}
