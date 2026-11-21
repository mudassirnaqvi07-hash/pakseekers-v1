import "server-only";

/**
 * MongoDB User, Session & Attempt Repository — PakSeekers Phase 1.
 *
 * Implements persistent storage in MongoDB Atlas for:
 *   - Users (Student and Admin accounts)
 *   - Sessions (HTTP-only secure token sessions)
 *   - Test Attempts & Results (Evaluated quiz attempts and performance logs)
 */

import {
  getMongoDb,
  COLLECTIONS,
  toDomainEntity,
  toSafeUser,
  toDomainEntities,
  type UserDoc,
  type SessionDoc,
  type TestAttemptDoc,
} from "@/server/db";
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
} from "@/types";

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
  const isStudent = (input.role || "student") === "student";
  const newUserDoc: UserDoc = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    email: normalizedEmail,
    name: input.name.trim(),
    role: input.role || "student",
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
// Session Operations
// ---------------------------------------------------------------------------

/**
 * Creates a new session in MongoDB.
 * Generates an unpredictable 256-bit token.
 * Stores ONLY the SHA-256 hash of the token in MongoDB for database breach resilience.
 * Returns the raw token in UserSession.token so it can be set into the HTTP-only cookie.
 */
export async function createSession(userId: string, role: UserRole): Promise<UserSession> {
  const db = await getMongoDb();
  const rawToken = generateSessionToken();
  const hashedToken = hashSessionToken(rawToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  const sessionDoc: SessionDoc = {
    token: hashedToken,
    userId,
    role,
    createdAt: now.toISOString(),
    expiresAt,
  };

  await db.collection<SessionDoc>(COLLECTIONS.SESSIONS).insertOne(sessionDoc);

  // Return the session with rawToken for the cookie
  return {
    token: rawToken,
    userId,
    role,
    createdAt: sessionDoc.createdAt,
    expiresAt: sessionDoc.expiresAt,
  };
}

/**
 * Resolves an active session by its raw cookie token.
 * Hashes the incoming token with SHA-256 to lookup the stored session document.
 * Includes backward-compatible migration lookup for unhashed legacy tokens.
 */
export async function findSessionByToken(rawToken: string): Promise<UserSession | null> {
  if (!rawToken || typeof rawToken !== "string") return null;
  const db = await getMongoDb();
  const hashedToken = hashSessionToken(rawToken);

  let session = await db.collection<SessionDoc>(COLLECTIONS.SESSIONS).findOne({ token: hashedToken });

  // Backward-compatible fallback for unhashed tokens (migrates in place if found)
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

  // Check expiration
  if (new Date(session.expiresAt) < new Date()) {
    await deleteSession(rawToken);
    return null;
  }

  return {
    token: rawToken,
    userId: session.userId,
    role: session.role,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
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

export async function deleteUserSessions(userId: string): Promise<void> {
  if (!userId) return;
  const db = await getMongoDb();
  await db.collection(COLLECTIONS.SESSIONS).deleteMany({ userId });
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
