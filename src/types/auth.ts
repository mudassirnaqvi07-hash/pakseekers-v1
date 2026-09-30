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
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  profile: StudentProfile;
  createdAt: string;
  updatedAt: string;
}

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

export interface StudentDashboardStats {
  testsAttempted: number;
  questionsSolved: number;
  averageScore: number | null; // null if 0 attempts
  subjectProgress: SubjectProgress[];
}
