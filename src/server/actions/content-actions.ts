"use server";

/**
 * Content Management Server Actions — PakSeekers Phase 3.
 *
 * Provides validated mutations for Exams, Subjects, Topics, Questions, and Tests.
 * Integrates with Next.js revalidatePath to ensure student and admin views
 * immediately synchronize when content is created, updated, or published.
 */

import { revalidatePath, revalidateTag } from "next/cache";
import type { ActionResult, Exam, Subject, ExamSubject, Topic, Question, Test, Section, Lesson } from "@/types";
import * as contentRepo from "@/server/repositories/content-repository";
import { getCurrentUser } from "@/server/auth/session";
import {
  examFormSchema,
  subjectFormSchema,
  topicFormSchema,
  questionFormSchema,
  testFormSchema,
  sectionFormSchema,
  lessonFormSchema,
  mockTestFormSchema,
} from "@/lib/validations/question";
import {
  importQuizActionSchema,
  parseAndValidateQuizJson,
} from "@/lib/validations/quiz-import";

function revalidateAllPaths(): void {
  revalidatePath("/admin");
  revalidatePath("/admin/exams");
  revalidatePath("/admin/subjects");
  revalidatePath("/admin/topics");
  revalidatePath("/admin/questions");
  revalidatePath("/admin/tests");
  revalidatePath("/admin/sections");
  revalidatePath("/admin/lessons");
  revalidatePath("/admin/mock-tests");
  revalidatePath("/exams");
  revalidatePath("/student/tests");
  try {
    revalidateTag("exams", { expire: 0 });
    revalidateTag("tests", { expire: 0 });
    revalidateTag("subjects", { expire: 0 });
  } catch {
    // revalidateTag graceful fallback
  }
}

async function verifyAdminAuth(): Promise<ActionResult<never> | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return {
      success: false,
      error: "Unauthorized: Administrator privileges are required to perform this action.",
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Exam Server Actions
// ---------------------------------------------------------------------------

export async function createExamAction(
  rawInput: unknown
): Promise<ActionResult<Exam>> {
  const authError = await verifyAdminAuth();
  if (authError) return authError;

  const parsed = examFormSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join("; ");
    return { success: false, error: errorMsg };
  }

  try {
    const exam = await contentRepo.createExam(parsed.data);
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
  const authError = await verifyAdminAuth();
  if (authError) return authError;

  const parsed = examFormSchema.partial().safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join("; ");
    return { success: false, error: errorMsg };
  }

  try {
    const exam = await contentRepo.updateExam(id, parsed.data);
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
  const authError = await verifyAdminAuth();
  if (authError) return authError;

  try {
    const ok = await contentRepo.deleteExam(id);
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
  const authError = await verifyAdminAuth();
  if (authError) return authError;

  const parsed = subjectFormSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join("; ");
    return { success: false, error: errorMsg };
  }

  // Validate parent exam exists
  const parentExam = await contentRepo.getExamById(parsed.data.examId);
  if (!parentExam) {
    return {
      success: false,
      error: `Invalid parent exam. Selected exam does not exist.`,
    };
  }

  try {
    const subject = await contentRepo.createSubject(parsed.data);
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
  const authError = await verifyAdminAuth();
  if (authError) return authError;

  const parsed = subjectFormSchema.partial().safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join("; ");
    return { success: false, error: errorMsg };
  }

  try {
    const subject = await contentRepo.updateSubject(id, parsed.data);
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
  const authError = await verifyAdminAuth();
  if (authError) return authError;

  try {
    const ok = await contentRepo.deleteSubject(id);
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

export async function assignSubjectToExamAction(
  examId: string,
  subjectId: string,
  displayOrder?: number,
  weightage?: number
): Promise<ActionResult<ExamSubject>> {
  const authError = await verifyAdminAuth();
  if (authError) return authError;

  try {
    const junction = await contentRepo.assignSubjectToExam(
      examId,
      subjectId,
      displayOrder,
      weightage
    );
    revalidateAllPaths();
    revalidatePath(`/admin/exams/${examId}/edit`);
    return { success: true, data: junction };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to associate subject to exam",
    };
  }
}

export async function removeSubjectFromExamAction(
  examId: string,
  subjectId: string
): Promise<ActionResult<void>> {
  const authError = await verifyAdminAuth();
  if (authError) return authError;

  try {
    const success = await contentRepo.removeSubjectFromExam(examId, subjectId);
    if (!success) {
      return { success: false, error: "Subject association not found or already removed." };
    }
    revalidateAllPaths();
    revalidatePath(`/admin/exams/${examId}/edit`);
    return { success: true, data: undefined };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to remove subject from exam",
    };
  }
}

export async function updateExamSubjectOrderAction(
  examId: string,
  orderList: { subjectId: string; displayOrder: number }[]
): Promise<ActionResult<void>> {
  const authError = await verifyAdminAuth();
  if (authError) return authError;

  try {
    await contentRepo.updateExamSubjectOrder(examId, orderList);
    revalidateAllPaths();
    revalidatePath(`/admin/exams/${examId}/edit`);
    return { success: true, data: undefined };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to reorder subjects",
    };
  }
}

// ---------------------------------------------------------------------------
// Topic Server Actions
// ---------------------------------------------------------------------------

export async function createTopicAction(
  rawInput: unknown
): Promise<ActionResult<Topic>> {
  const authError = await verifyAdminAuth();
  if (authError) return authError;

  const parsed = topicFormSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join("; ");
    return { success: false, error: errorMsg };
  }

  // Validate parent subject & exam
  const parentSubject = await contentRepo.getSubjectById(parsed.data.subjectId);
  if (!parentSubject) {
    return {
      success: false,
      error: `Invalid parent subject. Selected subject does not exist.`,
    };
  }

  try {
    const topic = await contentRepo.createTopic(parsed.data);
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
  const authError = await verifyAdminAuth();
  if (authError) return authError;

  const parsed = topicFormSchema.partial().safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join("; ");
    return { success: false, error: errorMsg };
  }

  try {
    const topic = await contentRepo.updateTopic(id, parsed.data);
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
  const authError = await verifyAdminAuth();
  if (authError) return authError;

  try {
    const ok = await contentRepo.deleteTopic(id);
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
  const authError = await verifyAdminAuth();
  if (authError) return authError;

  const parsed = questionFormSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join("; ");
    return { success: false, error: errorMsg };
  }

  // Validate relationships
  const topic = await contentRepo.getTopicById(parsed.data.topicId);
  if (!topic) {
    return {
      success: false,
      error: "Selected topic does not exist.",
    };
  }

  try {
    const question = await contentRepo.createQuestion(parsed.data);
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
  const authError = await verifyAdminAuth();
  if (authError) return authError;

  const parsed = questionFormSchema.partial().safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join("; ");
    return { success: false, error: errorMsg };
  }

  try {
    const question = await contentRepo.updateQuestion(id, parsed.data);
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
  const authError = await verifyAdminAuth();
  if (authError) return authError;

  try {
    const ok = await contentRepo.deleteQuestion(id);
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
  const authError = await verifyAdminAuth();
  if (authError) return authError;

  const parsed = testFormSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join("; ");
    return { success: false, error: errorMsg };
  }

  try {
    const test = await contentRepo.createTest(parsed.data);
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
  const authError = await verifyAdminAuth();
  if (authError) return authError;

  const parsed = testFormSchema.partial().safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join("; ");
    return { success: false, error: errorMsg };
  }

  try {
    const test = await contentRepo.updateTest(id, parsed.data);
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
  const authError = await verifyAdminAuth();
  if (authError) return authError;

  try {
    const test = await contentRepo.togglePublishTest(id);
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
  const authError = await verifyAdminAuth();
  if (authError) return authError;

  try {
    const ok = await contentRepo.deleteTest(id);
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

// ---------------------------------------------------------------------------
// Quiz Bulk Importer Server Action
// ---------------------------------------------------------------------------

export async function importQuizAction(
  rawInput: unknown
): Promise<ActionResult<Test>> {
  // 1. Authoritative Admin Guard
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return {
      success: false,
      error: "Unauthorized: Administrator privileges are required to import quizzes.",
    };
  }

  // 2. Validate input schema
  const parsedForm = importQuizActionSchema.safeParse(rawInput);
  if (!parsedForm.success) {
    const errorMsg = parsedForm.error.issues.map((i) => i.message).join("; ");
    return { success: false, error: errorMsg };
  }

  const { examId, subjectId, topicId, jsonContent, title, description, durationMinutes, difficulty, status } =
    parsedForm.data;

  // 3. Verify content hierarchy existence and relationships
  const exam = await contentRepo.getExamById(examId);
  if (!exam) {
    return { success: false, error: "Selected exam does not exist." };
  }

  const subject = await contentRepo.getSubjectById(subjectId);
  if (!subject) {
    return { success: false, error: "Selected subject does not exist." };
  }
  if (subject.examId.toLowerCase() !== examId.toLowerCase()) {
    return { success: false, error: "Selected subject does not belong to the selected exam." };
  }

  const topic = await contentRepo.getTopicById(topicId);
  if (!topic) {
    return { success: false, error: "Selected topic does not exist." };
  }
  if (topic.subjectId.toLowerCase() !== subjectId.toLowerCase()) {
    return { success: false, error: "Selected topic does not belong to the selected subject." };
  }

  // 4. Server-side validation of the JSON payload
  const validation = parseAndValidateQuizJson(jsonContent, {
    examId,
    subjectId,
    topicId,
    fallbackTitle: title,
    defaultDifficulty: difficulty,
    status,
  });

  if (!validation.success || !validation.parsedQuiz) {
    if (validation.syntaxError) {
      return { success: false, error: validation.syntaxError };
    }

    if (validation.globalErrors && validation.globalErrors.length > 0) {
      return { success: false, error: validation.globalErrors.join("; ") };
    }

    if (validation.questionErrors && validation.questionErrors.length > 0) {
      const qErrorsFormatted = validation.questionErrors
        .map((qe) => `Question #${qe.index}: ${qe.errors.join(", ")}`)
        .slice(0, 5) // return first 5 readable errors
        .join("; ");
      const totalErrors = validation.questionErrors.length;
      const extraNotice = totalErrors > 5 ? ` (and ${totalErrors - 5} more questions with errors)` : "";
      return {
        success: false,
        error: `Validation failed on ${totalErrors} question(s): ${qErrorsFormatted}${extraNotice}`,
      };
    }

    return { success: false, error: "Validation failed on the provided quiz JSON." };
  }

  const parsedQuiz = validation.parsedQuiz;

  // Apply explicit overrides from form if supplied by admin
  const finalTitle = (title && title.trim().length >= 3 ? title.trim() : parsedQuiz.title);
  const finalDescription = (description !== undefined && description.trim() ? description.trim() : parsedQuiz.description);
  const finalDuration = durationMinutes || parsedQuiz.durationMinutes;
  const finalDifficulty = difficulty || parsedQuiz.difficulty;
  const finalStatus = status || parsedQuiz.status;

  // 5. Atomic persistence
  try {
    const importResult = await contentRepo.importQuizWithQuestions({
      examId,
      subjectId,
      topicId,
      title: finalTitle,
      description: finalDescription,
      durationMinutes: finalDuration,
      difficulty: finalDifficulty,
      status: finalStatus,
      questions: parsedQuiz.questions,
    });

    // 6. Cache synchronization across both admin and student views
    revalidateAllPaths();
    revalidatePath(`/exams/${examId}/topics/${topicId}`);
    revalidatePath(`/exams/${examId}/topics/${topicId}/practice`);

    return { success: true, data: importResult.test };
  } catch (err) {
    console.error("Quiz import failed:", err);
    return {
      success: false,
      error: "An unexpected error occurred while saving the imported quiz. Please verify the input and try again.",
    };
  }
}

// ---------------------------------------------------------------------------
// Section Server Actions
// ---------------------------------------------------------------------------

export async function createSectionAction(
  formData: FormData
): Promise<ActionResult<Section>> {
  const authError = await verifyAdminAuth();
  if (authError) return authError;

  const rawData = {
    title: formData.get("title"),
    description: formData.get("description"),
    examId: formData.get("examId"),
    subjectId: formData.get("subjectId"),
    order: formData.get("order"),
    status: formData.get("status"),
  };

  const parsed = sectionFormSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid section data.",
    };
  }

  try {
    const created = await contentRepo.createSection(parsed.data);
    revalidateAllPaths();
    return { success: true, data: created };
  } catch (err) {
    console.error("Failed to create section:", err);
    return { success: false, error: "Failed to create section. Please try again." };
  }
}

export async function updateSectionAction(
  id: string,
  formData: FormData
): Promise<ActionResult<Section>> {
  const authError = await verifyAdminAuth();
  if (authError) return authError;

  if (!id) return { success: false, error: "Section ID is required." };

  const rawData = {
    title: formData.get("title"),
    description: formData.get("description"),
    examId: formData.get("examId"),
    subjectId: formData.get("subjectId"),
    order: formData.get("order"),
    status: formData.get("status"),
  };

  const parsed = sectionFormSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid section data.",
    };
  }

  try {
    const updated = await contentRepo.updateSection(id, parsed.data);
    if (!updated) return { success: false, error: "Section not found." };
    revalidateAllPaths();
    return { success: true, data: updated };
  } catch (err) {
    console.error("Failed to update section:", err);
    return { success: false, error: "Failed to update section. Please try again." };
  }
}

export async function deleteSectionAction(
  id: string
): Promise<ActionResult<{ id: string }>> {
  const authError = await verifyAdminAuth();
  if (authError) return authError;

  if (!id) return { success: false, error: "Section ID is required." };

  try {
    const deleted = await contentRepo.deleteSection(id);
    if (!deleted) return { success: false, error: "Section not found or already deleted." };
    revalidateAllPaths();
    return { success: true, data: { id } };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Failed to delete section.";
    return { success: false, error: errMsg };
  }
}

// ---------------------------------------------------------------------------
// Lesson Server Actions
// ---------------------------------------------------------------------------

export async function createLessonAction(
  formData: FormData
): Promise<ActionResult<Lesson>> {
  const authError = await verifyAdminAuth();
  if (authError) return authError;

  const rawObjectives = formData.get("learningObjectives");
  let objectives: string[] = [];
  if (typeof rawObjectives === "string" && rawObjectives.trim().length > 0) {
    try {
      objectives = JSON.parse(rawObjectives);
    } catch {
      objectives = rawObjectives
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  const rawData = {
    title: formData.get("title"),
    slug: formData.get("slug") || undefined,
    description: formData.get("description"),
    content: formData.get("content"),
    examId: formData.get("examId"),
    subjectId: formData.get("subjectId"),
    topicId: formData.get("topicId"),
    sectionId: formData.get("sectionId") || undefined,
    order: formData.get("order"),
    readTimeMinutes: formData.get("readTimeMinutes") || undefined,
    status: formData.get("status"),
    learningObjectives: objectives,
  };

  const parsed = lessonFormSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid lesson data.",
    };
  }

  try {
    const created = await contentRepo.createLesson(parsed.data);
    revalidateAllPaths();
    return { success: true, data: created };
  } catch (err) {
    console.error("Failed to create lesson:", err);
    return { success: false, error: "Failed to create lesson. Please try again." };
  }
}

export async function updateLessonAction(
  id: string,
  formData: FormData
): Promise<ActionResult<Lesson>> {
  const authError = await verifyAdminAuth();
  if (authError) return authError;

  if (!id) return { success: false, error: "Lesson ID is required." };

  const rawObjectives = formData.get("learningObjectives");
  let objectives: string[] = [];
  if (typeof rawObjectives === "string" && rawObjectives.trim().length > 0) {
    try {
      objectives = JSON.parse(rawObjectives);
    } catch {
      objectives = rawObjectives
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  const rawData = {
    title: formData.get("title"),
    slug: formData.get("slug") || undefined,
    description: formData.get("description"),
    content: formData.get("content"),
    examId: formData.get("examId"),
    subjectId: formData.get("subjectId"),
    topicId: formData.get("topicId"),
    sectionId: formData.get("sectionId") || undefined,
    order: formData.get("order"),
    readTimeMinutes: formData.get("readTimeMinutes") || undefined,
    status: formData.get("status"),
    learningObjectives: objectives,
  };

  const parsed = lessonFormSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid lesson data.",
    };
  }

  try {
    const updated = await contentRepo.updateLesson(id, parsed.data);
    if (!updated) return { success: false, error: "Lesson not found." };
    revalidateAllPaths();
    return { success: true, data: updated };
  } catch (err) {
    console.error("Failed to update lesson:", err);
    return { success: false, error: "Failed to update lesson. Please try again." };
  }
}

export async function deleteLessonAction(
  id: string
): Promise<ActionResult<{ id: string }>> {
  const authError = await verifyAdminAuth();
  if (authError) return authError;

  if (!id) return { success: false, error: "Lesson ID is required." };

  try {
    const deleted = await contentRepo.deleteLesson(id);
    if (!deleted) return { success: false, error: "Lesson not found or already deleted." };
    revalidateAllPaths();
    return { success: true, data: { id } };
  } catch (err) {
    console.error("Failed to delete lesson:", err);
    return { success: false, error: "Failed to delete lesson." };
  }
}

export async function toggleLessonPublishAction(
  id: string
): Promise<ActionResult<Lesson>> {
  const authError = await verifyAdminAuth();
  if (authError) return authError;

  if (!id) return { success: false, error: "Lesson ID is required." };

  try {
    const toggled = await contentRepo.toggleLessonPublish(id);
    if (!toggled) return { success: false, error: "Lesson not found." };
    revalidateAllPaths();
    return { success: true, data: toggled };
  } catch (err) {
    console.error("Failed to toggle lesson publish status:", err);
    return { success: false, error: "Failed to update lesson publish status." };
  }
}

// ---------------------------------------------------------------------------
// Mock Test Server Actions
// ---------------------------------------------------------------------------

export async function createMockTestAction(
  formData: FormData
): Promise<ActionResult<Test>> {
  const authError = await verifyAdminAuth();
  if (authError) return authError;

  const rawQuestionIds = formData.get("questionIds");
  let questionIds: string[] = [];
  if (typeof rawQuestionIds === "string") {
    try {
      questionIds = JSON.parse(rawQuestionIds);
    } catch {
      questionIds = rawQuestionIds.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }

  const rawData = {
    title: formData.get("title"),
    description: formData.get("description"),
    examId: formData.get("examId"),
    subjectId: formData.get("subjectId") || "all",
    durationMinutes: formData.get("durationMinutes"),
    difficulty: formData.get("difficulty") || "mixed",
    status: formData.get("status") || "draft",
    totalMarks: formData.get("totalMarks") || 100,
    passingMarks: formData.get("passingMarks") || 50,
    negativeMarking: formData.get("negativeMarking") || 0,
    instructions: formData.get("instructions") || undefined,
    questionIds,
  };

  const parsed = mockTestFormSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid mock test data.",
    };
  }

  try {
    const created = await contentRepo.createTest({
      ...parsed.data,
      testType: "mock",
    });
    revalidateAllPaths();
    return { success: true, data: created };
  } catch (err) {
    console.error("Failed to create mock test:", err);
    return { success: false, error: "Failed to create mock test. Please try again." };
  }
}

export async function updateMockTestAction(
  id: string,
  formData: FormData
): Promise<ActionResult<Test>> {
  const authError = await verifyAdminAuth();
  if (authError) return authError;

  if (!id) return { success: false, error: "Test ID is required." };

  const rawQuestionIds = formData.get("questionIds");
  let questionIds: string[] = [];
  if (typeof rawQuestionIds === "string") {
    try {
      questionIds = JSON.parse(rawQuestionIds);
    } catch {
      questionIds = rawQuestionIds.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }

  const rawData = {
    title: formData.get("title"),
    description: formData.get("description"),
    examId: formData.get("examId"),
    subjectId: formData.get("subjectId") || "all",
    durationMinutes: formData.get("durationMinutes"),
    difficulty: formData.get("difficulty") || "mixed",
    status: formData.get("status") || "draft",
    totalMarks: formData.get("totalMarks") || 100,
    passingMarks: formData.get("passingMarks") || 50,
    negativeMarking: formData.get("negativeMarking") || 0,
    instructions: formData.get("instructions") || undefined,
    questionIds,
  };

  const parsed = mockTestFormSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid mock test data.",
    };
  }

  try {
    const updated = await contentRepo.updateTest(id, {
      ...parsed.data,
      testType: "mock",
    });
    if (!updated) return { success: false, error: "Mock test not found." };
    revalidateAllPaths();
    return { success: true, data: updated };
  } catch (err) {
    console.error("Failed to update mock test:", err);
    return { success: false, error: "Failed to update mock test." };
  }
}

export async function deleteMockTestAction(
  id: string
): Promise<ActionResult<{ id: string }>> {
  const authError = await verifyAdminAuth();
  if (authError) return authError;

  if (!id) return { success: false, error: "Test ID is required." };

  try {
    const deleted = await contentRepo.deleteTest(id);
    if (!deleted) return { success: false, error: "Mock test not found." };
    revalidateAllPaths();
    return { success: true, data: { id } };
  } catch (err) {
    console.error("Failed to delete mock test:", err);
    return { success: false, error: "Failed to delete mock test." };
  }
}

export async function toggleMockTestPublishAction(
  id: string
): Promise<ActionResult<Test>> {
  const authError = await verifyAdminAuth();
  if (authError) return authError;

  if (!id) return { success: false, error: "Test ID is required." };

  try {
    const toggled = await contentRepo.togglePublishTest(id);
    if (!toggled) return { success: false, error: "Mock test not found." };
    revalidateAllPaths();
    return { success: true, data: toggled };
  } catch (err) {
    console.error("Failed to toggle mock test publish status:", err);
    return { success: false, error: "Failed to update mock test publish status." };
  }
}

