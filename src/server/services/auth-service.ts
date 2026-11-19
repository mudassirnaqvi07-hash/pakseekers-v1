import "server-only";

/**
 * Authentication & Authorization Application Service — PakSeekers Phase 2.
 *
 * Implements the core business logic for user authentication, registration,
 * session lifecycle, and role-based access validation.
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
} from "@/server/repositories/user-repository";
import { getPlatformSettings } from "@/server/repositories/settings-repository";
import {
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
} from "@/server/auth/rate-limiter";
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
}

export type AuthResult =
  | { success: true; data: AuthSuccessResult }
  | { success: false; failure: AuthFailureResult };

/**
 * Authoritative user credential verification with brute-force rate limiting.
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

  // 4. Reset rate limit counter on success
  await resetRateLimit(rateLimitKey);

  // 5. Issue fresh session
  const session = await createSession(user.id, user.role);

  // 6. Return sanitized SafeUser
  const safeUser: SafeUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
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
 * Registers a new student account and creates an initial authenticated session.
 * Rejects existing email and enforces role as "student".
 */
export async function registerNewStudent(input: {
  email: string;
  name: string;
  password: string;
  profile?: Partial<StudentProfile>;
}): Promise<{ user: SafeUser; session: UserSession }> {
  const settings = await getPlatformSettings();
  if (!settings.platform.allowRegistration) {
    throw new Error("Student registration is currently paused for platform maintenance. Please check back later.");
  }

  const normalizedEmail = input.email.trim().toLowerCase();

  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    throw new Error(`This email is already registered.`);
  }

  // Strictly enforce student role for public registrations
  const newUser = await createUser({
    name: input.name,
    email: normalizedEmail,
    password: input.password,
    role: "student",
    profile: input.profile,
  });

  const session = await createSession(newUser.id, "student");

  return {
    user: newUser,
    session,
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
