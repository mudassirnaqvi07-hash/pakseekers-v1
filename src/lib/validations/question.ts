/**
 * Question & Content Validation Schemas — PakSeekers.
 *
 * Provides reusable validation logic for Exams, Subjects, Topics, Questions, and Tests.
 * Used by Server Actions, Admin CMS forms, and the future Bulk Copy/Paste MCQ Importer.
 */

import { z } from "zod";
import type { Question } from "@/types";

// ---------------------------------------------------------------------------
// Option Schema
// ---------------------------------------------------------------------------

export const questionOptionSchema = z.object({
  id: z.string().trim().min(1, "Option ID is required"),
  label: z.string().trim().min(1, "Option label is required"),
  text: z.string().trim().min(1, "Option text cannot be empty"),
});

// ---------------------------------------------------------------------------
// Question Schema
// ---------------------------------------------------------------------------

export const questionDifficultySchema = z.enum(["easy", "medium", "hard"] as const, {
  message: "Difficulty must be 'easy', 'medium', or 'hard'",
});

export const questionStatusSchema = z.enum(
  ["draft", "review", "published", "archived"] as const,
  {
    message: "Status must be 'draft', 'review', 'published', or 'archived'",
  }
);

export const questionSchema = z
  .object({
    id: z.string().trim().min(1, "Question ID is required"),
    questionText: z.string().trim().min(5, "Question text must be at least 5 characters long"),
    options: z
      .array(questionOptionSchema)
      .min(2, "A question must have at least 2 options"),
    correctAnswer: z.string().trim().min(1, "Correct answer identifier is required"),
    explanation: z.string().trim().min(1, "Explanation is required to support student learning"),
    examId: z.string().trim().min(1, "Exam must be selected"),
    subjectId: z.string().trim().min(1, "Subject must be selected"),
    topicId: z.string().trim().min(1, "Topic must be selected"),
    difficulty: questionDifficultySchema,
    status: questionStatusSchema.default("published"),
    metadata: z.record(z.string(), z.unknown()).optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // 1. Validate that correctAnswer matches one of the option IDs
    const optionIds = data.options.map((opt) => opt.id);
    if (!optionIds.includes(data.correctAnswer)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Correct answer '${data.correctAnswer}' does not match any available option IDs (${optionIds.join(", ")})`,
        path: ["correctAnswer"],
      });
    }

    // 2. Validate that there are no duplicate option texts (case-insensitive trimmed)
    const normalizedTexts = data.options.map((opt) => opt.text.trim().toLowerCase());
    const duplicates = normalizedTexts.filter(
      (item, index) => normalizedTexts.indexOf(item) !== index
    );

    if (duplicates.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duplicate option text detected: "${duplicates[0]}"`,
        path: ["options"],
      });
    }

    // 3. Validate unique option labels if provided (e.g., A, B, C, D)
    const labels = data.options.map((opt) => opt.label.trim().toUpperCase());
    const duplicateLabels = labels.filter((item, index) => labels.indexOf(item) !== index);
    if (duplicateLabels.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duplicate option label detected: "${duplicateLabels[0]}"`,
        path: ["options"],
      });
    }
  });

export type ValidatedQuestionInput = z.infer<typeof questionSchema>;

// Question Form Schema (without mandatory id, which can be generated)
export const questionFormSchema = z
  .object({
    questionText: z.string().trim().min(5, "Question text must be at least 5 characters long"),
    options: z
      .array(questionOptionSchema)
      .min(2, "A question must have at least 2 options"),
    correctAnswer: z.string().trim().min(1, "Correct answer must be selected"),
    explanation: z.string().trim().min(5, "Explanation must be at least 5 characters long"),
    examId: z.string().trim().min(1, "Exam must be selected"),
    subjectId: z.string().trim().min(1, "Subject must be selected"),
    topicId: z.string().trim().min(1, "Topic must be selected"),
    difficulty: questionDifficultySchema,
    status: questionStatusSchema.default("published"),
  })
  .superRefine((data, ctx) => {
    const optionIds = data.options.map((opt) => opt.id);
    if (!optionIds.includes(data.correctAnswer)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selected correct answer is not in options",
        path: ["correctAnswer"],
      });
    }

    const normalizedTexts = data.options.map((opt) => opt.text.trim().toLowerCase());
    const duplicates = normalizedTexts.filter(
      (item, index) => normalizedTexts.indexOf(item) !== index
    );

    if (duplicates.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duplicate option text detected: "${duplicates[0]}"`,
        path: ["options"],
      });
    }
  });

// ---------------------------------------------------------------------------
// Exam Form Schema
// ---------------------------------------------------------------------------

export const examFormSchema = z.object({
  title: z.string().trim().min(2, "Exam title must be at least 2 characters long"),
  code: z
    .string()
    .trim()
    .min(2, "Exam code must be at least 2 characters long")
    .max(12, "Exam code cannot exceed 12 characters"),
  description: z.string().trim().min(10, "Description must be at least 10 characters long"),
  status: z.enum(["active", "draft", "archived"] as const).default("active"),
});

// ---------------------------------------------------------------------------
// Subject Form Schema
// ---------------------------------------------------------------------------

export const subjectFormSchema = z.object({
  examId: z.string().trim().min(1, "Parent exam is required"),
  title: z.string().trim().min(2, "Subject title must be at least 2 characters long"),
  description: z.string().trim().min(10, "Description must be at least 10 characters long"),
  icon: z.string().optional(),
  status: z.enum(["active", "draft", "archived"] as const).default("active"),
});

// ---------------------------------------------------------------------------
// Topic Form Schema
// ---------------------------------------------------------------------------

export const topicFormSchema = z.object({
  examId: z.string().trim().min(1, "Parent exam is required"),
  subjectId: z.string().trim().min(1, "Parent subject is required"),
  title: z.string().trim().min(2, "Topic title must be at least 2 characters long"),
  description: z.string().trim().min(10, "Description must be at least 10 characters long"),
  status: z.enum(["active", "draft", "archived"] as const).default("active"),
});

// ---------------------------------------------------------------------------
// Test Form Schema
// ---------------------------------------------------------------------------

export const testFormSchema = z
  .object({
    title: z.string().trim().min(3, "Test title must be at least 3 characters long"),
    description: z.string().trim().min(10, "Description must be at least 10 characters long"),
    examId: z.string().trim().min(1, "Parent exam is required"),
    subjectId: z.string().trim().min(1, "Parent subject is required"),
    topicId: z.string().trim().optional(),
    durationMinutes: z.coerce.number().min(1, "Duration must be at least 1 minute"),
    difficulty: z.enum(["easy", "medium", "hard", "mixed"] as const).default("medium"),
    status: z.enum(["draft", "published", "archived"] as const).default("draft"),
    questionIds: z.array(z.string()).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.status === "published" && data.questionIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cannot publish a test with zero questions. Please select at least one question.",
        path: ["questionIds"],
      });
    }
  });

// ---------------------------------------------------------------------------
// Validation Helper Functions
// ---------------------------------------------------------------------------

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

export function validateQuestion(input: unknown): ValidationResult<Question> {
  const result = questionSchema.safeParse(input);
  if (!result.success) {
    const errors = result.error.issues.map(
      (issue) => `${issue.path.join(".") || "root"}: ${issue.message}`
    );
    return {
      success: false,
      errors,
    };
  }

  return {
    success: true,
    data: result.data as Question,
  };
}

export function validateQuestionBatch(items: unknown[]): {
  valid: Question[];
  invalid: Array<{ index: number; errors: string[]; raw: unknown }>;
  isValidAll: boolean;
} {
  const valid: Question[] = [];
  const invalid: Array<{ index: number; errors: string[]; raw: unknown }> = [];

  items.forEach((item, index) => {
    const res = validateQuestion(item);
    if (res.success && res.data) {
      valid.push(res.data);
    } else {
      invalid.push({
        index,
        errors: res.errors ?? ["Unknown validation error"],
        raw: item,
      });
    }
  });

  return {
    valid,
    invalid,
    isValidAll: invalid.length === 0,
  };
}
