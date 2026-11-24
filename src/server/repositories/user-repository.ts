import "server-only";

/**
 * MongoDB User, Session & Attempt Repository — PakSeekers Phase 1.
 *
 * Implements persistent storage in MongoDB Atlas for:
 *   - Users (Student and Admin accounts)
 *   - Sessions (HTTP-only secure token sessions)
 *   - Test Attempts & Results (Evaluated quiz attempts and performance logs)
 */

import { type ClientSession, ObjectId } from "mongodb";
import {
  getMongoDb,
  getMongoClient,
  COLLECTIONS,
  toDomainEntity,
  toSafeUser,
  toDomainEntities,
  type UserDoc,
  type SessionDoc,
  type TestAttemptDoc,
  type StudentEnrollmentDoc,
  type QuestionReportDoc,
} from "@/server/db";
import { resetRateLimit } from "@/server/auth/rate-limiter";
import {
  hashPassword,
  verifyPassword,
  hashPasswordSync,
  verifyPasswordSync,
} from "@/server/auth/password";
import { generateSessionToken, hashSessionToken, verifyOtpHash } from "@/server/auth/tokens";
import type {
  SafeUser,
  User,
  UserRole,
  UserSession,
  TestAttempt,
  StudentProfile,
  StudentDashboardStats,
  SubjectProgress,
  WeakAreaItem,
  DeviceType,
  TestPerformanceInsights,
  Permission,
} from "@/types";
import { sanitizeStaffPermissions } from "@/lib/auth/permissions";

// Re-export password helpers for convenience
export { hashPassword, verifyPassword, hashPasswordSync, verifyPasswordSync };

// ---------------------------------------------------------------------------
// User Operations
// ---------------------------------------------------------------------------

/**
 * Finds a user by email, returning a sanitized SafeUser (without passwordHash).
 */
export async function findUserByEmail(email: string): Promise<SafeUser | null> {
  if (!email) return null;
  const db = await getMongoDb();
  const normalized = email.trim().toLowerCase();
  const doc = await db.collection<UserDoc>(COLLECTIONS.USERS).findOne({ email: normalized });
  return toSafeUser(doc);
}

/**
 * Internal authentication helper: finds a user by email including their passwordHash.
 * NEVER return the result of this function to client components or public APIs.
 */
export async function findUserWithPasswordByEmail(email: string): Promise<User | null> {
  if (!email) return null;
  const db = await getMongoDb();
  const normalized = email.trim().toLowerCase();
  const doc = await db.collection<UserDoc>(COLLECTIONS.USERS).findOne({ email: normalized });
  return doc ? toDomainEntity<User>(doc) : null;
}

export async function findAdminUserByEmail(email: string): Promise<SafeUser | null> {
  return findUserByEmail(email);
}

/**
 * Finds a user by ID, returning a sanitized SafeUser (without passwordHash).
 */
export async function findUserById(id: string): Promise<SafeUser | null> {
  if (!id) return null;
  const db = await getMongoDb();
  const doc = await db.collection<UserDoc>(COLLECTIONS.USERS).findOne({ id });
  return toSafeUser(doc);
}

/**
 * Internal helper: finds a user by ID including their passwordHash.
 */
export async function findUserWithPasswordById(id: string): Promise<User | null> {
  if (!id) return null;
  const db = await getMongoDb();
  const doc = await db.collection<UserDoc>(COLLECTIONS.USERS).findOne({ id });
  return doc ? toDomainEntity<User>(doc) : null;
}

export async function createUser(input: {
  email: string;
  name: string;
  password: string;
  role?: UserRole;
  status?: "active" | "suspended";
  permissions?: Permission[];
  staffTitle?: string;
  department?: string;
  createdBy?: string;
  isEmailVerified?: boolean;
  otpCodeHash?: string | null;
  otpExpiresAt?: Date | string | null;
  otpLastSentAt?: Date | string | null;
  otpAttempts?: number;
  emailVerificationTokenHash?: string | null;
  emailVerificationExpiresAt?: Date | string | null;
  profile?: Partial<StudentProfile>;
}): Promise<SafeUser> {
  const db = await getMongoDb();
  const normalizedEmail = input.email.trim().toLowerCase();

  const existing = await db.collection<UserDoc>(COLLECTIONS.USERS).findOne({
    email: normalizedEmail,
  });

  if (existing) {
    throw new Error(`User with email "${normalizedEmail}" already exists.`);
  }

  const hashedPassword = await hashPassword(input.password);
  const now = new Date().toISOString();
  const targetRole: UserRole = input.role || "student";
  const isStudent = targetRole === "student";
  const newUserDoc: UserDoc = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    email: normalizedEmail,
    name: input.name.trim(),
    role: targetRole,
    status: input.status || "active",
    ...(targetRole === "staff"
      ? {
          permissions: sanitizeStaffPermissions(input.permissions),
          staffTitle: input.staffTitle?.trim() || "Academic Coordinator",
          department: input.department?.trim() || "Content & Curriculum",
          ...(input.createdBy ? { createdBy: input.createdBy } : {}),
        }
      : {}),
    passwordHash: hashedPassword,
    // By default, students must verify email unless explicitly set (e.g. seed data/admin)
    isEmailVerified: input.isEmailVerified !== undefined ? input.isEmailVerified : !isStudent,
    otpCodeHash: input.otpCodeHash || null,
    otpExpiresAt: input.otpExpiresAt || null,
    otpLastSentAt: input.otpLastSentAt || null,
    otpAttempts: input.otpAttempts ?? 0,
    emailVerificationTokenHash: input.emailVerificationTokenHash || null,
    emailVerificationExpiresAt: input.emailVerificationExpiresAt || null,
    profile: {
      educationLevel: input.profile?.educationLevel || "FSc Pre-Medical",
      institution: input.profile?.institution || "Not specified",
      targetExam: input.profile?.targetExam || "MDCAT",
      phone: input.profile?.phone || "",
    },
    createdAt: now,
    updatedAt: now,
  };

  try {
    await db.collection<UserDoc>(COLLECTIONS.USERS).insertOne(newUserDoc);
  } catch (err: unknown) {
    // Handle MongoDB duplicate key error code 11000
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: number }).code === 11000) {
      throw new Error(`User with email "${normalizedEmail}" already exists.`);
    }
    throw err;
  }

  const safe = toSafeUser(newUserDoc);
  if (!safe) throw new Error("Failed to create sanitized user record.");
  return safe;
}

/**
 * Sets or rotates the 6-digit verification OTP and expiration for a student account.
 */
export async function setUserOtp(
  userId: string,
  otpHash: string,
  expiresAt: Date,
  lastSentAt: Date = new Date()
): Promise<boolean> {
  const db = await getMongoDb();
  const res = await db.collection<UserDoc>(COLLECTIONS.USERS).updateOne(
    { id: userId },
    {
      $set: {
        otpCodeHash: otpHash,
        otpExpiresAt: expiresAt,
        otpLastSentAt: lastSentAt,
        otpAttempts: 0,
        emailVerificationTokenHash: null,
        emailVerificationExpiresAt: null,
        updatedAt: new Date().toISOString(),
      },
    }
  );
  return res.matchedCount > 0;
}

/**
 * Clears the verification OTP and expiration for a student account.
 */
export async function clearUserOtp(userId: string): Promise<boolean> {
  const db = await getMongoDb();
  const res = await db.collection<UserDoc>(COLLECTIONS.USERS).updateOne(
    { id: userId },
    {
      $set: {
        otpCodeHash: null,
        otpExpiresAt: null,
        otpAttempts: 0,
        emailVerificationTokenHash: null,
        emailVerificationExpiresAt: null,
        updatedAt: new Date().toISOString(),
      },
    }
  );
  return res.matchedCount > 0;
}

/**
 * Atomically verifies a user's email using the provided 6-digit OTP code.
 *
 * Enforces:
 * - Constant-time cryptographic comparison
 * - Expiration check (10 minutes)
 * - Maximum failed attempt enforcement (5 attempts max before locking OTP)
 * - Single-use atomic invalidation
 */
export async function verifyUserEmailWithOtp(
  email: string,
  rawOtp: string
): Promise<{
  success: boolean;
  user?: SafeUser;
  reason?: "invalid" | "expired" | "max_attempts" | "not_found" | "already_verified";
  remainingAttempts?: number;
}> {
  if (!email || !rawOtp || !/^\d{6}$/.test(rawOtp.trim())) {
    return { success: false, reason: "invalid" };
  }

  const db = await getMongoDb();
  const normalizedEmail = email.trim().toLowerCase();
  const user = await db
    .collection<UserDoc>(COLLECTIONS.USERS)
    .findOne({ email: normalizedEmail });

  if (!user) {
    return { success: false, reason: "not_found" };
  }

  if (user.isEmailVerified === true) {
    const safe = toSafeUser(user);
    return { success: true, reason: "already_verified", user: safe || undefined };
  }

  if (!user.otpCodeHash || !user.otpExpiresAt) {
    return { success: false, reason: "invalid" };
  }

  const now = new Date();
  const expiresAt = new Date(user.otpExpiresAt);
  if (expiresAt < now) {
    await clearUserOtp(user.id);
    return { success: false, reason: "expired" };
  }

  const currentAttempts = user.otpAttempts || 0;
  if (currentAttempts >= 5) {
    await clearUserOtp(user.id);
    return { success: false, reason: "max_attempts", remainingAttempts: 0 };
  }

  const isMatch = verifyOtpHash(rawOtp.trim(), user.otpCodeHash);
  if (!isMatch) {
    const newAttempts = currentAttempts + 1;
    if (newAttempts >= 5) {
      await clearUserOtp(user.id);
      return { success: false, reason: "max_attempts", remainingAttempts: 0 };
    }
    await db.collection<UserDoc>(COLLECTIONS.USERS).updateOne(
      { id: user.id },
      {
        $inc: { otpAttempts: 1 },
        $set: { updatedAt: now.toISOString() },
      }
    );
    return {
      success: false,
      reason: "invalid",
      remainingAttempts: Math.max(0, 5 - newAttempts),
    };
  }

  // Atomic state transition: verify email and clear OTP
  const result = await db.collection<UserDoc>(COLLECTIONS.USERS).findOneAndUpdate(
    {
      id: user.id,
      otpCodeHash: user.otpCodeHash,
    },
    {
      $set: {
        isEmailVerified: true,
        updatedAt: now.toISOString(),
      },
      $unset: {
        otpCodeHash: "",
        otpExpiresAt: "",
        otpLastSentAt: "",
        otpAttempts: "",
        emailVerificationTokenHash: "",
        emailVerificationExpiresAt: "",
      },
    },
    { returnDocument: "after" }
  );

  if (!result) {
    return { success: false, reason: "invalid" };
  }

  const safe = toSafeUser(result);
  return {
    success: true,
    user: safe || undefined,
  };
}

/**
 * Sets or rotates the email verification token and expiration for a student account.
 */
export async function setEmailVerificationToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date
): Promise<boolean> {
  const db = await getMongoDb();
  const res = await db.collection<UserDoc>(COLLECTIONS.USERS).updateOne(
    { id: userId },
    {
      $set: {
        emailVerificationTokenHash: tokenHash,
        emailVerificationExpiresAt: expiresAt,
        updatedAt: new Date().toISOString(),
      },
    }
  );
  return res.matchedCount > 0;
}

/**
 * Clears the email verification token and expiration for a student account.
 * Used when email delivery fails or to invalidate an unusable token.
 */
export async function clearEmailVerificationToken(userId: string): Promise<boolean> {
  const db = await getMongoDb();
  const res = await db.collection<UserDoc>(COLLECTIONS.USERS).updateOne(
    { id: userId },
    {
      $set: {
        emailVerificationTokenHash: null,
        emailVerificationExpiresAt: null,
        updatedAt: new Date().toISOString(),
      },
    }
  );
  return res.matchedCount > 0;
}

/**
 * Atomically verifies a user's email using the provided SHA-256 token hash.
 * Single-use: invalidates and clears the token upon verification.
 */
export async function verifyUserEmailWithToken(
  tokenHash: string
): Promise<{
  success: boolean;
  user?: SafeUser;
  reason?: "invalid" | "expired" | "already_verified";
}> {
  if (!tokenHash || typeof tokenHash !== "string") {
    return { success: false, reason: "invalid" };
  }

  const db = await getMongoDb();
  const now = new Date();

  // First, check if token hash exists in the database
  const userWithToken = await db
    .collection<UserDoc>(COLLECTIONS.USERS)
    .findOne({ emailVerificationTokenHash: tokenHash });

  if (!userWithToken) {
    return { success: false, reason: "invalid" };
  }

  // Check token expiration
  if (userWithToken.emailVerificationExpiresAt) {
    const expiresAt = new Date(userWithToken.emailVerificationExpiresAt);
    if (expiresAt < now) {
      return { success: false, reason: "expired" };
    }
  }

  // Atomic state transition: verify email and clear token
  const result = await db.collection<UserDoc>(COLLECTIONS.USERS).findOneAndUpdate(
    {
      id: userWithToken.id,
      emailVerificationTokenHash: tokenHash,
    },
    {
      $set: {
        isEmailVerified: true,
        updatedAt: now.toISOString(),
      },
      $unset: {
        emailVerificationTokenHash: "",
        emailVerificationExpiresAt: "",
      },
    },
    { returnDocument: "after" }
  );

  if (!result) {
    return { success: false, reason: "invalid" };
  }

  const safe = toSafeUser(result);
  return {
    success: true,
    user: safe || undefined,
  };
}

export async function updateUserProfile(
  userId: string,
  input: {
    name?: string;
    educationLevel?: string;
    institution?: string;
    targetExam?: string;
    phone?: string;
  }
): Promise<SafeUser | null> {
  const db = await getMongoDb();
  const now = new Date().toISOString();

  const updateFields: Record<string, unknown> = {
    updatedAt: now,
  };

  if (input.name !== undefined) updateFields.name = input.name.trim();
  if (input.educationLevel !== undefined) {
    updateFields["profile.educationLevel"] = input.educationLevel.trim();
  }
  if (input.institution !== undefined) {
    updateFields["profile.institution"] = input.institution.trim();
  }
  if (input.targetExam !== undefined) {
    updateFields["profile.targetExam"] = input.targetExam.trim();
  }
  if (input.phone !== undefined) {
    updateFields["profile.phone"] = input.phone.trim();
  }

  const result = await db.collection<UserDoc>(COLLECTIONS.USERS).findOneAndUpdate(
    { id: userId },
    { $set: updateFields },
    { returnDocument: "after" }
  );

  return toSafeUser(result);
}

// ---------------------------------------------------------------------------
// Session & Device Management Operations
// ---------------------------------------------------------------------------

/**
 * Creates a new session in MongoDB with device metadata.
 * Generates an unpredictable 256-bit token.
 * Stores ONLY the SHA-256 hash of the token in MongoDB for breach resilience.
 * Returns the raw token in UserSession.token so it can be committed to the HTTP-only cookie.
 */
export async function createSession(
  userId: string,
  role: UserRole,
  device?: {
    deviceId?: string;
    deviceName?: string;
    deviceType?: DeviceType;
    browser?: string;
    operatingSystem?: string;
  }
): Promise<UserSession> {
  const db = await getMongoDb();
  const rawToken = generateSessionToken();
  const hashedToken = hashSessionToken(rawToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const sessionDoc: SessionDoc = {
    id: sessionId,
    token: hashedToken,
    userId,
    role,
    deviceId: device?.deviceId || `dev_${Math.random().toString(36).substring(2, 10)}`,
    deviceName: device?.deviceName || "Desktop • Browser",
    deviceType: device?.deviceType || "desktop",
    browser: device?.browser || "Browser",
    operatingSystem: device?.operatingSystem || "OS",
    createdAt: now.toISOString(),
    lastActiveAt: now.toISOString(),
    expiresAt,
    status: "active",
    revokedAt: null,
  };

  await db.collection<SessionDoc>(COLLECTIONS.SESSIONS).insertOne(sessionDoc);

  return {
    id: sessionDoc.id,
    token: rawToken,
    userId,
    role,
    deviceId: sessionDoc.deviceId,
    deviceName: sessionDoc.deviceName,
    deviceType: sessionDoc.deviceType,
    browser: sessionDoc.browser,
    operatingSystem: sessionDoc.operatingSystem,
    createdAt: sessionDoc.createdAt,
    lastActiveAt: sessionDoc.lastActiveAt,
    expiresAt: sessionDoc.expiresAt,
    status: sessionDoc.status,
  };
}

/**
 * Atomically validates device limit and creates a new authenticated session for a student.
 * If target device already has an active session for this student, replaces that session (same device slot).
 * If target device is new, enforces student's maxDevices limit (default 2).
 */
export async function createStudentSessionWithLimit(
  studentId: string,
  device?: {
    deviceId?: string;
    deviceName?: string;
    deviceType?: DeviceType;
    browser?: string;
    operatingSystem?: string;
  }
): Promise<{
  success: boolean;
  session?: UserSession;
  error?: string;
  isDeviceLimitReached?: boolean;
  activeDevicesCount?: number;
  maxDevices?: number;
}> {
  const db = await getMongoDb();
  const student = await db.collection<UserDoc>(COLLECTIONS.USERS).findOne({ id: studentId });
  if (!student) {
    return { success: false, error: "Student account not found." };
  }

  const maxAllowed =
    typeof student.maxDevices === "number" && student.maxDevices > 0 ? student.maxDevices : 2;
  const targetDeviceId = device?.deviceId;
  const now = new Date();

  // 1. Purge expired sessions for this student
  await db.collection<SessionDoc>(COLLECTIONS.SESSIONS).deleteMany({
    userId: studentId,
    expiresAt: { $lte: now.toISOString() },
  });

  // 2. Query currently active sessions
  const activeSessions = await db
    .collection<SessionDoc>(COLLECTIONS.SESSIONS)
    .find({
      userId: studentId,
      expiresAt: { $gt: now.toISOString() },
      $or: [{ status: "active" }, { status: { $exists: false } }],
    })
    .toArray();

  // 3. Check if target device already has an active session
  const isSameDevice = targetDeviceId
    ? activeSessions.some((s) => s.deviceId === targetDeviceId)
    : false;

  if (isSameDevice && targetDeviceId) {
    // Re-authenticating on the same device: replace existing session so device count stays 1
    await db.collection<SessionDoc>(COLLECTIONS.SESSIONS).deleteMany({
      userId: studentId,
      deviceId: targetDeviceId,
    });
  } else {
    // Distinct new device: count active unique devices
    const distinctDeviceIds = new Set(
      activeSessions.map((s) => s.deviceId || s.token).filter(Boolean)
    );

    if (distinctDeviceIds.size >= maxAllowed) {
      return {
        success: false,
        isDeviceLimitReached: true,
        activeDevicesCount: distinctDeviceIds.size,
        maxDevices: maxAllowed,
        error: `Device limit reached. Your account is active on the maximum allowed devices (${maxAllowed}). Please log out from another device before logging in here.`,
      };
    }
  }

  // 4. Create fresh session
  const session = await createSession(studentId, "student", device);
  return { success: true, session };
}

/**
 * Resolves an active session by its raw cookie token.
 * Validates expiration, active status, and performs throttled lastActiveAt updates.
 */
export async function findSessionByToken(rawToken: string): Promise<UserSession | null> {
  if (!rawToken || typeof rawToken !== "string") return null;
  const db = await getMongoDb();
  const hashedToken = hashSessionToken(rawToken);

  let session = await db
    .collection<SessionDoc>(COLLECTIONS.SESSIONS)
    .findOne({ token: hashedToken });

  // Backward-compatible fallback for unhashed legacy tokens
  if (!session) {
    session = await db.collection<SessionDoc>(COLLECTIONS.SESSIONS).findOne({ token: rawToken });
    if (session) {
      await db.collection<SessionDoc>(COLLECTIONS.SESSIONS).updateOne(
        { _id: session._id },
        { $set: { token: hashedToken } }
      );
    }
  }

  if (!session) return null;

  // Revocation check
  if (session.status === "revoked") {
    return null;
  }

  // Expiration check
  if (new Date(session.expiresAt) < new Date()) {
    await deleteSession(rawToken);
    return null;
  }

  // Throttled lastActiveAt update (every 5 minutes to prevent DB write spam)
  const lastActive = session.lastActiveAt ? new Date(session.lastActiveAt).getTime() : 0;
  if (Date.now() - lastActive > 5 * 60 * 1000) {
    db.collection<SessionDoc>(COLLECTIONS.SESSIONS)
      .updateOne(
        { _id: session._id },
        { $set: { lastActiveAt: new Date().toISOString() } }
      )
      .catch(() => {});
  }

  return {
    id: session.id || session._id?.toString(),
    token: rawToken,
    userId: session.userId,
    role: session.role,
    deviceId: session.deviceId,
    deviceName: session.deviceName,
    deviceType: session.deviceType,
    browser: session.browser,
    operatingSystem: session.operatingSystem,
    createdAt: session.createdAt,
    lastActiveAt: session.lastActiveAt || session.createdAt,
    expiresAt: session.expiresAt,
    status: session.status || "active",
  };
}

/**
 * Revokes a session by deleting it from MongoDB.
 */
export async function deleteSession(rawToken: string): Promise<void> {
  if (!rawToken || typeof rawToken !== "string") return;
  const db = await getMongoDb();
  const hashedToken = hashSessionToken(rawToken);
  await db.collection(COLLECTIONS.SESSIONS).deleteOne({
    $or: [{ token: hashedToken }, { token: rawToken }],
  });
}

/**
 * Revokes a session by session ID and optional user filter.
 */
export async function revokeSessionById(
  sessionId: string,
  targetUserId?: string
): Promise<boolean> {
  if (!sessionId) return false;
  const db = await getMongoDb();
  const query: Record<string, unknown> = {
    $or: [
      { id: sessionId },
      ...(ObjectId.isValid(sessionId) ? [{ _id: new ObjectId(sessionId) }] : []),
    ],
  };
  if (targetUserId) {
    query.userId = targetUserId;
  }

  const result = await db.collection<SessionDoc>(COLLECTIONS.SESSIONS).deleteOne(query);
  return result.deletedCount > 0;
}

/**
 * Revokes all sessions for a user EXCEPT the one matching currentRawToken.
 */
export async function revokeAllOtherSessions(
  userId: string,
  currentRawToken: string
): Promise<number> {
  if (!userId || !currentRawToken) return 0;
  const db = await getMongoDb();
  const hashedToken = hashSessionToken(currentRawToken);

  const result = await db.collection<SessionDoc>(COLLECTIONS.SESSIONS).deleteMany({
    userId,
    token: { $nin: [hashedToken, currentRawToken] },
  });

  return result.deletedCount;
}

/**
 * Revokes/deletes all sessions for a user.
 */
export async function deleteUserSessions(userId: string): Promise<void> {
  if (!userId) return;
  const db = await getMongoDb();
  await db.collection(COLLECTIONS.SESSIONS).deleteMany({ userId });
}

/**
 * Retrieves all active, unexpired, unrevoked sessions for a user.
 */
export async function getActiveSessionsForUser(userId: string): Promise<UserSession[]> {
  if (!userId) return [];
  const db = await getMongoDb();
  const now = new Date().toISOString();

  const docs = await db
    .collection<SessionDoc>(COLLECTIONS.SESSIONS)
    .find({
      userId,
      expiresAt: { $gt: now },
      $or: [{ status: "active" }, { status: { $exists: false } }],
    })
    .sort({ lastActiveAt: -1, createdAt: -1 })
    .toArray();

  return docs.map((s) => ({
    id: s.id || s._id?.toString() || "",
    token: s.token,
    userId: s.userId,
    role: s.role,
    deviceId: s.deviceId || "unknown_device",
    deviceName: s.deviceName || "Desktop • Browser",
    deviceType: s.deviceType || "desktop",
    browser: s.browser || "Browser",
    operatingSystem: s.operatingSystem || "OS",
    createdAt: s.createdAt,
    lastActiveAt: s.lastActiveAt || s.createdAt,
    expiresAt: s.expiresAt,
    status: s.status || "active",
  }));
}

/**
 * Configures the maximum allowed active devices for an individual student.
 */
export async function updateStudentDeviceLimit(
  studentId: string,
  maxDevices: number
): Promise<boolean> {
  if (!studentId || maxDevices < 1) return false;
  const db = await getMongoDb();
  const res = await db.collection<UserDoc>(COLLECTIONS.USERS).updateOne(
    { id: studentId, role: "student" },
    { $set: { maxDevices, updatedAt: new Date().toISOString() } }
  );
  return res.matchedCount > 0;
}

// ---------------------------------------------------------------------------
// Test Attempt Operations
// ---------------------------------------------------------------------------

export async function createTestAttempt(input: Omit<TestAttempt, "id">): Promise<TestAttempt> {
  const db = await getMongoDb();
  const id = `attempt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  const newAttempt: TestAttempt = {
    ...input,
    id,
  };

  await db.collection<TestAttemptDoc>(COLLECTIONS.ATTEMPTS).insertOne(newAttempt as TestAttemptDoc);
  return newAttempt;
}

export async function getStudentAttempts(studentId: string): Promise<TestAttempt[]> {
  const db = await getMongoDb();
  const docs = await db
    .collection<TestAttemptDoc>(COLLECTIONS.ATTEMPTS)
    .find({ studentId })
    .sort({ completedAt: -1 })
    .toArray();

  return toDomainEntities<TestAttempt>(docs);
}

export async function getAttemptById(attemptId: string): Promise<TestAttempt | null> {
  if (!attemptId) return null;
  const db = await getMongoDb();
  const doc = await db.collection<TestAttemptDoc>(COLLECTIONS.ATTEMPTS).findOne({ id: attemptId });
  return doc ? toDomainEntity<TestAttempt>(doc) : null;
}

/**
 * Formats a duration in seconds into human-readable text.
 * e.g., 1475 -> "24 min 35 sec", 1920 -> "32 min", 45 -> "45 sec"
 */
export function formatDuration(seconds: number | null): string | null {
  if (seconds === null || isNaN(seconds) || seconds <= 0) return null;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins === 0) return `${secs} sec`;
  if (secs === 0) return `${mins} min`;
  return `${mins} min ${secs} sec`;
}

/**
 * Calculates aggregated peer performance statistics for a specific test.
 *
 * Rules:
 * - Scoped strictly to the specific testId.
 * - Counts only valid, completed attempts (status: "completed").
 * - Calculates arithmetic mean score (percentage).
 * - Calculates arithmetic mean time taken between startedAt and completedAt.
 * - Excludes corrupted or anomalous completion times (e.g. <= 0 or > 24 hours).
 * - Never returns individual student identities, IDs, or records (strict privacy).
 * - Returns hasSufficientData: false if no valid completed attempts exist.
 */
export async function getTestPeerStatistics(testId: string): Promise<TestPerformanceInsights> {
  const emptyResult: TestPerformanceInsights = {
    testId,
    totalAttempts: 0,
    averageScore: null,
    averageTimeSeconds: null,
    formattedAverageTime: null,
    hasSufficientData: false,
  };

  if (!testId || typeof testId !== "string") {
    return emptyResult;
  }

  const db = await getMongoDb();

  const pipeline = [
    {
      $match: {
        testId,
        status: "completed",
        percentage: { $exists: true, $type: "number", $gte: 0, $lte: 100 },
        startedAt: { $exists: true, $type: "string" },
        completedAt: { $exists: true, $type: "string" },
      },
    },
    {
      $addFields: {
        startDate: {
          $dateFromString: {
            dateString: "$startedAt",
            onError: null,
            onNull: null,
          },
        },
        endDate: {
          $dateFromString: {
            dateString: "$completedAt",
            onError: null,
            onNull: null,
          },
        },
      },
    },
    {
      $addFields: {
        durationSeconds: {
          $cond: {
            if: {
              $and: [
                { $ne: ["$startDate", null] },
                { $ne: ["$endDate", null] },
                { $gt: ["$endDate", "$startDate"] },
              ],
            },
            then: {
              $divide: [{ $subtract: ["$endDate", "$startDate"] }, 1000],
            },
            else: null,
          },
        },
      },
    },
    {
      $group: {
        _id: "$testId",
        totalAttempts: { $sum: 1 },
        avgScore: { $avg: "$percentage" },
        avgDurationSeconds: {
          $avg: {
            $cond: {
              if: {
                $and: [
                  { $gt: ["$durationSeconds", 0] },
                  { $lt: ["$durationSeconds", 86400] }, // < 24 hours
                ],
              },
              then: "$durationSeconds",
              else: null,
            },
          },
        },
      },
    },
  ];

  const results = await db
    .collection<TestAttemptDoc>(COLLECTIONS.ATTEMPTS)
    .aggregate(pipeline)
    .toArray();

  if (!results || results.length === 0 || results[0].totalAttempts === 0) {
    return emptyResult;
  }

  const record = results[0];
  const totalAttempts = record.totalAttempts || 0;
  const avgScore = typeof record.avgScore === "number" ? Math.round(record.avgScore) : null;
  const avgSeconds =
    typeof record.avgDurationSeconds === "number" ? Math.round(record.avgDurationSeconds) : null;

  return {
    testId,
    totalAttempts,
    averageScore: avgScore,
    averageTimeSeconds: avgSeconds,
    formattedAverageTime: formatDuration(avgSeconds),
    hasSufficientData: totalAttempts > 0 && avgScore !== null,
  };
}

export async function getStudentDashboardStats(studentId: string): Promise<StudentDashboardStats> {
  const attempts = await getStudentAttempts(studentId);

  if (attempts.length === 0) {
    return {
      testsAttempted: 0,
      completedTests: 0,
      questionsSolved: 0,
      averageScore: null,
      bestScore: null,
      recentScore: null,
      subjectProgress: [],
      weakAreas: [],
    };
  }

  const testsAttempted = attempts.length;
  const completedTests = attempts.filter((a) => a.status === "completed").length;
  const questionsSolved = attempts.reduce((acc, a) => acc + a.totalQuestions, 0);
  const totalPercentage = attempts.reduce((acc, a) => acc + a.percentage, 0);
  const averageScore = Math.round(totalPercentage / testsAttempted);
  const bestScore = Math.max(...attempts.map((a) => a.percentage));
  const recentScore = attempts[0]?.percentage ?? null;

  // Group by subject to calculate subject progress
  const subjectMap = new Map<
    string,
    {
      subjectTitle: string;
      examTitle: string;
      totalPercent: number;
      count: number;
      questionsSolved: number;
    }
  >();

  // Group by topic to calculate weak areas (< 60% accuracy)
  const topicMap = new Map<
    string,
    {
      topicTitle: string;
      subjectTitle: string;
      examId?: string;
      totalQuestions: number;
      correctCount: number;
      incorrectCount: number;
    }
  >();

  attempts.forEach((a) => {
    // Subject progress calculation
    const subKey = a.subjectId || a.subjectTitle || "General";
    const existingSub = subjectMap.get(subKey) || {
      subjectTitle: a.subjectTitle || "General",
      examTitle: a.examTitle || "Exam",
      totalPercent: 0,
      count: 0,
      questionsSolved: 0,
    };
    existingSub.totalPercent += a.percentage;
    existingSub.count += 1;
    existingSub.questionsSolved += a.totalQuestions;
    subjectMap.set(subKey, existingSub);

    // Topic performance for weak areas
    if (a.topicTitle || a.topicId) {
      const topKey = a.topicId || a.topicTitle || "General";
      const existingTop = topicMap.get(topKey) || {
        topicTitle: a.topicTitle || "General Topic",
        subjectTitle: a.subjectTitle || "Subject",
        examId: a.examId,
        totalQuestions: 0,
        correctCount: 0,
        incorrectCount: 0,
      };
      existingTop.totalQuestions += a.totalQuestions;
      existingTop.correctCount += a.correctCount;
      existingTop.incorrectCount += a.incorrectCount;
      topicMap.set(topKey, existingTop);
    }
  });

  const subjectProgress: SubjectProgress[] = Array.from(subjectMap.entries()).map(
    ([subjectId, val]) => ({
      subjectId,
      subjectTitle: val.subjectTitle,
      examTitle: val.examTitle,
      averageScore: Math.round(val.totalPercent / val.count),
      attemptsCount: val.count,
      questionsSolved: val.questionsSolved,
    })
  );

  const weakAreas: WeakAreaItem[] = Array.from(topicMap.entries())
    .map(([topicId, val]) => {
      const accuracy = val.totalQuestions > 0 ? Math.round((val.correctCount / val.totalQuestions) * 100) : 0;
      return {
        topicId,
        topicTitle: val.topicTitle,
        subjectTitle: val.subjectTitle,
        examId: val.examId,
        accuracy,
        totalQuestions: val.totalQuestions,
        incorrectCount: val.incorrectCount,
      };
    })
    .filter((t) => t.accuracy < 60)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 4);

  return {
    testsAttempted,
    completedTests,
    questionsSolved,
    averageScore,
    bestScore,
    recentScore,
    subjectProgress,
    weakAreas,
  };
}

// ---------------------------------------------------------------------------
// Admin Student Management Operations
// ---------------------------------------------------------------------------

export interface StudentListFilterOptions {
  search?: string;
  status?: string;
  targetExam?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedStudentsResult {
  students: SafeUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getStudentsList(
  options: StudentListFilterOptions = {}
): Promise<PaginatedStudentsResult> {
  const db = await getMongoDb();
  const page = Math.max(1, options.page || 1);
  const limit = Math.max(1, Math.min(100, options.limit || 15));
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = { role: "student" };

  if (options.status && options.status !== "all") {
    if (options.status === "active") {
      query.$or = [{ status: "active" }, { status: { $exists: false } }];
    } else {
      query.status = options.status;
    }
  }

  if (options.targetExam && options.targetExam !== "all") {
    query["profile.targetExam"] = options.targetExam;
  }

  if (options.search && options.search.trim().length > 0) {
    const term = options.search.trim();
    const searchRegex = { $regex: term, $options: "i" };
    query.$and = [
      {
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { "profile.institution": searchRegex },
        ],
      },
    ];
  }

  const [total, docs] = await Promise.all([
    db.collection<UserDoc>(COLLECTIONS.USERS).countDocuments(query),
    db
      .collection<UserDoc>(COLLECTIONS.USERS)
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
  ]);

  const students = docs.map((doc) => toSafeUser(doc)!);
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    students,
    total,
    page,
    limit,
    totalPages,
  };
}

export async function getStudentWithDetails(studentId: string): Promise<{
  student: SafeUser;
  attempts: TestAttempt[];
  stats: StudentDashboardStats;
} | null> {
  if (!studentId) return null;
  const student = await findUserById(studentId);
  if (!student || student.role !== "student") return null;

  const [attempts, stats] = await Promise.all([
    getStudentAttempts(studentId),
    getStudentDashboardStats(studentId),
  ]);

  return {
    student,
    attempts,
    stats,
  };
}

export async function updateStudentStatus(
  studentId: string,
  status: "active" | "suspended"
): Promise<SafeUser | null> {
  if (!studentId) return null;
  const db = await getMongoDb();
  const now = new Date().toISOString();

  const result = await db.collection<UserDoc>(COLLECTIONS.USERS).findOneAndUpdate(
    { id: studentId, role: "student" },
    {
      $set: {
        status,
        updatedAt: now,
      },
    },
    { returnDocument: "after" }
  );

  // If suspending, immediately invalidate all active sessions for security
  if (status === "suspended") {
    await db.collection<SessionDoc>(COLLECTIONS.SESSIONS).deleteMany({ userId: studentId });
  }

  return toSafeUser(result);
}

export async function updateStudentProfileByAdmin(
  studentId: string,
  input: {
    name?: string;
    educationLevel?: string;
    institution?: string;
    targetExam?: string;
    phone?: string;
    status?: "active" | "suspended";
  }
): Promise<SafeUser | null> {
  if (!studentId) return null;
  const db = await getMongoDb();
  const now = new Date().toISOString();

  const setFields: Record<string, unknown> = {
    updatedAt: now,
  };

  if (input.name) setFields.name = input.name.trim();
  if (input.status) setFields.status = input.status;
  if (input.educationLevel) setFields["profile.educationLevel"] = input.educationLevel;
  if (input.institution) setFields["profile.institution"] = input.institution;
  if (input.targetExam) setFields["profile.targetExam"] = input.targetExam;
  if (input.phone !== undefined) setFields["profile.phone"] = input.phone;

  const result = await db.collection<UserDoc>(COLLECTIONS.USERS).findOneAndUpdate(
    { id: studentId, role: "student" },
    { $set: setFields },
    { returnDocument: "after" }
  );

  return toSafeUser(result);
}

/**
 * Permanently deletes a student account and completely purges all personal data.
 *
 * Implements actual permanent deletion (NOT soft deletion):
 * 1. Permanently removes the user document from the USERS collection.
 * 2. Removes the associated email, immediately freeing it for new registrations.
 * 3. Invalidates all active sessions and authentication tokens.
 * 4. Removes associated examination enrollments.
 * 5. Removes associated test attempts and diagnostic records.
 * 6. Anonymizes question reports submitted by the student (removes PII: name, email).
 * 7. Clears authentication rate limits and OTP caches.
 * 8. Uses MongoDB multi-document transactions where supported by deployment.
 *
 * Security:
 * Strictly prevents deletion of administrator accounts.
 */
export async function permanentlyDeleteUser(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  if (!userId) {
    return { success: false, error: "User ID is required." };
  }

  const db = await getMongoDb();
  const user = await db.collection<UserDoc>(COLLECTIONS.USERS).findOne({ id: userId });

  if (!user) {
    return { success: false, error: "Account not found in the database." };
  }

  if (user.role === "admin") {
    return { success: false, error: "Administrator accounts cannot be deleted through this interface." };
  }

  const normalizedEmail = user.email.trim().toLowerCase();
  const client = await getMongoClient();

  let transactionCommitted = false;
  let session: ClientSession | null = null;

  try {
    session = client.startSession();
    await session.withTransaction(async (activeSession) => {
      // 1. Delete user from USERS collection
      await db.collection<UserDoc>(COLLECTIONS.USERS).deleteOne({ id: userId }, { session: activeSession });

      // 2. Delete all sessions from SESSIONS collection
      await db.collection<SessionDoc>(COLLECTIONS.SESSIONS).deleteMany({ userId }, { session: activeSession });

      // 3. Delete all enrollments from ENROLLMENTS collection
      await db.collection<StudentEnrollmentDoc>(COLLECTIONS.ENROLLMENTS).deleteMany({ studentId: userId }, { session: activeSession });

      // 4. Delete all attempts from ATTEMPTS collection
      await db.collection<TestAttemptDoc>(COLLECTIONS.ATTEMPTS).deleteMany({ studentId: userId }, { session: activeSession });

      // 5. Anonymize QUESTION_REPORTS to retain bug triage without retaining student PII
      await db.collection<QuestionReportDoc>(COLLECTIONS.QUESTION_REPORTS).updateMany(
        { studentId: userId },
        {
          $set: {
            studentId: `deleted_${userId}`,
            studentName: "[Deleted Student]",
            studentEmail: "anonymized@deleted.user",
            updatedAt: new Date().toISOString(),
          },
        },
        { session: activeSession }
      );
    });
    transactionCommitted = true;
  } catch (txErr: unknown) {
    // If transactions are not supported on this MongoDB deployment (e.g. standalone Mongo in testing)
    console.warn(
      "MongoDB transaction not supported or failed, applying resilient direct deletion:",
      txErr instanceof Error ? txErr.message : txErr
    );
  } finally {
    if (session) {
      await session.endSession().catch(() => {});
    }
  }

  // If transaction wasn't used/supported, execute sequential cleanup
  if (!transactionCommitted) {
    await db.collection<UserDoc>(COLLECTIONS.USERS).deleteOne({ id: userId });
    await db.collection<SessionDoc>(COLLECTIONS.SESSIONS).deleteMany({ userId });
    await db.collection<StudentEnrollmentDoc>(COLLECTIONS.ENROLLMENTS).deleteMany({ studentId: userId });
    await db.collection<TestAttemptDoc>(COLLECTIONS.ATTEMPTS).deleteMany({ studentId: userId });
    await db.collection<QuestionReportDoc>(COLLECTIONS.QUESTION_REPORTS).updateMany(
      { studentId: userId },
      {
        $set: {
          studentId: `deleted_${userId}`,
          studentName: "[Deleted Student]",
          studentEmail: "anonymized@deleted.user",
          updatedAt: new Date().toISOString(),
        },
      }
    );
  }

  // Reset rate limits for the deleted email so future registrations aren't throttled
  try {
    await resetRateLimit(`login:student:${normalizedEmail}`);
    await resetRateLimit(`login:staff:${normalizedEmail}`);
    await resetRateLimit(`login:user:${normalizedEmail}`);
    await resetRateLimit(`resend-otp:${normalizedEmail}`);
  } catch {
    // Non-fatal
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// Admin Staff Management Operations
// ---------------------------------------------------------------------------

export async function getStaffList(options: {
  search?: string;
  status?: string;
} = {}): Promise<SafeUser[]> {
  const db = await getMongoDb();
  const query: Record<string, unknown> = { role: "staff" };

  if (options.status && options.status !== "all") {
    if (options.status === "active") {
      query.$or = [{ status: "active" }, { status: { $exists: false } }];
    } else {
      query.status = options.status;
    }
  }

  if (options.search && options.search.trim().length > 0) {
    const term = options.search.trim();
    const searchRegex = { $regex: term, $options: "i" };
    query.$and = [
      {
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { staffTitle: searchRegex },
          { department: searchRegex },
        ],
      },
    ];
  }

  const docs = await db
    .collection<UserDoc>(COLLECTIONS.USERS)
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();

  return docs.map((doc) => toSafeUser(doc)!);
}

export async function getStaffById(staffId: string): Promise<SafeUser | null> {
  if (!staffId) return null;
  const db = await getMongoDb();
  const doc = await db.collection<UserDoc>(COLLECTIONS.USERS).findOne({ id: staffId, role: "staff" });
  return toSafeUser(doc);
}

export async function updateStaffDetails(
  staffId: string,
  input: {
    name?: string;
    email?: string;
    staffTitle?: string;
    department?: string;
    password?: string;
  }
): Promise<SafeUser | null> {
  if (!staffId) return null;
  const db = await getMongoDb();
  const now = new Date().toISOString();

  const setFields: Record<string, unknown> = {
    updatedAt: now,
  };

  if (input.name !== undefined && input.name.trim()) {
    setFields.name = input.name.trim();
  }
  if (input.staffTitle !== undefined) {
    setFields.staffTitle = input.staffTitle.trim() || "Academic Coordinator";
  }
  if (input.department !== undefined) {
    setFields.department = input.department.trim() || "Content & Curriculum";
  }
  if (input.email !== undefined && input.email.trim()) {
    const normalizedEmail = input.email.trim().toLowerCase();
    const conflict = await db.collection<UserDoc>(COLLECTIONS.USERS).findOne({
      email: normalizedEmail,
      id: { $ne: staffId },
    });
    if (conflict) {
      throw new Error("Another account already uses this email address.");
    }
    setFields.email = normalizedEmail;
  }
  if (input.password && input.password.length > 0) {
    setFields.passwordHash = await hashPassword(input.password);
  }

  const result = await db.collection<UserDoc>(COLLECTIONS.USERS).findOneAndUpdate(
    { id: staffId, role: "staff" },
    { $set: setFields },
    { returnDocument: "after" }
  );

  return toSafeUser(result);
}

export async function updateStaffPermissions(
  staffId: string,
  permissions: Permission[]
): Promise<SafeUser | null> {
  if (!staffId) return null;
  const db = await getMongoDb();
  const sanitized = sanitizeStaffPermissions(permissions);

  const result = await db.collection<UserDoc>(COLLECTIONS.USERS).findOneAndUpdate(
    { id: staffId, role: "staff" },
    {
      $set: {
        permissions: sanitized,
        updatedAt: new Date().toISOString(),
      },
    },
    { returnDocument: "after" }
  );

  return toSafeUser(result);
}

export async function updateStaffStatus(
  staffId: string,
  status: "active" | "suspended"
): Promise<SafeUser | null> {
  if (!staffId) return null;
  const db = await getMongoDb();
  const now = new Date().toISOString();

  const result = await db.collection<UserDoc>(COLLECTIONS.USERS).findOneAndUpdate(
    { id: staffId, role: "staff" },
    {
      $set: {
        status,
        updatedAt: now,
      },
    },
    { returnDocument: "after" }
  );

  // Deactivating a Staff account immediately revokes all active sessions
  if (status === "suspended") {
    await db.collection<SessionDoc>(COLLECTIONS.SESSIONS).deleteMany({ userId: staffId });
  }

  return toSafeUser(result);
}
