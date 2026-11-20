import "server-only";

/**
 * MongoDB Document Schemas & Index Management — PakSeekers Phase 1.
 *
 * Defines collection names, document schemas, TypeScript interfaces,
 * relationship models, and automated index creation for MongoDB Atlas.
 */

import { ObjectId, type Db, type Document } from "mongodb";
import type {
  ContentDefaultsSettings,
  ContentStatus,
  ExaminationSettings,
  GeneralSettings,
  LessonStatus,
  PlatformConfigSettings,
  QuestionDifficulty,
  QuestionOption,
  QuestionReportReason,
  QuestionReportStatus,
  QuestionResultItem,
  QuestionStatus,
  SafeUser,
  StudentProfile,
  TestDifficulty,
  TestStatus,
  UserAnswers,
  UserRole,
  UserStatus,
} from "@/types";

// ---------------------------------------------------------------------------
// Collection Name Constants
// ---------------------------------------------------------------------------

export const COLLECTIONS = {
  USERS: "users",
  SESSIONS: "sessions",
  EXAMS: "exams",
  SUBJECTS: "subjects",
  TOPICS: "topics",
  QUESTIONS: "questions",
  TESTS: "tests",
  ATTEMPTS: "test_attempts",
  SECTIONS: "sections",
  LESSONS: "lessons",
  QUESTION_REPORTS: "question_reports",
  SETTINGS: "platform_settings",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

// ---------------------------------------------------------------------------
// MongoDB Document Interfaces (Extending Domain Models with _id)
// ---------------------------------------------------------------------------

export interface UserDoc extends Document {
  _id?: ObjectId;
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status?: UserStatus;
  passwordHash: string;
  isEmailVerified?: boolean;
  emailVerificationTokenHash?: string | null;
  emailVerificationExpiresAt?: Date | string | null;
  profile: StudentProfile;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionDoc extends Document {
  _id?: ObjectId;
  token: string;
  userId: string;
  role: UserRole;
  createdAt: string;
  expiresAt: string;
}

export interface ExamDoc extends Document {
  _id?: ObjectId;
  id: string;
  title: string;
  code: string;
  description: string;
  totalSubjects: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectDoc extends Document {
  _id?: ObjectId;
  id: string;
  examId: string;
  title: string;
  description: string;
  icon?: string;
  totalTopics: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SectionDoc extends Document {
  _id?: ObjectId;
  id: string;
  title: string;
  description: string;
  examId: string;
  subjectId: string;
  order: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TopicDoc extends Document {
  _id?: ObjectId;
  id: string;
  subjectId: string;
  examId: string;
  title: string;
  description: string;
  questionCount: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface LessonDoc extends Document {
  _id?: ObjectId;
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  examId: string;
  subjectId: string;
  topicId: string;
  sectionId?: string;
  learningObjectives?: string[];
  order: number;
  readTimeMinutes: number;
  status: LessonStatus;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionDoc extends Document {
  _id?: ObjectId;
  id: string;
  questionText: string;
  options: QuestionOption[];
  correctAnswer: string;
  explanation: string;
  examId: string;
  subjectId: string;
  topicId: string;
  difficulty: QuestionDifficulty;
  status: QuestionStatus;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TestDoc extends Document {
  _id?: ObjectId;
  id: string;
  title: string;
  description: string;
  examId: string;
  subjectId: string;
  topicId?: string;
  questionIds: string[];
  durationMinutes: number;
  questionCount: number;
  difficulty: TestDifficulty;
  status: TestStatus;
  testType?: "practice" | "mock";
  totalMarks?: number;
  passingMarks?: number;
  negativeMarking?: number;
  instructions?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionReportDoc extends Document {
  _id?: ObjectId;
  id: string;
  questionId: string;
  questionText: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  reason: QuestionReportReason;
  description: string;
  status: QuestionReportStatus;
  adminNotes?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SettingsDoc extends Document {
  _id?: ObjectId;
  id: "default";
  general: GeneralSettings;
  platform: PlatformConfigSettings;
  examination: ExaminationSettings;
  content: ContentDefaultsSettings;
  updatedAt: string;
  updatedBy?: string;
}

export interface TestAttemptDoc extends Document {
  _id?: ObjectId;
  id: string;
  studentId: string;
  testId: string;
  testTitle: string;
  examId: string;
  examTitle: string;
  subjectId: string;
  subjectTitle: string;
  topicId?: string;
  topicTitle?: string;
  selectedAnswers: UserAnswers;
  score: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  percentage: number;
  questionResults: QuestionResultItem[];
  startedAt: string;
  completedAt: string;
  status: "completed" | "in-progress";
}

// ---------------------------------------------------------------------------
// Document Mapping & Sanitization Utility
// ---------------------------------------------------------------------------

/**
 * Strips MongoDB internal `_id` field and returns clean domain entity.
 */
export function toDomainEntity<T>(doc: Record<string, unknown> | null | undefined): T {
  if (!doc) return null as unknown as T;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, ...rest } = doc;
  return rest as T;
}

/**
 * Sanitizes a user document by removing `_id` and `passwordHash`.
 */
export function toSafeUser(doc: Record<string, unknown> | null | undefined): SafeUser | null {
  if (!doc) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, passwordHash, emailVerificationTokenHash, ...rest } = doc;
  const user = rest as SafeUser;
  if (user.profile) {
    user.phone = user.phone || user.profile.phone;
    user.targetExam = user.targetExam || user.profile.targetExam;
    user.educationLevel = user.educationLevel || user.profile.educationLevel;
    user.city = user.city || user.profile.city;
  }
  return user;
}

/**
 * Maps an array of MongoDB documents to domain entities.
 */
export function toDomainEntities<T>(docs: Array<Record<string, unknown>>): T[] {
  return docs.map((d) => toDomainEntity<T>(d));
}

// ---------------------------------------------------------------------------
// Index Management
// ---------------------------------------------------------------------------

/**
 * Creates and verifies all required MongoDB Atlas indexes.
 * Safe to run repeatedly (idempotent).
 */
export async function ensureMongoIndexes(db: Db): Promise<{
  collection: string;
  indexesCreated: string[];
}[]> {
  const results: { collection: string; indexesCreated: string[] }[] = [];

  // 1. Users Indexes
  const usersCol = db.collection(COLLECTIONS.USERS);
  const u1 = await usersCol.createIndex({ email: 1 }, { unique: true, name: "idx_users_email_unique" });
  const u2 = await usersCol.createIndex({ id: 1 }, { unique: true, name: "idx_users_id_unique" });
  results.push({ collection: COLLECTIONS.USERS, indexesCreated: [u1, u2] });

  // 2. Sessions Indexes
  const sessionsCol = db.collection(COLLECTIONS.SESSIONS);
  const s1 = await sessionsCol.createIndex({ token: 1 }, { unique: true, name: "idx_sessions_token_unique" });
  const s2 = await sessionsCol.createIndex({ userId: 1 }, { name: "idx_sessions_userId" });
  const s3 = await sessionsCol.createIndex({ expiresAt: 1 }, { name: "idx_sessions_expiresAt" });
  results.push({ collection: COLLECTIONS.SESSIONS, indexesCreated: [s1, s2, s3] });

  // 3. Exams Indexes
  const examsCol = db.collection(COLLECTIONS.EXAMS);
  const e1 = await examsCol.createIndex({ id: 1 }, { unique: true, name: "idx_exams_id_unique" });
  const e2 = await examsCol.createIndex({ code: 1 }, { unique: true, name: "idx_exams_code_unique" });
  const e3 = await examsCol.createIndex({ status: 1 }, { name: "idx_exams_status" });
  results.push({ collection: COLLECTIONS.EXAMS, indexesCreated: [e1, e2, e3] });

  // 4. Subjects Indexes
  const subjectsCol = db.collection(COLLECTIONS.SUBJECTS);
  const sub1 = await subjectsCol.createIndex({ id: 1 }, { unique: true, name: "idx_subjects_id_unique" });
  const sub2 = await subjectsCol.createIndex({ examId: 1, status: 1 }, { name: "idx_subjects_examId_status" });
  results.push({ collection: COLLECTIONS.SUBJECTS, indexesCreated: [sub1, sub2] });

  // 5. Topics Indexes
  const topicsCol = db.collection(COLLECTIONS.TOPICS);
  const top1 = await topicsCol.createIndex({ id: 1 }, { unique: true, name: "idx_topics_id_unique" });
  const top2 = await topicsCol.createIndex({ subjectId: 1, examId: 1 }, { name: "idx_topics_subjectId_examId" });
  results.push({ collection: COLLECTIONS.TOPICS, indexesCreated: [top1, top2] });

  // 6. Questions Indexes
  const questionsCol = db.collection(COLLECTIONS.QUESTIONS);
  const q1 = await questionsCol.createIndex({ id: 1 }, { unique: true, name: "idx_questions_id_unique" });
  const q2 = await questionsCol.createIndex({ topicId: 1, status: 1 }, { name: "idx_questions_topicId_status" });
  const q3 = await questionsCol.createIndex({ examId: 1, subjectId: 1 }, { name: "idx_questions_examId_subjectId" });
  const q4 = await questionsCol.createIndex({ difficulty: 1 }, { name: "idx_questions_difficulty" });
  results.push({ collection: COLLECTIONS.QUESTIONS, indexesCreated: [q1, q2, q3, q4] });

  // 7. Tests Indexes
  const testsCol = db.collection(COLLECTIONS.TESTS);
  const t1 = await testsCol.createIndex({ id: 1 }, { unique: true, name: "idx_tests_id_unique" });
  const t2 = await testsCol.createIndex({ examId: 1, status: 1 }, { name: "idx_tests_examId_status" });
  const t3 = await testsCol.createIndex({ topicId: 1, status: 1 }, { name: "idx_tests_topicId_status" });
  results.push({ collection: COLLECTIONS.TESTS, indexesCreated: [t1, t2, t3] });

  // 8. Test Attempts Indexes
  const attemptsCol = db.collection(COLLECTIONS.ATTEMPTS);
  const a1 = await attemptsCol.createIndex({ id: 1 }, { unique: true, name: "idx_attempts_id_unique" });
  const a2 = await attemptsCol.createIndex({ studentId: 1, completedAt: -1 }, { name: "idx_attempts_studentId_completedAt" });
  const a3 = await attemptsCol.createIndex({ testId: 1 }, { name: "idx_attempts_testId" });
  results.push({ collection: COLLECTIONS.ATTEMPTS, indexesCreated: [a1, a2, a3] });

  // 9. Sections Indexes
  const sectionsCol = db.collection(COLLECTIONS.SECTIONS);
  const sec1 = await sectionsCol.createIndex({ id: 1 }, { unique: true, name: "idx_sections_id_unique" });
  const sec2 = await sectionsCol.createIndex({ examId: 1, subjectId: 1, order: 1 }, { name: "idx_sections_exam_subject_order" });
  const sec3 = await sectionsCol.createIndex({ status: 1 }, { name: "idx_sections_status" });
  results.push({ collection: COLLECTIONS.SECTIONS, indexesCreated: [sec1, sec2, sec3] });

  // 10. Lessons Indexes
  const lessonsCol = db.collection(COLLECTIONS.LESSONS);
  const les1 = await lessonsCol.createIndex({ id: 1 }, { unique: true, name: "idx_lessons_id_unique" });
  const les2 = await lessonsCol.createIndex({ examId: 1, subjectId: 1, topicId: 1 }, { name: "idx_lessons_hierarchy" });
  const les3 = await lessonsCol.createIndex({ slug: 1 }, { name: "idx_lessons_slug" });
  const les4 = await lessonsCol.createIndex({ status: 1 }, { name: "idx_lessons_status" });
  results.push({ collection: COLLECTIONS.LESSONS, indexesCreated: [les1, les2, les3, les4] });

  // 11. Question Reports Indexes
  const qRepCol = db.collection(COLLECTIONS.QUESTION_REPORTS);
  const qr1 = await qRepCol.createIndex({ id: 1 }, { unique: true, name: "idx_qreports_id_unique" });
  const qr2 = await qRepCol.createIndex({ questionId: 1 }, { name: "idx_qreports_questionId" });
  const qr3 = await qRepCol.createIndex({ status: 1 }, { name: "idx_qreports_status" });
  const qr4 = await qRepCol.createIndex({ createdAt: -1 }, { name: "idx_qreports_createdAt" });
  results.push({ collection: COLLECTIONS.QUESTION_REPORTS, indexesCreated: [qr1, qr2, qr3, qr4] });

  // 12. Platform Settings Indexes
  const settingsCol = db.collection(COLLECTIONS.SETTINGS);
  const set1 = await settingsCol.createIndex({ id: 1 }, { unique: true, name: "idx_settings_id_unique" });
  results.push({ collection: COLLECTIONS.SETTINGS, indexesCreated: [set1] });

  // 13. Additional User Indexes for Student Management & Verification
  const u3 = await usersCol.createIndex({ role: 1, status: 1 }, { name: "idx_users_role_status" });
  const u4 = await usersCol.createIndex(
    { emailVerificationTokenHash: 1 },
    { sparse: true, name: "idx_users_verification_token" }
  );
  results[0].indexesCreated.push(u3, u4);

  return results;
}
