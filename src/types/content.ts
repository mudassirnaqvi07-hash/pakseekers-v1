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
  options: QuestionOption[];
  /** Identifier of the correct option matching QuestionOption.id */
  correctAnswer: string;
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
  createdAt: string;
  updatedAt: string;
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
