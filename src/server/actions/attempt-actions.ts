"use server";

/**
 * Test Attempt Server Actions — PakSeekers.
 *
 * Handles persistence of student test attempts.
 * Extracted from auth-actions.ts to enforce single-responsibility.
 *
 * Security: always re-validates the authenticated user server-side.
 * Never trusts studentId from the client.
 */

import { revalidatePath } from "next/cache";
import type { ActionResult, TestAttempt, Question } from "@/types";
import { getCurrentUser } from "@/server/auth/session";
import { createTestAttempt } from "@/server/repositories/user-repository";
import {
  getTestById,
  getExamById,
  getSubjectById,
  getTopicById,
  getQuestionsByIds,
  getQuestionsByTopicId,
} from "@/server/services/content-service";
import { canAccessExamination } from "@/server/services/enrollment-service";
import { evaluateQuiz } from "@/features/practice/utils/evaluator";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Outside of active Next.js request scope (e.g. testing or CLI)
  }
}

// Cache for duplicate submission prevention (stores recent submissions for 10 seconds)
const recentSubmissions = new Map<string, { timestamp: number; attempt: TestAttempt }>();

export async function recordTestAttemptAction(input: {
  testId?: string;
  examId: string;
  subjectId: string;
  topicId?: string;
  selectedAnswers: Record<string, string>;
  score?: number;
  totalQuestions?: number;
  correctCount?: number;
  incorrectCount?: number;
  unattemptedCount?: number;
  percentage?: number;
  questionResults?: TestAttempt["questionResults"];
}): Promise<ActionResult<TestAttempt>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "student") {
      return {
        success: false,
        error: "You must be signed in as a student to record test attempts.",
      };
    }

    if ((user.status || "").toLowerCase() === "suspended") {
      return {
        success: false,
        error: "Your account has been suspended by an administrator. You cannot submit test attempts.",
      };
    }

    // Authoritative Access Enforcement: Verify student has active enrollment for this exam
    const hasAccess = await canAccessExamination(user.id, input.examId);
    if (!hasAccess) {
      return {
        success: false,
        error: "You are not actively enrolled in this examination track. Please enroll to record test attempts.",
      };
    }

    // 1. Duplicate submission defense: prevent rapid double-clicks
    const targetIdentifier = input.testId || input.topicId || input.subjectId;
    const idempotencyKey = `${user.id}:${targetIdentifier}:${JSON.stringify(input.selectedAnswers)}`;
    const nowMs = Date.now();
    const existing = recentSubmissions.get(idempotencyKey);
    if (existing && nowMs - existing.timestamp < 10000) {
      return { success: true, data: existing.attempt };
    }

    // 2. Verify test exists and is published (if specific testId provided)
    let test = null;
    if (input.testId && input.testId !== "practice-quiz") {
      test = await getTestById(input.testId);
      if (!test || test.status !== "published") {
        return {
          success: false,
          error: "The requested test is not currently available for submission.",
        };
      }
    }

    // 3. Resolve display titles server-side — never trust client-supplied labels
    const [exam, subject, topic] = await Promise.all([
      getExamById(input.examId),
      getSubjectById(input.subjectId),
      input.topicId ? getTopicById(input.topicId) : Promise.resolve(null),
    ]);

    // 4. Retrieve canonical questions from question bank with authoritative answer keys
    let questions: Question[] = [];
    if (test && test.questionIds.length > 0) {
      questions = await getQuestionsByIds(test.questionIds);
    } else if (input.topicId) {
      questions = await getQuestionsByTopicId(input.topicId);
    }

    if (questions.length === 0) {
      return {
        success: false,
        error: "Unable to find question bank content for this test submission.",
      };
    }

    // 5. Authoritatively evaluate the attempt on the server using canonical question keys
    const evaluation = evaluateQuiz(questions, input.selectedAnswers);
    const now = new Date().toISOString();

    // 6. Save attempt to MongoDB Atlas bound to authenticated student ID
    const attempt = await createTestAttempt({
      studentId: user.id,
      testId: test?.id || input.testId || "practice-quiz",
      testTitle: test?.title || (topic ? `${topic.title} Practice` : "Subject Practice"),
      examId: input.examId,
      examTitle: exam?.title || input.examId.toUpperCase(),
      subjectId: input.subjectId,
      subjectTitle: subject?.title || "Subject",
      topicId: input.topicId,
      topicTitle: topic?.title,
      selectedAnswers: input.selectedAnswers,
      score: evaluation.score,
      totalQuestions: evaluation.totalQuestions,
      correctCount: evaluation.correctCount,
      incorrectCount: evaluation.incorrectCount,
      unattemptedCount: evaluation.unattemptedCount,
      percentage: evaluation.percentage,
      questionResults: evaluation.questionResults,
      startedAt: now,
      completedAt: now,
      status: "completed",
    });

    // Record submission to prevent duplicates
    recentSubmissions.set(idempotencyKey, { timestamp: nowMs, attempt });

    safeRevalidate("/student/dashboard");
    safeRevalidate("/student/attempts");

    return { success: true, data: attempt };
  } catch (err) {
    console.error("Test attempt persistence error:", err);
    return {
      success: false,
      error: "An unexpected error occurred while saving your test attempt.",
    };
  }
}
