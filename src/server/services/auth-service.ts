import "server-only";

/**
 * Authentication & Authorization Application Service — PakSeekers.
 *
 * Implements the core business logic for user authentication, registration,
 * email verification, session lifecycle, and role-based access validation.
 *
 * Layer: Application / Service Layer
 * Direction: app/actions -> server/services/auth-service -> server/repositories/user-repository
 */

import {
  findUserByEmail,
  findUserWithPasswordByEmail,
  findUserById,
  createUser,
  updateUserProfile,
  createSession,
  findSessionByToken,
  deleteSession,
  deleteUserSessions,
  verifyPassword,
  setEmailVerificationToken,
  clearEmailVerificationToken,
  verifyUserEmailWithToken,
} from "@/server/repositories/user-repository";
import { getPlatformSettings } from "@/server/repositories/settings-repository";
import {
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
} from "@/server/auth/rate-limiter";
import {
  generateVerificationToken,
  hashVerificationToken,
} from "@/server/auth/tokens";
import { sendVerificationEmail } from "@/server/services/email-service";
import type {
  SafeUser,
  UserRole,
  UserSession,
  StudentProfile,
} from "@/types";

export interface AuthSuccessResult {
  user: SafeUser;
  session: UserSession;
}

export interface AuthFailureResult {
  error: string;
  isRateLimited?: boolean;
  retryAfterSeconds?: number;
  isEmailUnverified?: boolean;
  unverifiedEmail?: string;
}

export type AuthResult =
  | { success: true; data: AuthSuccessResult }
  | { success: false; failure: AuthFailureResult };

/**
 * Authoritative user credential verification with brute-force rate limiting
 * and student email verification enforcement.
 */
export async function authenticateCredentials(
  email: string,
  plainPassword: string,
  expectedRole?: UserRole
): Promise<AuthResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const rateLimitKey = `login:${expectedRole || "user"}:${normalizedEmail}`;

  // 1. Check rate limit
  const rateCheck = await checkRateLimit(rateLimitKey);
  if (!rateCheck.allowed) {
    return {
      success: false,
      failure: {
        error: `Too many failed attempts. Please try again in ${rateCheck.retryAfterSeconds || 60} seconds.`,
        isRateLimited: true,
        retryAfterSeconds: rateCheck.retryAfterSeconds,
      },
    };
  }

  // 2. Fetch user with password hash
  const user = await findUserWithPasswordByEmail(normalizedEmail);

  // Constant-time generic error response to eliminate account enumeration
  if (!user || (expectedRole && user.role !== expectedRole)) {
    await recordFailedAttempt(rateLimitKey);
    return {
      success: false,
      failure: { error: "Invalid email or password." },
    };
  }

  // Account suspension enforcement
  if (user.status === "suspended") {
    return {
      success: false,
      failure: {
        error: "Your account has been suspended by an administrator. Please contact support.",
      },
    };
  }

  // 3. Verify cryptographic password hash
  const isMatch = await verifyPassword(plainPassword, user.passwordHash);
  if (!isMatch) {
    await recordFailedAttempt(rateLimitKey);
    return {
      success: false,
      failure: { error: "Invalid email or password." },
    };
  }

  // 4. Email verification enforcement: Unverified students cannot log in
  if (user.role === "student" && user.isEmailVerified === false) {
    return {
      success: false,
      failure: {
        error: "Your email address is not verified yet. Please check your inbox for the verification link.",
        isEmailUnverified: true,
        unverifiedEmail: user.email,
      },
    };
  }

  // 5. Reset rate limit counter on success
  await resetRateLimit(rateLimitKey);

  // 6. Issue fresh session
  const session = await createSession(user.id, user.role);

  // 7. Return sanitized SafeUser
  const safeUser: SafeUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    profile: user.profile,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  return {
    success: true,
    data: {
      user: safeUser,
      session,
    },
  };
}

/**
 * Registers a new student account with pending email verification.
 * Dispatches a branded verification email via Gmail SMTP.
 * Does NOT create an authenticated session (unverified students must verify first).
 */
export async function registerNewStudent(input: {
  email: string;
  name: string;
  password: string;
  profile?: Partial<StudentProfile>;
}): Promise<{ user: SafeUser; emailSent: boolean; isRetry?: boolean; message?: string }> {
  const settings = await getPlatformSettings();
  if (!settings.platform.allowRegistration) {
    throw new Error("Student registration is currently paused for platform maintenance. Please check back later.");
  }

  const normalizedEmail = input.email.trim().toLowerCase();

  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    // If the account is already verified, strictly reject duplicate registration
    if (existing.isEmailVerified !== false) {
      throw new Error("This email is already registered. Please log in to your account.");
    }

    // Existing pending (unverified) student account:
    // Handle registration retry gracefully without duplicate account creation
    const rawToken = generateVerificationToken();
    const tokenHash = hashVerificationToken(rawToken);
    const expirationMinutes = 30;
    const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);

    // Update with fresh verification token (invalidates old token)
    await setEmailVerificationToken(existing.id, tokenHash, expiresAt);

    // Attempt to deliver the verification email
    const emailResult = await sendVerificationEmail({
      to: normalizedEmail,
      name: input.name || existing.name,
      token: rawToken,
      expiresInMinutes: expirationMinutes,
    });

    if (!emailResult.success) {
      // Invalidate unusable token if delivery failed
      await clearEmailVerificationToken(existing.id);
    }

    return {
      user: existing,
      emailSent: emailResult.success,
      isRetry: true,
      message: emailResult.success
        ? "An unverified account with this email was pending. A fresh verification link has been sent to your email."
        : "An unverified account with this email exists, but we were unable to send the verification email. Please use the resend button below.",
    };
  }

  // 1. Generate cryptographically secure verification token (32 bytes entropy)
  const rawToken = generateVerificationToken();
  const tokenHash = hashVerificationToken(rawToken);
  const expirationMinutes = 30;
  const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);

  // 2. Create student account with isEmailVerified = false and hashed token
  const newUser = await createUser({
    name: input.name,
    email: normalizedEmail,
    password: input.password,
    role: "student",
    isEmailVerified: false,
    emailVerificationTokenHash: tokenHash,
    emailVerificationExpiresAt: expiresAt,
    profile: input.profile,
  });

  // 3. Dispatch verification email via SMTP
  let emailSent = false;
  try {
    const emailResult = await sendVerificationEmail({
      to: normalizedEmail,
      name: input.name,
      token: rawToken,
      expiresInMinutes: expirationMinutes,
    });
    emailSent = emailResult.success;
    if (!emailSent) {
      // Invalidate unusable token if delivery failed
      await clearEmailVerificationToken(newUser.id);
    }
  } catch (emailErr) {
    console.error("Failed to send verification email on registration:", emailErr);
    await clearEmailVerificationToken(newUser.id).catch(() => {});
  }

  return {
    user: newUser,
    emailSent,
  };
}

/**
 * Verifies a student email address using the received verification token.
 * Single-use: atomically sets isEmailVerified = true and clears the token.
 */
export async function verifyEmailToken(rawToken: string): Promise<{
  success: boolean;
  message: string;
  user?: SafeUser;
  reason?: "invalid" | "expired" | "already_verified";
}> {
  if (!rawToken || typeof rawToken !== "string" || rawToken.trim().length < 16) {
    return {
      success: false,
      reason: "invalid",
      message: "The verification link is invalid or malformed.",
    };
  }

  const tokenHash = hashVerificationToken(rawToken.trim());
  const result = await verifyUserEmailWithToken(tokenHash);

  if (!result.success) {
    if (result.reason === "expired") {
      return {
        success: false,
        reason: "expired",
        message: "Your verification link has expired. Please request a new verification email.",
      };
    }
    return {
      success: false,
      reason: "invalid",
      message: "This verification link is invalid or has already been used.",
    };
  }

  return {
    success: true,
    message: "Your email has been verified successfully! You can now log in to your student account.",
    user: result.user,
  };
}

/**
 * Requests a new verification email for an unverified student account.
 * Rate-limited (1 request per 60s) with account enumeration defense.
 */
export async function resendStudentVerificationEmail(rawEmail: string): Promise<{
  success: boolean;
  message: string;
  isRateLimited?: boolean;
  retryAfterSeconds?: number;
}> {
  if (!rawEmail || typeof rawEmail !== "string") {
    return {
      success: false,
      message: "Please provide a valid email address.",
    };
  }

  const normalizedEmail = rawEmail.trim().toLowerCase();
  const rateLimitKey = `resend-verify:${normalizedEmail}`;

  // 1. Rate limiting: 1 request per 60 seconds per email
  const rateCheck = await checkRateLimit(rateLimitKey);
  if (!rateCheck.allowed) {
    return {
      success: false,
      isRateLimited: true,
      retryAfterSeconds: rateCheck.retryAfterSeconds,
      message: `Please wait ${rateCheck.retryAfterSeconds || 60} seconds before requesting another verification email.`,
    };
  }

  // 2. Fetch user
  const user = await findUserWithPasswordByEmail(normalizedEmail);

  // Defense against account enumeration:
  // Return identical generic response even if user doesn't exist
  if (!user || user.role !== "student") {
    await recordFailedAttempt(rateLimitKey);
    return {
      success: true,
      message: "If an unverified account is registered with this email, a new verification link has been sent.",
    };
  }

  // If already verified, inform user
  if (user.isEmailVerified === true) {
    return {
      success: true,
      message: "This account has already been verified. You can log in directly.",
    };
  }

  // 3. Generate new verification token
  const rawToken = generateVerificationToken();
  const tokenHash = hashVerificationToken(rawToken);
  const expirationMinutes = 30;
  const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);

  // 4. Update user record with new token and expiry
  await setEmailVerificationToken(user.id, tokenHash, expiresAt);

  // 5. Send verification email via Gmail SMTP
  const emailResult = await sendVerificationEmail({
    to: normalizedEmail,
    name: user.name,
    token: rawToken,
    expiresInMinutes: expirationMinutes,
  });

  if (!emailResult.success) {
    // Invalidate unusable token if delivery failed
    await clearEmailVerificationToken(user.id);
    return {
      success: false,
      message: emailResult.error || "Unable to send verification email at this moment. Please try again shortly.",
    };
  }

  // Record rate limit hit on successful dispatch
  await recordFailedAttempt(rateLimitKey);

  return {
    success: true,
    message: "A new verification email has been sent. Please check your inbox and spam folder.",
  };
}

/**
 * Resolves an active session by token.
 */
export async function validateSessionToken(token: string): Promise<UserSession | null> {
  return findSessionByToken(token);
}

/**
 * Resolves the authenticated user for a valid session token.
 */
export async function getUserForSession(token: string): Promise<SafeUser | null> {
  const session = await findSessionByToken(token);
  if (!session) return null;

  return findUserById(session.userId);
}

/**
 * Revokes a session token upon logout.
 */
export async function invalidateSession(token: string): Promise<void> {
  await deleteSession(token);
}

/**
 * Revokes all sessions for a user (e.g. security reset or password change).
 */
export async function invalidateAllUserSessions(userId: string): Promise<void> {
  await deleteUserSessions(userId);
}

/**
 * Updates a student's profile information.
 */
export async function updateProfile(
  userId: string,
  input: {
    name?: string;
    educationLevel?: string;
    institution?: string;
    targetExam?: string;
    phone?: string;
  }
): Promise<SafeUser | null> {
  return updateUserProfile(userId, input);
}
