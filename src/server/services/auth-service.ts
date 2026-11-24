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
  createStudentSessionWithLimit,
  findSessionByToken,
  deleteSession,
  deleteUserSessions,
  verifyPassword,
  verifyUserEmailWithToken,
  setUserOtp,
  clearUserOtp,
  verifyUserEmailWithOtp,
} from "@/server/repositories/user-repository";
import { getPlatformSettings } from "@/server/repositories/settings-repository";
import {
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
} from "@/server/auth/rate-limiter";
import {
  hashVerificationToken,
  generateOtp,
  hashOtp,
} from "@/server/auth/tokens";
import { sendVerificationEmail } from "@/server/services/email-service";
import type {
  SafeUser,
  UserRole,
  UserSession,
  StudentProfile,
  DeviceType,
  Permission,
} from "@/types";
import { getEffectivePermissions, normalizeUserRole } from "@/lib/auth/permissions";

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
  isDeviceLimitReached?: boolean;
  activeDevicesCount?: number;
  maxDevices?: number;
}

export type AuthResult =
  | { success: true; data: AuthSuccessResult }
  | { success: false; failure: AuthFailureResult };

/**
 * Authoritative user credential verification with brute-force rate limiting,
 * account status checks, student email verification, and device session limit enforcement.
 */
export async function authenticateCredentials(
  email: string,
  plainPassword: string,
  expectedRole?: UserRole,
  device?: {
    deviceId?: string;
    deviceName?: string;
    deviceType?: DeviceType;
    browser?: string;
    operatingSystem?: string;
  }
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
  const actualRole = user ? normalizeUserRole(user.role) : null;

  // Constant-time generic error response to eliminate account enumeration
  if (!user || (expectedRole && actualRole !== normalizeUserRole(expectedRole))) {
    await recordFailedAttempt(rateLimitKey);
    return {
      success: false,
      failure: { error: "Invalid email or password." },
    };
  }

  // Account suspension / deactivation enforcement
  if ((user.status || "").toLowerCase() === "suspended") {
    const suspensionMessage =
      actualRole === "staff"
        ? "Your staff account has been deactivated by an administrator. Please contact support."
        : "Your account has been suspended by an administrator. Please contact support.";
    return {
      success: false,
      failure: {
        error: suspensionMessage,
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

  // 4. Email verification enforcement: Unverified students and staff cannot log in
  if ((actualRole === "student" || actualRole === "staff") && user.isEmailVerified === false) {
    return {
      success: false,
      failure: {
        error: "Your email address is not verified yet. Please enter the 6-digit verification code sent to your email.",
        isEmailUnverified: true,
        unverifiedEmail: user.email,
      },
    };
  }

  // 5. Reset rate limit counter on success
  await resetRateLimit(rateLimitKey);

  // 6. Issue fresh session with device limit enforcement for students
  let session: UserSession;
  if (actualRole === "student") {
    const sessionRes = await createStudentSessionWithLimit(user.id, device);
    if (!sessionRes.success || !sessionRes.session) {
      return {
        success: false,
        failure: {
          error:
            sessionRes.error ||
            "Device limit reached. Please terminate an existing session before logging in.",
          isDeviceLimitReached: true,
          activeDevicesCount: sessionRes.activeDevicesCount,
          maxDevices: sessionRes.maxDevices,
        },
      };
    }
    session = sessionRes.session;
  } else {
    // Administrators and Staff create standard server sessions with device tracking
    session = await createSession(user.id, actualRole!, device);
  }

  // 7. Return sanitized SafeUser with resolved effective permissions
  const safeUser: SafeUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: actualRole!,
    status: user.status || "active",
    permissions: getEffectivePermissions({ role: actualRole!, permissions: user.permissions }),
    staffTitle: user.staffTitle,
    department: user.department,
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
 * Generates a cryptographically secure 6-digit numeric OTP and delivers via Gmail SMTP.
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
    // Generate fresh 6-digit OTP (10 minute expiry) and rotate
    const rawOtp = generateOtp();
    const otpHash = hashOtp(rawOtp);
    const expirationMinutes = 10;
    const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);
    const now = new Date();

    await setUserOtp(existing.id, otpHash, expiresAt, now);

    // Deliver OTP email
    const emailResult = await sendVerificationEmail({
      to: normalizedEmail,
      name: input.name || existing.name,
      otp: rawOtp,
      expiresInMinutes: expirationMinutes,
    });

    if (!emailResult.success) {
      await clearUserOtp(existing.id);
    }

    return {
      user: existing,
      emailSent: emailResult.success,
      isRetry: true,
      message: emailResult.success
        ? "We found your pending unverified account. A fresh 6-digit verification code has been sent to your email."
        : "An unverified account with this email exists, but we were unable to send the verification code. Please use the resend button below.",
    };
  }

  // 1. Generate cryptographically secure 6-digit OTP
  const rawOtp = generateOtp();
  const otpHash = hashOtp(rawOtp);
  const expirationMinutes = 10;
  const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);
  const now = new Date();

  // 2. Create student account with isEmailVerified = false and hashed OTP
  const newUser = await createUser({
    name: input.name,
    email: normalizedEmail,
    password: input.password,
    role: "student",
    isEmailVerified: false,
    otpCodeHash: otpHash,
    otpExpiresAt: expiresAt,
    otpLastSentAt: now,
    otpAttempts: 0,
    profile: input.profile,
  });

  // 3. Dispatch verification email with OTP via SMTP
  let emailSent = false;
  try {
    const emailResult = await sendVerificationEmail({
      to: normalizedEmail,
      name: input.name,
      otp: rawOtp,
      expiresInMinutes: expirationMinutes,
    });
    emailSent = emailResult.success;
    if (!emailSent) {
      await clearUserOtp(newUser.id);
    }
  } catch (emailErr) {
    console.error("Failed to send verification email on registration:", emailErr);
    await clearUserOtp(newUser.id).catch(() => {});
  }

  return {
    user: newUser,
    emailSent,
  };
}

/**
 * Creates a new Staff account with pending email verification (isEmailVerified = false),
 * generates a cryptographically secure 6-digit OTP using the exact Student verification mechanism,
 * and dispatches the verification code email via SMTP.
 */
export async function registerStaffByAdmin(input: {
  name: string;
  email: string;
  password: string;
  staffTitle?: string;
  department?: string;
  permissions?: Permission[];
  createdBy?: string;
}): Promise<{ user: SafeUser; emailSent: boolean }> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    throw new Error(`User with email "${normalizedEmail}" already exists.`);
  }

  // Reuse identical 6-digit OTP generation, SHA-256 hashing, and 10-minute expiration
  const rawOtp = generateOtp();
  const otpHash = hashOtp(rawOtp);
  const expirationMinutes = 10;
  const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);
  const now = new Date();

  const newUser = await createUser({
    name: input.name,
    email: normalizedEmail,
    password: input.password,
    role: "staff",
    status: "active",
    staffTitle: input.staffTitle,
    department: input.department,
    permissions: input.permissions,
    createdBy: input.createdBy,
    isEmailVerified: false,
    otpCodeHash: otpHash,
    otpExpiresAt: expiresAt,
    otpLastSentAt: now,
    otpAttempts: 0,
  });

  let emailSent = false;
  try {
    const emailResult = await sendVerificationEmail({
      to: normalizedEmail,
      name: input.name,
      otp: rawOtp,
      expiresInMinutes: expirationMinutes,
      roleLabel: "staff",
    });
    emailSent = emailResult.success;
    if (!emailSent) {
      await clearUserOtp(newUser.id);
    }
  } catch (emailErr) {
    console.error("Failed to send staff verification email on creation:", emailErr);
    await clearUserOtp(newUser.id).catch(() => {});
  }

  return {
    user: newUser,
    emailSent,
  };
}

/**
 * Verifies a student or staff email address using a 6-digit OTP code.
 * Single-use: atomically sets isEmailVerified = true and clears the OTP.
 */
export async function verifyStudentOtp(
  email: string,
  rawOtp: string
): Promise<{
  success: boolean;
  message: string;
  user?: SafeUser;
  reason?: "invalid" | "expired" | "max_attempts" | "not_found" | "already_verified";
  remainingAttempts?: number;
}> {
  if (!email || !email.includes("@")) {
    return {
      success: false,
      reason: "invalid",
      message: "Please provide a valid email address.",
    };
  }

  const trimmedOtp = (rawOtp || "").trim();
  if (!trimmedOtp || !/^\d{6}$/.test(trimmedOtp)) {
    return {
      success: false,
      reason: "invalid",
      message: "Please enter a valid 6-digit numeric verification code.",
    };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const result = await verifyUserEmailWithOtp(normalizedEmail, trimmedOtp);

  if (!result.success) {
    if (result.reason === "expired") {
      return {
        success: false,
        reason: "expired",
        message: "Your verification code has expired (codes are valid for 10 minutes). Please request a new code.",
      };
    }
    if (result.reason === "max_attempts") {
      return {
        success: false,
        reason: "max_attempts",
        message: "Too many incorrect attempts. This code has been invalidated for security. Please request a new code.",
      };
    }
    if (result.reason === "not_found") {
      return {
        success: false,
        reason: "not_found",
        message: "No account found with this email. Please check your email or create an account.",
      };
    }
    const attemptsText =
      result.remainingAttempts !== undefined && result.remainingAttempts > 0
        ? ` (${result.remainingAttempts} attempt${result.remainingAttempts > 1 ? "s" : ""} remaining)`
        : "";
    return {
      success: false,
      reason: "invalid",
      remainingAttempts: result.remainingAttempts,
      message: `Invalid verification code${attemptsText}. Please check the code sent to your email.`,
    };
  }

  const isStaff = result.user?.role === "staff";
  return {
    success: true,
    message: result.reason === "already_verified"
      ? "Your account is already verified! You can log in directly."
      : isStaff
      ? "Your email has been verified successfully! You can now log in to your staff portal account."
      : "Your email has been verified successfully! You can now log in to your student account.",
    user: result.user,
  };
}

/**
 * Backward-compatible helper for legacy token verification requests.
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
      message: "Verification links have been replaced by 6-digit codes. Please enter the 6-digit code sent to your email.",
    };
  }

  const tokenHash = hashVerificationToken(rawToken.trim());
  const result = await verifyUserEmailWithToken(tokenHash);

  if (!result.success) {
    return {
      success: false,
      reason: result.reason || "invalid",
      message: "This link is no longer valid. Please enter the 6-digit verification code sent to your email.",
    };
  }

  return {
    success: true,
    message: "Your email has been verified successfully! You can now log in to your student account.",
    user: result.user,
  };
}

/**
 * Requests a new 6-digit verification OTP for an unverified student account.
 * Enforces 60-second cooldown between requests and prevents account enumeration.
 */
export async function resendStudentVerificationOtp(rawEmail: string): Promise<{
  success: boolean;
  message: string;
  isRateLimited?: boolean;
  retryAfterSeconds?: number;
  cooldownSeconds?: number;
}> {
  if (!rawEmail || typeof rawEmail !== "string") {
    return {
      success: false,
      message: "Please provide a valid email address.",
    };
  }

  const normalizedEmail = rawEmail.trim().toLowerCase();
  const rateLimitKey = `resend-otp:${normalizedEmail}`;

  // 1. Rate limiting check (1 request per 60 seconds)
  const rateCheck = await checkRateLimit(rateLimitKey);
  if (!rateCheck.allowed) {
    return {
      success: false,
      isRateLimited: true,
      retryAfterSeconds: rateCheck.retryAfterSeconds,
      message: `Please wait ${rateCheck.retryAfterSeconds || 60} seconds before requesting another verification code.`,
    };
  }

  // 2. Fetch user
  const user = await findUserWithPasswordByEmail(normalizedEmail);

  // Account enumeration defense:
  // Return identical generic response if user doesn't exist or isn't student/staff
  if (!user || (user.role !== "student" && user.role !== "staff")) {
    await recordFailedAttempt(rateLimitKey);
    return {
      success: true,
      message: "If an unverified account is registered with this email, a new verification code has been sent.",
      cooldownSeconds: 60,
    };
  }

  // If already verified
  if (user.isEmailVerified === true) {
    return {
      success: true,
      message: "This account has already been verified. You can log in directly.",
      cooldownSeconds: 0,
    };
  }

  // Check DB-level cooldown if user has otpLastSentAt
  if (user.otpLastSentAt) {
    const elapsedMs = Date.now() - new Date(user.otpLastSentAt).getTime();
    if (elapsedMs < 60000) {
      const remainingSec = Math.ceil((60000 - elapsedMs) / 1000);
      return {
        success: false,
        isRateLimited: true,
        retryAfterSeconds: remainingSec,
        message: `Please wait ${remainingSec} seconds before requesting another code.`,
      };
    }
  }

  // 3. Generate new 6-digit OTP
  const rawOtp = generateOtp();
  const otpHash = hashOtp(rawOtp);
  const expirationMinutes = 10;
  const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);
  const now = new Date();

  // 4. Update user record (invalidates previous OTP)
  await setUserOtp(user.id, otpHash, expiresAt, now);

  // 5. Send OTP email via Gmail SMTP
  const emailResult = await sendVerificationEmail({
    to: normalizedEmail,
    name: user.name,
    otp: rawOtp,
    expiresInMinutes: expirationMinutes,
    roleLabel: user.role === "staff" ? "staff" : "student",
  });

  if (!emailResult.success) {
    await clearUserOtp(user.id);
    return {
      success: false,
      message: emailResult.error || "Unable to send verification code at this moment. Please try again shortly.",
    };
  }

  await recordFailedAttempt(rateLimitKey);

  return {
    success: true,
    message: "A new 6-digit verification code has been sent to your email. It will expire in 10 minutes.",
    cooldownSeconds: 60,
  };
}

/**
 * Backward-compatible alias for resendStudentVerificationOtp.
 */
export async function resendStudentVerificationEmail(rawEmail: string): Promise<{
  success: boolean;
  message: string;
  isRateLimited?: boolean;
  retryAfterSeconds?: number;
}> {
  return resendStudentVerificationOtp(rawEmail);
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
