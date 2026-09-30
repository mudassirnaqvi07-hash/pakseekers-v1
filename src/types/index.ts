/**
 * Types barrel export.
 *
 * Import shared types from "@/types" rather than deep paths:
 *   import type { ActionResult, Exam, Subject, Topic, Question, Test } from "@/types";
 */

export type {
  ActionResult,
  DeepPartial,
  Nullable,
  Optional,
  PaginatedResult,
  PaginationParams,
  SortOrder,
  SortParams,
} from "./common";

export type {
  ContentStatus,
  Exam,
  Question,
  QuestionDifficulty,
  QuestionOption,
  QuestionResultItem,
  QuestionStatus,
  QuizEvaluationResult,
  Subject,
  Test,
  TestDifficulty,
  TestStatus,
  Topic,
  UserAnswers,
} from "./content";

export type {
  StudentDashboardStats,
  StudentProfile,
  SubjectProgress,
  TestAttempt,
  User,
  UserRole,
  UserSession,
} from "./auth";

