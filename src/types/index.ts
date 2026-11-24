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
  ClientQuestion,
  ContentDefaultsSettings,
  ContentStatus,
  EnrolledExamDetails,
  EnrollmentSource,
  EnrollmentStatus,
  Exam,
  ExamSubject,
  ExaminationSettings,
  GeneralSettings,
  Lesson,
  LessonStatus,
  PlatformConfigSettings,
  PlatformSettings,
  Question,
  QuestionDifficulty,
  QuestionOption,
  QuestionReport,
  QuestionReportReason,
  QuestionReportStatus,
  QuestionResultItem,
  QuestionStatus,
  QuizEvaluationResult,
  Section,
  StudentEnrollment,
  Subject,
  SystemSecurityStatus,
  Test,
  TestDifficulty,
  TestPerformanceInsights,
  TestStatus,
  Topic,
  UserAnswers,
} from "./content";

export type {
  SafeUser,
  StudentDashboardStats,
  StudentProfile,
  SubjectProgress,
  TestAttempt,
  User,
  UserRole,
  UserSession,
  UserStatus,
  WeakAreaItem,
  DeviceType,
  SessionStatus,
  UserDeviceSession,
} from "./auth";

