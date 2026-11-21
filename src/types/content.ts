/**
 * Core Academic Content Models & Types — PakSeekers Phase 2.
 *
 * Establishes the conceptual hierarchy:
 *   Exam -> Subject -> Topic -> Question (Question Bank)
 *
 * Tests reference reusable questions from the question bank.
 * The question structure is source-agnostic (manual entry, copy/paste importer, CSV, AI).
 */

// ---------------------------------------------------------------------------
// Enumerations & Value Types
// ---------------------------------------------------------------------------

export type QuestionDifficulty = "easy" | "medium" | "hard";

export type QuestionStatus = "draft" | "review" | "published" | "archived";

export type ContentStatus = "draft" | "active" | "archived";

export type TestDifficulty = QuestionDifficulty | "mixed";

export type TestStatus = "draft" | "published" | "archived";

export type EnrollmentStatus = "ACTIVE" | "REMOVED";

export type EnrollmentSource = "FREE_SELECTION" | "SUBSCRIPTION" | "ADMIN_GRANTED";

export interface StudentEnrollment {
  id: string;
  studentId: string;
  examinationId: string;
  status: EnrollmentStatus;
  enrollmentSource: EnrollmentSource;
  enrolledAt: string;
  removedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExamSubject {
  id: string;
  examId: string;
  subjectId: string;
  displayOrder: number;
  weightage?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// Option Model
// ---------------------------------------------------------------------------

/**
 * A single option for a multiple choice question.
 * Not hardcoded to 4 options; can accommodate variable counts.
 */
export interface QuestionOption {
  /** Unique identifier for the option within the question (e.g., 'opt-a', 'opt-1') */
  id: string;
  /** Presentation label (e.g., 'A', 'B', 'C', 'D') */
  label: string;
  /** The text content of the option */
  text: string;
}

// ---------------------------------------------------------------------------
// Question Model
// ---------------------------------------------------------------------------

/**
 * Standardized question entity.
 * Source-agnostic: a question imported via copy/paste produces this identical structure.
 */
export interface Question {
  id: string;
  questionText: string;
  text?: string;
  code?: string;
  options: QuestionOption[];
  /** Identifier of the correct option matching QuestionOption.id */
  correctAnswer: string;
  correctOptionId?: string;
  /** Detailed step-by-step pedagogical explanation */
  explanation: string;
  /** Foreign key relationships */
  examId: string;
  subjectId: string;
  topicId: string;
  difficulty: QuestionDifficulty;
  status: QuestionStatus;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Sanitized question model sent to the student client prior to submission.
 * Completely strips correctAnswer and explanation to eliminate answer-key leakage.
 */
export type ClientQuestion = Omit<Question, "correctAnswer" | "explanation">;

// ---------------------------------------------------------------------------
// Content Hierarchy Models
// ---------------------------------------------------------------------------

/**
 * Top-level exam entity (e.g., MDCAT, ECAT, NUST NET).
 */
export interface Exam {
  id: string;
  title: string;
  code: string;
  description: string;
  totalSubjects: number;
  status: ContentStatus;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Academic subject under an exam (e.g., Biology, Chemistry, Physics).
 */
export interface Subject {
  id: string;
  examId: string;
  title: string;
  description: string;
  icon?: string;
  totalTopics: number;
  status?: ContentStatus;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Granular topic under a subject (e.g., Cell Biology, Genetics, Mechanics).
 */
export interface Topic {
  id: string;
  subjectId: string;
  examId: string;
  title: string;
  description: string;
  questionCount: number;
  status?: ContentStatus;
  createdAt?: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// Test Model
// ---------------------------------------------------------------------------

/**
 * Test entity referencing reusable questions in the question bank.
 * Avoids duplicating question objects inside tests.
 */
export interface Test {
  id: string;
  title: string;
  description: string;
  examId: string;
  subjectId: string;
  topicId?: string;
  /** References to reusable Question IDs */
  questionIds: string[];
  durationMinutes: number;
  questionCount: number;
  difficulty: TestDifficulty;
  status: TestStatus;
  /** Test category: standard practice test or full-length mock simulation */
  testType?: "practice" | "mock";
  /** Optional scoring rules for full-length simulation */
  totalMarks?: number;
  passingMarks?: number;
  negativeMarking?: number; // e.g. 0.25 marks deducted per wrong answer, 0 if none
  instructions?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Section Model
// ---------------------------------------------------------------------------

/**
 * Curriculum section dividing subjects or tests into logical units.
 * e.g., MDCAT Biology -> Cellular Biology, Genetics, Human Physiology
 */
export interface Section {
  id: string;
  title: string;
  description: string;
  examId: string;
  subjectId: string;
  order: number;
  durationMinutes?: number;
  totalMarks?: number;
  status: ContentStatus;
  createdAt?: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// Lesson Model
// ---------------------------------------------------------------------------

export type LessonStatus = "draft" | "published" | "archived";

/**
 * Educational lesson delivering core theory, formulas, and study notes.
 */
export interface Lesson {
  id: string;
  title: string;
  slug: string;
  description: string;
  summary?: string;
  content: string; // Markdown / LaTeX supported structured text
  examId: string;
  subjectId: string;
  topicId: string;
  sectionId?: string;
  learningObjectives?: string[];
  order: number;
  readTimeMinutes: number;
  estimatedReadMinutes?: number;
  status: LessonStatus;
  createdAt?: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// Question Report Model
// ---------------------------------------------------------------------------

export type QuestionReportReason =
  | "wrong_answer"
  | "typo"
  | "unclear_explanation"
  | "explanation_error"
  | "out_of_syllabus"
  | "other";

export type QuestionReportStatus =
  | "pending"
  | "under_review"
  | "resolved"
  | "rejected";

export interface QuestionReport {
  id: string;
  questionId: string;
  questionText: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  userEmail?: string;
  reason: QuestionReportReason;
  description: string;
  status: QuestionReportStatus;
  adminNotes?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Platform Settings Model
// ---------------------------------------------------------------------------

export interface GeneralSettings {
  platformName: string;
  tagline: string;
  contactEmail: string;
  supportPhone: string;
  address: string;
}

export interface PlatformConfigSettings {
  allowRegistration: boolean;
  maintenanceMode: boolean;
  announcementBanner?: string;
}

export interface ExaminationSettings {
  defaultTestDuration: number; // in minutes
  passingScorePercentage: number;
  allowTestRetakes: boolean;
  showExplanationsImmediately: boolean;
}

export interface ContentDefaultsSettings {
  defaultQuestionStatus: QuestionStatus;
  enableQuestionReporting: boolean;
  maxQuestionsPerCustomTest: number;
}

export interface PlatformSettings {
  id: "default";
  general: GeneralSettings;
  platform: PlatformConfigSettings;
  examination: ExaminationSettings;
  content: ContentDefaultsSettings;
  updatedAt: string;
  updatedBy?: string;
}

export interface SystemSecurityStatus {
  nodeEnv: string;
  isProduction: boolean;
  databaseConnected: boolean;
  clusterTarget: string;
  sessionSecurity: {
    cookieSecure: boolean;
    sameSite: string;
    httpOnly: boolean;
    tokenEncryption: string;
    tokenHashing?: string;
    cookieSameSite?: string;
    secretConfigured?: boolean;
  };
  passwordSecurity: {
    algorithm: string;
    keyLength: number;
    saltLength: number;
  };
  tlsActive: boolean;
  appSecretConfigured: boolean;
  database: {
    connected: boolean;
    clusterType: string;
    hostSummary: string;
    replicaSet: string;
  };
  runtime: {
    nodeVersion: string;
    nodeEnv: string;
    platform: string;
  };
}

// ---------------------------------------------------------------------------
// Student Practice & Quiz Engine Types
// ---------------------------------------------------------------------------

export type UserAnswers = Record<string, string>; // questionId -> optionId

export interface QuestionResultItem {
  question: Question;
  selectedOptionId: string | null;
  correctOptionId: string;
  isCorrect: boolean;
  isAnswered: boolean;
}

export interface QuizEvaluationResult {
  score: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  percentage: number;
  questionResults: QuestionResultItem[];
}
