/**
 * Authentication, User, Profile, and Test Attempt Domain Models — PakSeekers Phase 4.
 */

import type { QuestionResultItem, UserAnswers } from "./content";

export type UserRole = "student" | "admin";

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
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Sanitized user object without sensitive credentials (passwordHash, verification token hashes, OTP hash), safe for presentation.
 */
export type SafeUser = Omit<User, "passwordHash" | "emailVerificationTokenHash" | "otpCodeHash">;

export interface UserSession {
  token: string;
  userId: string;
  role: UserRole;
  createdAt: string;
  expiresAt: string;
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
