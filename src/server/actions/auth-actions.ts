"use server";

/**
 * Authentication & Student Profile Server Actions — PakSeekers Phase 2.
 *
 * Implements authoritative mutation actions for student registration, login,
 * logout, and profile management, consuming the application auth-service.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionResult, SafeUser } from "@/types";
import {
  authenticateCredentials,
  registerNewStudent,
  invalidateSession,
  updateProfile,
} from "@/server/services/auth-service";
import {
  setSessionCookie,
  clearSessionCookie,
  getCurrentSession,
  getCurrentUser,
  isSafeStudentCallbackUrl,
} from "@/server/auth/session";
import { getAdminEntryPath } from "@/lib/config/admin-path";
import {
  loginSchema,
  studentRegisterSchema,
  studentProfileSchema,
} from "@/lib/validations/auth";

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
  try {
    const parsed = loginSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid email or password.",
      };
    }

    const { email, password, callbackUrl } = parsed.data;

    // 1. Authoritative authentication via auth-service (rate limited, scrypt verification)
    const authResult = await authenticateCredentials(email, password, "student");
    if (!authResult.success) {
      return {
        success: false,
        error: authResult.failure.error,
      };
    }

    // 2. Session fixation defense: invalidate any prior session before setting cookie
    const existingSession = await getCurrentSession();
    if (existingSession) {
      await invalidateSession(existingSession.token);
    }

    // 3. Set secure HTTP-only cookie with the fresh session token
    const cookieSet = await setSessionCookie(authResult.data.session.token);
    if (!cookieSet) {
      console.warn("Unable to set session cookie in current request context.");
    }

    safeRevalidate("/student/dashboard");
    safeRevalidate("/");

    const destination =
      callbackUrl && isSafeStudentCallbackUrl(callbackUrl)
        ? callbackUrl.trim()
        : "/student/dashboard";

    return { success: true, data: { redirectUrl: destination } };
  } catch (err) {
    console.error("Student login failed:", err);
    return {
      success: false,
      error: "Unable to sign in right now. Please try again.",
    };
  }
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

  try {
    // 1. Session fixation defense: invalidate existing session & cookie
    const currentSession = await getCurrentSession();
    if (currentSession) {
      await invalidateSession(currentSession.token);
    }
    await clearSessionCookie();

    // 2. Register via auth-service (strictly enforces role as student, hashes password)
    const result = await registerNewStudent({
      name,
      email,
      password,
      profile: {
        educationLevel,
        institution,
        targetExam,
        phone,
      },
    });

    // 3. Issue session cookie
    await setSessionCookie(result.session.token);

    safeRevalidate("/student/dashboard");
    safeRevalidate("/");

    const destination =
      callbackUrl && isSafeStudentCallbackUrl(callbackUrl)
        ? callbackUrl.trim()
        : "/student/dashboard";

    return { success: true, data: { redirectUrl: destination } };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg.includes("already registered") || errorMsg.includes("already exists")) {
      return { success: false, error: "This email is already registered." };
    }
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
    await invalidateSession(session.token);
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
      error: "Invalid email or password.",
    };
  }

  const { email, password } = parsed.data;

  try {
    // 1. Authoritative authentication via auth-service (rate limited, scrypt verification, admin role enforced)
    const authResult = await authenticateCredentials(email, password, "admin");
    if (!authResult.success) {
      return {
        success: false,
        error: authResult.failure.error,
      };
    }

    // 2. Session fixation defense
    const existingSession = await getCurrentSession();
    if (existingSession) {
      await invalidateSession(existingSession.token);
    }

    // 3. Set secure HTTP-only cookie
    const cookieSet = await setSessionCookie(authResult.data.session.token);
    if (!cookieSet) {
      throw new Error("Unable to establish admin session.");
    }

    revalidatePath("/admin/dashboard");
    return { success: true, data: { redirectUrl: "/admin/dashboard" } };
  } catch (error) {
    console.error("Admin login failed:", error);
    return {
      success: false,
      error: "Unable to sign in right now. Please try again.",
    };
  }
}

export async function logoutAdminAction(): Promise<void> {
  const session = await getCurrentSession();
  if (session) {
    await invalidateSession(session.token);
  }
  await clearSessionCookie();
  const entryPath = getAdminEntryPath();
  revalidatePath(entryPath);
  redirect(entryPath);
}

// ---------------------------------------------------------------------------
// Profile Actions
// ---------------------------------------------------------------------------

export async function updateStudentProfileAction(
  rawInput: unknown
): Promise<ActionResult<SafeUser>> {
  const user = await getCurrentUser();
  if (!user || user.role !== "student") {
    return { success: false, error: "You must be logged in as a student to update your profile." };
  }

  const parsed = studentProfileSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }

  const updated = await updateProfile(user.id, parsed.data);
  if (!updated) {
    return { success: false, error: "User account could not be found." };
  }

  revalidatePath("/student/profile");
  revalidatePath("/student/dashboard");
  return { success: true, data: updated };
}
