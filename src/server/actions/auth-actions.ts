"use server";

/**
 * Authentication & Student Profile Server Actions — PakSeekers Phase 4.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionResult, User, TestAttempt } from "@/types";
import {
  findUserByEmail,
  verifyPassword,
  createSession,
  deleteSession,
  createUser,
  updateUserProfile,
  createTestAttempt,
} from "@/server/repositories/user-repository";
import {
  setSessionCookie,
  clearSessionCookie,
  getCurrentSession,
  getCurrentUser,
  isSafeCallbackUrl,
} from "@/server/auth/session";
import {
  loginSchema,
  studentRegisterSchema,
  studentProfileSchema,
} from "@/lib/validations/auth";
import {
  getTestById,
  getExamById,
  getSubjectById,
  getTopicById,
} from "@/server/repositories/content-repository";

// ---------------------------------------------------------------------------
// Student Authentication Actions
// ---------------------------------------------------------------------------

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Outside of active Next.js request scope (e.g. testing or CLI)
  }
}

export async function loginStudentAction(
  rawInput: unknown
): Promise<ActionResult<{ redirectUrl: string }>> {
  const parsed = loginSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid email or password.",
    };
  }

  const { email, password, callbackUrl } = parsed.data;
  const user = findUserByEmail(email);

  if (!user || user.role !== "student") {
    return { success: false, error: "Invalid email or password." };
  }

  const isPasswordValid = verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    return { success: false, error: "Invalid email or password." };
  }

  // Create session
  const session = createSession(user.id, user.role);
  await setSessionCookie(session.token);

  safeRevalidate("/student/dashboard");
  safeRevalidate("/");

  const destination =
    callbackUrl && isSafeCallbackUrl(callbackUrl)
      ? callbackUrl.trim()
      : "/student/dashboard";

  return { success: true, data: { redirectUrl: destination } };
}

export async function registerStudentAction(
  rawInput: unknown
): Promise<ActionResult<{ redirectUrl: string }>> {
  const parsed = studentRegisterSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Please check your registration details.",
    };
  }

  const {
    name,
    email,
    password,
    educationLevel,
    institution,
    targetExam,
    phone,
    callbackUrl,
  } = parsed.data;

  const existing = findUserByEmail(email);
  if (existing) {
    return {
      success: false,
      error: "This email is already registered.",
    };
  }

  try {
    const newUser = createUser({
      name,
      email,
      password,
      role: "student",
      profile: {
        educationLevel,
        institution,
        targetExam,
        phone,
      },
    });

    // Create session and set cookie
    const session = createSession(newUser.id, newUser.role);
    await setSessionCookie(session.token);

    safeRevalidate("/student/dashboard");
    safeRevalidate("/");

    const destination =
      callbackUrl && isSafeCallbackUrl(callbackUrl)
        ? callbackUrl.trim()
        : "/student/dashboard";

    return { success: true, data: { redirectUrl: destination } };
  } catch (err) {
    console.error("Student registration error:", err);
    return {
      success: false,
      error: "Unable to create account. Please try again.",
    };
  }
}

export async function logoutStudentAction(): Promise<void> {
  const session = await getCurrentSession();
  if (session) {
    deleteSession(session.token);
  }
  await clearSessionCookie();
  safeRevalidate("/");
  redirect("/student/login");
}

// ---------------------------------------------------------------------------
// Admin Authentication Actions
// ---------------------------------------------------------------------------

export async function loginAdminAction(
  rawInput: unknown
): Promise<ActionResult<{ redirectUrl: string }>> {
  const parsed = loginSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }

  const { email, password } = parsed.data;
  const user = findUserByEmail(email);

  if (!user || user.role !== "admin") {
    return {
      success: false,
      error: "Invalid administrator credentials or unauthorized role.",
    };
  }

  const isPasswordValid = verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    return { success: false, error: "Invalid email or password." };
  }

  const session = createSession(user.id, "admin");
  await setSessionCookie(session.token);

  revalidatePath("/admin");
  return { success: true, data: { redirectUrl: "/admin" } };
}

export async function logoutAdminAction(): Promise<void> {
  const session = await getCurrentSession();
  if (session) {
    deleteSession(session.token);
  }
  await clearSessionCookie();
  revalidatePath("/admin/login");
  redirect("/admin/login");
}

// ---------------------------------------------------------------------------
// Profile Actions
// ---------------------------------------------------------------------------

export async function updateStudentProfileAction(
  rawInput: unknown
): Promise<ActionResult<User>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "You must be logged in to update your profile." };
  }

  const parsed = studentProfileSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }

  const updated = updateUserProfile(user.id, parsed.data);
  if (!updated) {
    return { success: false, error: "User account could not be found." };
  }

  revalidatePath("/student/profile");
  revalidatePath("/student/dashboard");
  return { success: true, data: updated };
}

// ---------------------------------------------------------------------------
// Test Attempt Persistence Action
// ---------------------------------------------------------------------------

export async function recordTestAttemptAction(input: {
  testId?: string;
  examId: string;
  subjectId: string;
  topicId?: string;
  selectedAnswers: Record<string, string>;
  score: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  percentage: number;
  questionResults: TestAttempt["questionResults"];
}): Promise<ActionResult<TestAttempt>> {
  const user = await getCurrentUser();
  if (!user || user.role !== "student") {
    return {
      success: false,
      error: "You must be signed in as a student to record test attempts.",
    };
  }

  // If a testId is specified, verify it exists and is published
  let test = null;
  if (input.testId && input.testId !== "practice-quiz") {
    test = getTestById(input.testId);
    if (!test || test.status !== "published") {
      return {
        success: false,
        error: "The requested test is not currently available for submission.",
      };
    }
  }

  // Resolve titles
  const exam = getExamById(input.examId);
  const subject = getSubjectById(input.subjectId);
  const topic = input.topicId ? getTopicById(input.topicId) : null;

  const now = new Date().toISOString();

  // Create attempt strictly bound to the authenticated student's ID
  const attempt = createTestAttempt({
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
    score: input.score,
    totalQuestions: input.totalQuestions,
    correctCount: input.correctCount,
    incorrectCount: input.incorrectCount,
    unattemptedCount: input.unattemptedCount,
    percentage: input.percentage,
    questionResults: input.questionResults,
    startedAt: now,
    completedAt: now,
    status: "completed",
  });

  safeRevalidate("/student/dashboard");
  safeRevalidate("/student/attempts");

  return { success: true, data: attempt };
}
