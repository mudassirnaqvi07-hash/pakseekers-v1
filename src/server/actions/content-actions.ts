"use server";

/**
 * Content Management Server Actions — PakSeekers Phase 3.
 *
 * Provides validated mutations for Exams, Subjects, Topics, Questions, and Tests.
 * Integrates with Next.js revalidatePath to ensure student and admin views
 * immediately synchronize when content is created, updated, or published.
 */

import { revalidatePath } from "next/cache";
import type { ActionResult, Exam, Subject, Topic, Question, Test } from "@/types";
import * as contentRepo from "@/server/repositories/content-repository";
import {
  examFormSchema,
  subjectFormSchema,
  topicFormSchema,
  questionFormSchema,
  testFormSchema,
} from "@/lib/validations/question";

function revalidateAllPaths(): void {
  revalidatePath("/admin");
  revalidatePath("/admin/exams");
  revalidatePath("/admin/subjects");
  revalidatePath("/admin/topics");
  revalidatePath("/admin/questions");
  revalidatePath("/admin/tests");
  revalidatePath("/exams");
}

// ---------------------------------------------------------------------------
// Exam Server Actions
// ---------------------------------------------------------------------------

export async function createExamAction(
  rawInput: unknown
): Promise<ActionResult<Exam>> {
  const parsed = examFormSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join("; ");
    return { success: false, error: errorMsg };
  }

  try {
    const exam = contentRepo.createExam(parsed.data);
    revalidateAllPaths();
    return { success: true, data: exam };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create exam",
    };
  }
}

export async function updateExamAction(
  id: string,
  rawInput: unknown
): Promise<ActionResult<Exam>> {
  const parsed = examFormSchema.partial().safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join("; ");
    return { success: false, error: errorMsg };
  }

  try {
    const exam = contentRepo.updateExam(id, parsed.data);
    if (!exam) {
      return { success: false, error: `Exam with id ${id} not found` };
    }
    revalidateAllPaths();
    return { success: true, data: exam };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update exam",
    };
  }
}

export async function deleteExamAction(id: string): Promise<ActionResult<void>> {
  try {
    const ok = contentRepo.deleteExam(id);
    if (!ok) {
      return { success: false, error: `Exam with id ${id} not found` };
    }
    revalidateAllPaths();
    return { success: true, data: undefined };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete exam",
    };
  }
}

// ---------------------------------------------------------------------------
// Subject Server Actions
// ---------------------------------------------------------------------------

export async function createSubjectAction(
  rawInput: unknown
): Promise<ActionResult<Subject>> {
  const parsed = subjectFormSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join("; ");
    return { success: false, error: errorMsg };
  }

  // Validate parent exam exists
  const parentExam = contentRepo.getExamById(parsed.data.examId);
  if (!parentExam) {
    return {
      success: false,
      error: `Invalid parent exam. Selected exam does not exist.`,
    };
  }

  try {
    const subject = contentRepo.createSubject(parsed.data);
    revalidateAllPaths();
    return { success: true, data: subject };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create subject",
    };
  }
}

export async function updateSubjectAction(
  id: string,
  rawInput: unknown
): Promise<ActionResult<Subject>> {
  const parsed = subjectFormSchema.partial().safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join("; ");
    return { success: false, error: errorMsg };
  }

  try {
    const subject = contentRepo.updateSubject(id, parsed.data);
    if (!subject) {
      return { success: false, error: `Subject with id ${id} not found` };
    }
    revalidateAllPaths();
    return { success: true, data: subject };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update subject",
    };
  }
}

export async function deleteSubjectAction(id: string): Promise<ActionResult<void>> {
  try {
    const ok = contentRepo.deleteSubject(id);
    if (!ok) {
      return { success: false, error: `Subject with id ${id} not found` };
    }
    revalidateAllPaths();
    return { success: true, data: undefined };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete subject",
    };
  }
}

// ---------------------------------------------------------------------------
// Topic Server Actions
// ---------------------------------------------------------------------------

export async function createTopicAction(
  rawInput: unknown
): Promise<ActionResult<Topic>> {
  const parsed = topicFormSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join("; ");
    return { success: false, error: errorMsg };
  }

  // Validate parent subject & exam
  const parentSubject = contentRepo.getSubjectById(parsed.data.subjectId);
  if (!parentSubject) {
    return {
      success: false,
      error: `Invalid parent subject. Selected subject does not exist.`,
    };
  }

  try {
    const topic = contentRepo.createTopic(parsed.data);
    revalidateAllPaths();
    return { success: true, data: topic };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create topic",
    };
  }
}

export async function updateTopicAction(
  id: string,
  rawInput: unknown
): Promise<ActionResult<Topic>> {
  const parsed = topicFormSchema.partial().safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join("; ");
    return { success: false, error: errorMsg };
  }

  try {
    const topic = contentRepo.updateTopic(id, parsed.data);
    if (!topic) {
      return { success: false, error: `Topic with id ${id} not found` };
    }
    revalidateAllPaths();
    return { success: true, data: topic };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update topic",
    };
  }
}

export async function deleteTopicAction(id: string): Promise<ActionResult<void>> {
  try {
    const ok = contentRepo.deleteTopic(id);
    if (!ok) {
      return { success: false, error: `Topic with id ${id} not found` };
    }
    revalidateAllPaths();
    return { success: true, data: undefined };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete topic",
    };
  }
}

// ---------------------------------------------------------------------------
// Question Server Actions
// ---------------------------------------------------------------------------

export async function createQuestionAction(
  rawInput: unknown
): Promise<ActionResult<Question>> {
  const parsed = questionFormSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join("; ");
    return { success: false, error: errorMsg };
  }

  // Validate relationships
  const topic = contentRepo.getTopicById(parsed.data.topicId);
  if (!topic) {
    return {
      success: false,
      error: "Selected topic does not exist.",
    };
  }

  try {
    const question = contentRepo.createQuestion(parsed.data);
    revalidateAllPaths();
    return { success: true, data: question };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create question",
    };
  }
}

export async function updateQuestionAction(
  id: string,
  rawInput: unknown
): Promise<ActionResult<Question>> {
  const parsed = questionFormSchema.partial().safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join("; ");
    return { success: false, error: errorMsg };
  }

  try {
    const question = contentRepo.updateQuestion(id, parsed.data);
    if (!question) {
      return { success: false, error: `Question with id ${id} not found` };
    }
    revalidateAllPaths();
    return { success: true, data: question };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update question",
    };
  }
}

export async function deleteQuestionAction(
  id: string
): Promise<ActionResult<void>> {
  try {
    const ok = contentRepo.deleteQuestion(id);
    if (!ok) {
      return { success: false, error: `Question with id ${id} not found` };
    }
    revalidateAllPaths();
    return { success: true, data: undefined };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete question",
    };
  }
}

// ---------------------------------------------------------------------------
// Test Server Actions
// ---------------------------------------------------------------------------

export async function createTestAction(
  rawInput: unknown
): Promise<ActionResult<Test>> {
  const parsed = testFormSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join("; ");
    return { success: false, error: errorMsg };
  }

  try {
    const test = contentRepo.createTest(parsed.data);
    revalidateAllPaths();
    return { success: true, data: test };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create test",
    };
  }
}

export async function updateTestAction(
  id: string,
  rawInput: unknown
): Promise<ActionResult<Test>> {
  const parsed = testFormSchema.partial().safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join("; ");
    return { success: false, error: errorMsg };
  }

  try {
    const test = contentRepo.updateTest(id, parsed.data);
    if (!test) {
      return { success: false, error: `Test with id ${id} not found` };
    }
    revalidateAllPaths();
    return { success: true, data: test };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update test",
    };
  }
}

export async function togglePublishTestAction(
  id: string
): Promise<ActionResult<Test>> {
  try {
    const test = contentRepo.togglePublishTest(id);
    if (!test) {
      return { success: false, error: `Test with id ${id} not found` };
    }
    revalidateAllPaths();
    return { success: true, data: test };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to toggle test status",
    };
  }
}

export async function deleteTestAction(id: string): Promise<ActionResult<void>> {
  try {
    const ok = contentRepo.deleteTest(id);
    if (!ok) {
      return { success: false, error: `Test with id ${id} not found` };
    }
    revalidateAllPaths();
    return { success: true, data: undefined };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete test",
    };
  }
}
