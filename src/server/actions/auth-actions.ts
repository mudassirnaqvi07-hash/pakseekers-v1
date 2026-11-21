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
  resendStudentVerificationOtp,
  verifyEmailToken,
  verifyStudentOtp,
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
  verifyOtpSchema,
  resendOtpSchema,
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
        isEmailUnverified: authResult.failure.isEmailUnverified,
        unverifiedEmail: authResult.failure.unverifiedEmail,
        retryAfterSeconds: authResult.failure.retryAfterSeconds,
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
): Promise<ActionResult<{ email: string; emailSent: boolean; message: string; redirectUrl?: string }>> {
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
  } = parsed.data;

  try {
    // 1. Session fixation defense: invalidate existing session & cookie
    const currentSession = await getCurrentSession();
    if (currentSession) {
      await invalidateSession(currentSession.token);
    }
    await clearSessionCookie();

    // 2. Register via auth-service (creates student account with isEmailVerified: false, sends verification email)
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

    // Important: Do NOT create or set a session cookie! The student must verify email first.
    let message: string;
    if (result.message) {
      message = result.message;
    } else if (result.emailSent) {
      message = "Account created successfully! We have sent a 6-digit verification code to your email address.";
    } else {
      message = "Account created! However, we were unable to deliver the verification code right now. Please request a new code.";
    }

    const redirectUrl = `/verify-email?email=${encodeURIComponent(result.user.email)}&registered=true`;

    return {
      success: true,
      data: {
        email: result.user.email,
        emailSent: result.emailSent,
        message,
        redirectUrl,
      },
    };
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

/**
 * Verifies a student email address with a 6-digit OTP code.
 */
export async function verifyOtpAction(
  rawInput: unknown
): Promise<ActionResult<{ message: string; redirectUrl: string }>> {
  try {
    const parsed = verifyOtpSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid verification code format.",
      };
    }

    const { email, otp } = parsed.data;
    const result = await verifyStudentOtp(email, otp);
    if (!result.success) {
      return {
        success: false,
        error: result.message,
        reason: result.reason,
        remainingAttempts: result.remainingAttempts,
      };
    }

    safeRevalidate("/student/login");
    safeRevalidate("/verify-email");

    return {
      success: true,
      data: {
        message: result.message,
        redirectUrl: "/student/login?verified=true",
      },
    };
  } catch (err) {
    console.error("Failed to verify OTP:", err);
    return {
      success: false,
      error: "Unable to complete verification right now. Please try again.",
    };
  }
}

/**
 * Resends a 6-digit verification OTP for an unverified student account.
 */
export async function resendOtpAction(
  rawInput: unknown
): Promise<ActionResult<{ message: string; cooldownSeconds: number }>> {
  try {
    const inputObj = typeof rawInput === "string" ? { email: rawInput } : rawInput;
    const parsed = resendOtpSchema.safeParse(inputObj);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Please enter a valid email address.",
      };
    }

    const { email } = parsed.data;
    const result = await resendStudentVerificationOtp(email);
    if (!result.success) {
      return {
        success: false,
        error: result.message,
        retryAfterSeconds: result.retryAfterSeconds,
      };
    }

    return {
      success: true,
      data: {
        message: result.message,
        cooldownSeconds: result.cooldownSeconds ?? 60,
      },
    };
  } catch (err) {
    console.error("Failed to resend OTP:", err);
    return {
      success: false,
      error: "Unable to send verification code. Please try again shortly.",
    };
  }
}

/**
 * Backward-compatible wrapper for resending verification code.
 */
export async function resendVerificationAction(
  email: string
): Promise<ActionResult<{ message: string; cooldownSeconds?: number }>> {
  return resendOtpAction({ email });
}

/**
 * Backward-compatible endpoint for link-based verification attempts.
 */
export async function verifyEmailTokenAction(
  token: string
): Promise<ActionResult<{ message: string }>> {
  try {
    const result = await verifyEmailToken(token);
    if (!result.success) {
      return {
        success: false,
        error: result.message,
      };
    }

    return {
      success: true,
      data: { message: result.message },
    };
  } catch (err) {
    console.error("Failed to verify email token:", err);
    return {
      success: false,
      error: "Unable to complete verification right now. Please try again.",
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

  if ((user.status || "").toLowerCase() === "suspended") {
    return { success: false, error: "Your account has been suspended by an administrator." };
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
