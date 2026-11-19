/**
 * Quiz JSON Import Validation & Parser — PakSeekers.
 *
 * Validates, sanitizes, and normalizes pasted JSON MCQ data into
 * canonical PakSeekers Question and Test domain models.
 */

import { z } from "zod";
import type {
  QuestionOption,
  QuestionDifficulty,
  TestDifficulty,
  TestStatus,
} from "@/types";

// ---------------------------------------------------------------------------
// Constants & Limits
// ---------------------------------------------------------------------------

export const MAX_IMPORT_QUESTIONS = 100;
export const MIN_IMPORT_QUESTIONS = 1;
export const MIN_OPTIONS_COUNT = 2;
export const MAX_OPTIONS_COUNT = 8;
export const MAX_PAYLOAD_CHARS = 1024 * 1024; // ~1MB text

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];

// ---------------------------------------------------------------------------
// Raw Input Zod Schemas
// ---------------------------------------------------------------------------

export const rawOptionItemSchema = z.union([
  z.string().trim().min(1, "Option text cannot be empty"),
  z.object({
    text: z.string().trim().min(1, "Option text cannot be empty"),
    label: z.string().trim().optional(),
    id: z.string().trim().optional(),
  }),
]);

export const rawQuestionItemSchema = z.object({
  question: z.string().trim().min(5, "Question text must be at least 5 characters long"),
  options: z
    .array(rawOptionItemSchema)
    .min(MIN_OPTIONS_COUNT, `Each question must have at least ${MIN_OPTIONS_COUNT} options`)
    .max(MAX_OPTIONS_COUNT, `Each question can have at most ${MAX_OPTIONS_COUNT} options`),
  correctAnswer: z.union([z.string(), z.number()]),
  explanation: z
    .string()
    .trim()
    .min(5, "Explanation must be at least 5 characters long"),
  difficulty: z.enum(["easy", "medium", "hard"] as const).optional(),
});

export const rawQuizPayloadSchema = z.object({
  title: z.string().trim().min(3, "Quiz title must be at least 3 characters long"),
  description: z.string().trim().min(5, "Quiz description must be at least 5 characters long").optional(),
  durationMinutes: z.coerce.number().min(1, "Duration must be at least 1 minute").optional(),
  difficulty: z.enum(["easy", "medium", "hard", "mixed"] as const).optional(),
  questions: z
    .array(rawQuestionItemSchema)
    .min(MIN_IMPORT_QUESTIONS, `Quiz must contain at least ${MIN_IMPORT_QUESTIONS} question`)
    .max(MAX_IMPORT_QUESTIONS, `Quiz cannot contain more than ${MAX_IMPORT_QUESTIONS} questions`),
});

export type RawQuizPayload = z.infer<typeof rawQuizPayloadSchema>;

// ---------------------------------------------------------------------------
// Normalized Output Models
// ---------------------------------------------------------------------------

export interface NormalizedImportQuestion {
  questionText: string;
  options: QuestionOption[];
  correctAnswer: string; // opt-1, opt-2 etc.
  explanation: string;
  difficulty: QuestionDifficulty;
}

export interface NormalizedImportQuiz {
  title: string;
  description: string;
  durationMinutes: number;
  difficulty: TestDifficulty;
  status: TestStatus;
  questions: NormalizedImportQuestion[];
}

export interface QuestionError {
  index: number; // 1-based index for admin presentation
  questionText?: string;
  errors: string[];
}

export interface QuizImportValidationResult {
  success: boolean;
  syntaxError?: string;
  globalErrors?: string[];
  questionErrors?: QuestionError[];
  parsedQuiz?: NormalizedImportQuiz;
}

// ---------------------------------------------------------------------------
// Parser and Normalizer
// ---------------------------------------------------------------------------

/**
 * Parses raw JSON string and normalizes it to PakSeekers domain structures.
 */
export function parseAndValidateQuizJson(
  rawJson: string,
  overrides?: {
    examId?: string;
    subjectId?: string;
    topicId?: string;
    fallbackTitle?: string;
    defaultDifficulty?: TestDifficulty;
    status?: TestStatus;
  }
): QuizImportValidationResult {
  if (!rawJson || typeof rawJson !== "string" || !rawJson.trim()) {
    return {
      success: false,
      syntaxError: "Input JSON cannot be empty. Please paste your quiz data.",
    };
  }

  if (rawJson.length > MAX_PAYLOAD_CHARS) {
    return {
      success: false,
      syntaxError: `Payload exceeds maximum allowed size of ${MAX_PAYLOAD_CHARS / 1024} KB.`,
    };
  }

  let parsedRaw: unknown;
  try {
    parsedRaw = JSON.parse(rawJson);
  } catch (err) {
    return {
      success: false,
      syntaxError: `JSON Syntax Error: ${err instanceof Error ? err.message : "Malformed JSON syntax"}`,
    };
  }

  // If input was an array of questions directly without top-level wrapper, accommodate it
  let payload: unknown = parsedRaw;
  if (Array.isArray(parsedRaw)) {
    payload = {
      title: overrides?.fallbackTitle || "Imported Quiz",
      description: "Quiz generated from imported MCQs",
      questions: parsedRaw,
    };
  }

  const result = rawQuizPayloadSchema.safeParse(payload);
  if (!result.success) {
    const globalErrors: string[] = [];
    const questionErrorsMap = new Map<number, string[]>();

    for (const issue of result.error.issues) {
      if (issue.path[0] === "questions" && typeof issue.path[1] === "number") {
        const qIdx = (issue.path[1] as number) + 1; // 1-based index
        const fieldName = issue.path.slice(2).join(".") || "item";
        const msg = `${fieldName}: ${issue.message}`;
        const existing = questionErrorsMap.get(qIdx) || [];
        existing.push(msg);
        questionErrorsMap.set(qIdx, existing);
      } else {
        globalErrors.push(`${issue.path.join(".") || "quiz"}: ${issue.message}`);
      }
    }

    const questionErrors: QuestionError[] = Array.from(questionErrorsMap.entries()).map(
      ([index, errors]) => ({ index, errors })
    );

    return {
      success: false,
      globalErrors: globalErrors.length > 0 ? globalErrors : undefined,
      questionErrors: questionErrors.length > 0 ? questionErrors : undefined,
    };
  }

  const validData = result.data;
  const normalizedQuestions: NormalizedImportQuestion[] = [];
  const questionErrors: QuestionError[] = [];

  validData.questions.forEach((rawQ, idx) => {
    const qNum = idx + 1;
    const errors: string[] = [];

    // 1. Normalize options to QuestionOption[]
    const options: QuestionOption[] = [];
    const optionTexts: string[] = [];

    rawQ.options.forEach((rawOpt, optIdx) => {
      const text = typeof rawOpt === "string" ? rawOpt.trim() : rawOpt.text.trim();
      const label =
        typeof rawOpt === "object" && rawOpt.label?.trim()
          ? rawOpt.label.trim().toUpperCase()
          : OPTION_LABELS[optIdx] || `${optIdx + 1}`;
      const id = `opt-${optIdx + 1}`;

      if (!text) {
        errors.push(`Option ${optIdx + 1} cannot be empty.`);
      }

      options.push({ id, label, text });
      optionTexts.push(text.toLowerCase());
    });

    // Check duplicate options
    const duplicateText = optionTexts.find(
      (item, i) => optionTexts.indexOf(item) !== i
    );
    if (duplicateText) {
      errors.push(`Duplicate option detected: "${duplicateText}". All options must be unique.`);
    }

    // 2. Resolve Correct Answer
    // Can be:
    // - Option text match (e.g., "JavaScript")
    // - Option label match (e.g., "A", "B", "C")
    // - 0-based or 1-based index (e.g., 0, 1 or "0", "1")
    // - Option ID match (e.g., "opt-1")
    let matchedOptionId: string | null = null;
    const rawAnswerStr = String(rawQ.correctAnswer).trim();

    // Check exact option ID match
    const byId = options.find((opt) => opt.id.toLowerCase() === rawAnswerStr.toLowerCase());
    if (byId) {
      matchedOptionId = byId.id;
    }

    // Check exact option label match
    if (!matchedOptionId) {
      const byLabel = options.find((opt) => opt.label.toUpperCase() === rawAnswerStr.toUpperCase());
      if (byLabel) {
        matchedOptionId = byLabel.id;
      }
    }

    // Check option text match (case-insensitive)
    if (!matchedOptionId) {
      const byText = options.find(
        (opt) => opt.text.trim().toLowerCase() === rawAnswerStr.toLowerCase()
      );
      if (byText) {
        matchedOptionId = byText.id;
      }
    }

    // Check numeric index match
    if (!matchedOptionId) {
      const num = Number(rawAnswerStr);
      if (!isNaN(num) && Number.isInteger(num)) {
        if (num === 0 && options.length > 0) {
          // Explicit 0-based index for first option
          matchedOptionId = options[0].id;
        } else if (num >= 1 && num <= options.length) {
          // Standard 1-based index (1 -> first option, 2 -> second option, etc.)
          matchedOptionId = options[num - 1].id;
        }
      }
    }

    if (!matchedOptionId) {
      const availableChoices = options
        .map((o) => `"${o.label}: ${o.text}"`)
        .join(", ");
      errors.push(
        `Correct answer '${rawAnswerStr}' does not match any valid option. Available options: [${availableChoices}].`
      );
    }

    if (errors.length > 0) {
      questionErrors.push({
        index: qNum,
        questionText: rawQ.question,
        errors,
      });
    } else {
      normalizedQuestions.push({
        questionText: rawQ.question.trim(),
        options,
        correctAnswer: matchedOptionId!,
        explanation: rawQ.explanation.trim(),
        difficulty: rawQ.difficulty || (overrides?.defaultDifficulty === "mixed" ? "medium" : overrides?.defaultDifficulty || "medium"),
      });
    }
  });

  if (questionErrors.length > 0) {
    return {
      success: false,
      questionErrors,
    };
  }

  // Calculate default duration: 1.5 minutes per question or user-provided
  const computedDuration =
    validData.durationMinutes ||
    Math.max(5, Math.ceil(normalizedQuestions.length * 1.5));

  const parsedQuiz: NormalizedImportQuiz = {
    title: validData.title.trim(),
    description: (validData.description || `Comprehensive practice quiz with ${normalizedQuestions.length} MCQs`).trim(),
    durationMinutes: computedDuration,
    difficulty: validData.difficulty || overrides?.defaultDifficulty || "medium",
    status: overrides?.status || "published",
    questions: normalizedQuestions,
  };

  return {
    success: true,
    parsedQuiz,
  };
}

// ---------------------------------------------------------------------------
// Server Action Input Schema
// ---------------------------------------------------------------------------

export const importQuizActionSchema = z.object({
  examId: z.string().trim().min(1, "Exam must be selected"),
  subjectId: z.string().trim().min(1, "Subject must be selected"),
  topicId: z.string().trim().min(1, "Topic must be selected"),
  jsonContent: z.string().trim().min(1, "Pasted JSON content is required"),
  // Allow overriding test title or status from the form if modified in preview
  title: z.string().trim().min(3).optional(),
  description: z.string().trim().optional(),
  durationMinutes: z.coerce.number().min(1).optional(),
  difficulty: z.enum(["easy", "medium", "hard", "mixed"] as const).optional(),
  status: z.enum(["draft", "published", "archived"] as const).default("published"),
});

export type ImportQuizActionInput = z.infer<typeof importQuizActionSchema>;
