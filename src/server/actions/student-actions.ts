"use server";

/**
 * Student Actions — PakSeekers.
 *
 * Provides actions callable by authenticated students, such as
 * reporting questions with errors or confusing explanations.
 */

import { revalidatePath } from "next/cache";
import type { ActionResult, QuestionReport, QuestionReportReason } from "@/types";
import { getCurrentUser } from "@/server/auth/session";
import * as reportRepo from "@/server/repositories/report-repository";
import * as contentRepo from "@/server/repositories/content-repository";

export async function reportQuestionAction(input: {
  questionId: string;
  reason: QuestionReportReason;
  description: string;
}): Promise<ActionResult<QuestionReport>> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "student") {
    return {
      success: false,
      error: "You must be signed in as a student to submit a question report.",
    };
  }

  if ((currentUser.status || "").toLowerCase() === "suspended") {
    return {
      success: false,
      error: "Your account has been suspended by an administrator.",
    };
  }

  if (!input.questionId) {
    return { success: false, error: "Question ID is required." };
  }

  if (!input.description || input.description.trim().length < 5) {
    return {
      success: false,
      error: "Please provide a brief description (at least 5 characters) of the issue.",
    };
  }

  // Fetch question to verify it exists and capture text snapshot
  const question = await contentRepo.getQuestionById(input.questionId);
  if (!question) {
    return { success: false, error: "Question not found in the question bank." };
  }

  try {
    const report = await reportRepo.createQuestionReport({
      questionId: input.questionId,
      questionText: question.questionText,
      studentId: currentUser.id,
      studentName: currentUser.name,
      studentEmail: currentUser.email,
      reason: input.reason,
      description: input.description.trim(),
    });

    revalidatePath("/admin/question-reports");
    revalidatePath("/admin/reports");
    return { success: true, data: report };
  } catch (err) {
    console.error("Failed to submit question report:", err);
    return {
      success: false,
      error: "Failed to submit your report. Please try again shortly.",
    };
  }
}
