/**
 * User & Session Repository — PakSeekers Phase 4.
 *
 * Thread-safe, file-backed persistent store for:
 * - User accounts (Students and Admins)
 * - Sessions (Token-based HTTP-only cookie sessions)
 * - Test Attempts (Completed/in-progress student tests with answers & scores)
 *
 * Stores data in `src/data/user-store.json`.
 * Seeds default Admin and Student accounts on initial startup.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import type {
  User,
  UserRole,
  UserSession,
  TestAttempt,
  StudentProfile,
  StudentDashboardStats,
  SubjectProgress,
} from "@/types";

interface UserStoreData {
  users: User[];
  sessions: UserSession[];
  attempts: TestAttempt[];
}

const DATA_DIR = path.join(process.cwd(), "src", "data");
const USER_STORE_FILE = path.join(DATA_DIR, "user-store.json");

// ---------------------------------------------------------------------------
// Cryptographic Password Hashing Helpers
// ---------------------------------------------------------------------------

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

export function verifyPassword(password: string, combinedHash: string): boolean {
  try {
    const [salt, key] = combinedHash.split(":");
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Default Seed Accounts
// ---------------------------------------------------------------------------

function getDefaultUsers(): User[] {
  const now = new Date().toISOString();
  return [
    {
      id: "admin-seed-01",
      email: "admin@pakseekers.com",
      name: "PakSeekers Administrator",
      role: "admin",
      passwordHash: hashPassword("admin123"),
      profile: {
        educationLevel: "Master of Science",
        institution: "PakSeekers Core",
        targetExam: "All Exams",
      },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "student-seed-01",
      email: "student@pakseekers.com",
      name: "Ali Ahmed",
      role: "student",
      passwordHash: hashPassword("student123"),
      profile: {
        educationLevel: "FSc Pre-Medical",
        institution: "Punjab Group of Colleges",
        targetExam: "MDCAT",
        phone: "+92 300 1234567",
      },
      createdAt: now,
      updatedAt: now,
    },
  ];
}

// ---------------------------------------------------------------------------
// Store Persistence Management
// ---------------------------------------------------------------------------

let cachedUserStore: UserStoreData | null = null;

function getStore(): UserStoreData {
  if (cachedUserStore) {
    return cachedUserStore;
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(USER_STORE_FILE)) {
      const raw = fs.readFileSync(USER_STORE_FILE, "utf-8");
      cachedUserStore = JSON.parse(raw);
    } else {
      cachedUserStore = {
        users: getDefaultUsers(),
        sessions: [],
        attempts: [],
      };
      fs.writeFileSync(USER_STORE_FILE, JSON.stringify(cachedUserStore, null, 2), "utf-8");
    }
  } catch (error) {
    console.error("Error loading user store, initializing fallback:", error);
    cachedUserStore = {
      users: getDefaultUsers(),
      sessions: [],
      attempts: [],
    };
  }

  if (!cachedUserStore) {
    cachedUserStore = {
      users: getDefaultUsers(),
      sessions: [],
      attempts: [],
    };
  }

  return cachedUserStore;
}

function saveStore(store: UserStoreData): void {
  cachedUserStore = store;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(USER_STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving user store to disk:", error);
  }
}

// ---------------------------------------------------------------------------
// User Operations
// ---------------------------------------------------------------------------

export function findUserByEmail(email: string): User | null {
  const store = getStore();
  const normalized = email.trim().toLowerCase();
  const user = store.users.find((u) => u.email.toLowerCase() === normalized);
  return user ? { ...user } : null;
}

export function findUserById(id: string): User | null {
  const store = getStore();
  const user = store.users.find((u) => u.id === id);
  return user ? { ...user } : null;
}

export function createUser(input: {
  email: string;
  name: string;
  password: string;
  role?: UserRole;
  profile?: Partial<StudentProfile>;
}): User {
  const store = getStore();
  const normalizedEmail = input.email.trim().toLowerCase();

  const existing = store.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    throw new Error(`User with email "${normalizedEmail}" already exists.`);
  }

  const now = new Date().toISOString();
  const newUser: User = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    email: normalizedEmail,
    name: input.name.trim(),
    role: input.role || "student",
    passwordHash: hashPassword(input.password),
    profile: {
      educationLevel: input.profile?.educationLevel || "FSc Pre-Medical",
      institution: input.profile?.institution || "Not specified",
      targetExam: input.profile?.targetExam || "MDCAT",
      phone: input.profile?.phone || "",
    },
    createdAt: now,
    updatedAt: now,
  };

  store.users.push(newUser);
  saveStore(store);
  return newUser;
}

export function updateUserProfile(
  userId: string,
  input: {
    name?: string;
    educationLevel?: string;
    institution?: string;
    targetExam?: string;
    phone?: string;
  }
): User | null {
  const store = getStore();
  const index = store.users.findIndex((u) => u.id === userId);
  if (index === -1) return null;

  const current = store.users[index];
  const updated: User = {
    ...current,
    name: input.name !== undefined ? input.name.trim() : current.name,
    profile: {
      ...current.profile,
      educationLevel:
        input.educationLevel !== undefined
          ? input.educationLevel.trim()
          : current.profile.educationLevel,
      institution:
        input.institution !== undefined
          ? input.institution.trim()
          : current.profile.institution,
      targetExam:
        input.targetExam !== undefined
          ? input.targetExam.trim()
          : current.profile.targetExam,
      phone: input.phone !== undefined ? input.phone.trim() : current.profile.phone,
    },
    updatedAt: new Date().toISOString(),
  };

  store.users[index] = updated;
  saveStore(store);
  return updated;
}

// ---------------------------------------------------------------------------
// Session Operations
// ---------------------------------------------------------------------------

export function createSession(userId: string, role: UserRole): UserSession {
  const store = getStore();
  const token = crypto.randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  const session: UserSession = {
    token,
    userId,
    role,
    createdAt: now.toISOString(),
    expiresAt,
  };

  store.sessions.push(session);
  saveStore(store);
  return session;
}

export function findSessionByToken(token: string): UserSession | null {
  if (!token) return null;
  const store = getStore();
  const session = store.sessions.find((s) => s.token === token);
  if (!session) return null;

  // Check expiration
  if (new Date(session.expiresAt) < new Date()) {
    deleteSession(token);
    return null;
  }

  return { ...session };
}

export function deleteSession(token: string): void {
  const store = getStore();
  store.sessions = store.sessions.filter((s) => s.token !== token);
  saveStore(store);
}

export function deleteUserSessions(userId: string): void {
  const store = getStore();
  store.sessions = store.sessions.filter((s) => s.userId !== userId);
  saveStore(store);
}

// ---------------------------------------------------------------------------
// Test Attempt Operations
// ---------------------------------------------------------------------------

export function createTestAttempt(input: Omit<TestAttempt, "id">): TestAttempt {
  const store = getStore();
  const id = `attempt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  const newAttempt: TestAttempt = {
    ...input,
    id,
  };

  store.attempts.push(newAttempt);
  saveStore(store);
  return newAttempt;
}

export function getStudentAttempts(studentId: string): TestAttempt[] {
  const store = getStore();
  return store.attempts
    .filter((a) => a.studentId === studentId)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
}

export function getAttemptById(attemptId: string): TestAttempt | null {
  const store = getStore();
  const attempt = store.attempts.find((a) => a.id === attemptId);
  return attempt ? { ...attempt } : null;
}

export function getStudentDashboardStats(studentId: string): StudentDashboardStats {
  const attempts = getStudentAttempts(studentId);

  if (attempts.length === 0) {
    return {
      testsAttempted: 0,
      questionsSolved: 0,
      averageScore: null,
      subjectProgress: [],
    };
  }

  const testsAttempted = attempts.length;
  const questionsSolved = attempts.reduce((acc, a) => acc + a.totalQuestions, 0);
  const totalPercentage = attempts.reduce((acc, a) => acc + a.percentage, 0);
  const averageScore = Math.round(totalPercentage / testsAttempted);

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

  attempts.forEach((a) => {
    const key = a.subjectId || a.subjectTitle || "General";
    const existing = subjectMap.get(key) || {
      subjectTitle: a.subjectTitle || "General",
      examTitle: a.examTitle || "Exam",
      totalPercent: 0,
      count: 0,
      questionsSolved: 0,
    };

    existing.totalPercent += a.percentage;
    existing.count += 1;
    existing.questionsSolved += a.totalQuestions;
    subjectMap.set(key, existing);
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

  return {
    testsAttempted,
    questionsSolved,
    averageScore,
    subjectProgress,
  };
}
