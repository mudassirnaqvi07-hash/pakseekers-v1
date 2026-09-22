/**
 * Content Repository — PakSeekers Phase 3.
 *
 * Single source of truth for Exams, Subjects, Topics, Questions, and Tests.
 * Thread-safe, file-backed persistent store that pre-seeds from sample-data.ts.
 * Both the Admin CMS and the Student Platform read from and write to this repository.
 */

import fs from "fs";
import path from "path";
import type {
  Exam,
  Subject,
  Topic,
  Question,
  Test,
  ContentStatus,
  QuestionDifficulty,
  QuestionStatus,
  TestStatus,
} from "@/types";
import {
  SAMPLE_EXAMS,
  SAMPLE_SUBJECTS,
  SAMPLE_TOPICS,
  SAMPLE_QUESTIONS,
  SAMPLE_TESTS,
} from "@/features/exams/data/sample-data";

interface ContentStoreData {
  exams: Exam[];
  subjects: Subject[];
  topics: Topic[];
  questions: Question[];
  tests: Test[];
}

const DATA_DIR = path.join(process.cwd(), "src", "data");
const STORE_FILE = path.join(DATA_DIR, "content-store.json");

// In-memory cache for fast read/write
let cachedData: ContentStoreData | null = null;

/**
 * Initializes and retrieves the content store data.
 */
function getStore(): ContentStoreData {
  if (cachedData) {
    return cachedData;
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, "utf-8");
      cachedData = JSON.parse(raw) as ContentStoreData;
    } else {
      // Initialize with seed data
      cachedData = {
        exams: JSON.parse(JSON.stringify(SAMPLE_EXAMS)),
        subjects: JSON.parse(JSON.stringify(SAMPLE_SUBJECTS)),
        topics: JSON.parse(JSON.stringify(SAMPLE_TOPICS)),
        questions: JSON.parse(JSON.stringify(SAMPLE_QUESTIONS)),
        tests: JSON.parse(JSON.stringify(SAMPLE_TESTS)),
      };
      fs.writeFileSync(STORE_FILE, JSON.stringify(cachedData, null, 2), "utf-8");
    }
  } catch (error) {
    console.error("Error loading content store, falling back to sample data:", error);
    cachedData = {
      exams: JSON.parse(JSON.stringify(SAMPLE_EXAMS)),
      subjects: JSON.parse(JSON.stringify(SAMPLE_SUBJECTS)),
      topics: JSON.parse(JSON.stringify(SAMPLE_TOPICS)),
      questions: JSON.parse(JSON.stringify(SAMPLE_QUESTIONS)),
      tests: JSON.parse(JSON.stringify(SAMPLE_TESTS)),
    };
  }

  return cachedData;
}

/**
 * Persists the current in-memory store to disk.
 */
function saveStore(data: ContentStoreData): void {
  cachedData = data;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving content store to disk:", error);
  }
}

function updateDerivedCounts(store: ContentStoreData): void {
  // Update subject totalTopics
  store.subjects.forEach((subj) => {
    subj.totalTopics = store.topics.filter(
      (t) => t.subjectId.toLowerCase() === subj.id.toLowerCase()
    ).length;
  });

  // Update exam totalSubjects
  store.exams.forEach((exam) => {
    exam.totalSubjects = store.subjects.filter(
      (s) => s.examId.toLowerCase() === exam.id.toLowerCase()
    ).length;
  });

  // Update topic questionCount
  store.topics.forEach((topic) => {
    topic.questionCount = store.questions.filter(
      (q) => q.topicId.toLowerCase() === topic.id.toLowerCase()
    ).length;
  });

  // Update test questionCount
  store.tests.forEach((test) => {
    test.questionCount = test.questionIds.length;
  });
}

// ---------------------------------------------------------------------------
// Dashboard Metrics
// ---------------------------------------------------------------------------

export interface DashboardStats {
  totalExams: number;
  totalSubjects: number;
  totalTopics: number;
  totalQuestions: number;
  totalTests: number;
  publishedTests: number;
  draftTests: number;
}

export function getDashboardStats(): DashboardStats {
  const store = getStore();
  return {
    totalExams: store.exams.length,
    totalSubjects: store.subjects.length,
    totalTopics: store.topics.length,
    totalQuestions: store.questions.length,
    totalTests: store.tests.length,
    publishedTests: store.tests.filter((t) => t.status === "published").length,
    draftTests: store.tests.filter((t) => t.status === "draft").length,
  };
}

// ---------------------------------------------------------------------------
// Exam Operations
// ---------------------------------------------------------------------------

export function getAllExams(status?: ContentStatus): Exam[] {
  const store = getStore();
  if (status) {
    return store.exams.filter((e) => e.status === status);
  }
  return [...store.exams];
}

export function getExamById(id: string): Exam | null {
  const store = getStore();
  const exam = store.exams.find((e) => e.id.toLowerCase() === id.toLowerCase());
  return exam ? { ...exam } : null;
}

export function createExam(input: {
  title: string;
  code: string;
  description: string;
  status: ContentStatus;
}): Exam {
  const store = getStore();
  const now = new Date().toISOString();
  const id = input.code.toLowerCase().replace(/[^a-z0-9]/g, "-") || `exam-${Date.now()}`;

  const newExam: Exam = {
    id,
    title: input.title.trim(),
    code: input.code.trim().toUpperCase(),
    description: input.description.trim(),
    totalSubjects: 0,
    status: input.status,
    createdAt: now,
    updatedAt: now,
  };

  store.exams.push(newExam);
  updateDerivedCounts(store);
  saveStore(store);
  return newExam;
}

export function updateExam(
  id: string,
  input: Partial<{
    title: string;
    code: string;
    description: string;
    status: ContentStatus;
  }>
): Exam | null {
  const store = getStore();
  const index = store.exams.findIndex((e) => e.id.toLowerCase() === id.toLowerCase());
  if (index === -1) return null;

  const existing = store.exams[index];
  const updated: Exam = {
    ...existing,
    ...(input.title && { title: input.title.trim() }),
    ...(input.code && { code: input.code.trim().toUpperCase() }),
    ...(input.description !== undefined && { description: input.description.trim() }),
    ...(input.status && { status: input.status }),
    updatedAt: new Date().toISOString(),
  };

  store.exams[index] = updated;
  saveStore(store);
  return updated;
}

export function deleteExam(id: string): boolean {
  const store = getStore();
  const index = store.exams.findIndex((e) => e.id.toLowerCase() === id.toLowerCase());
  if (index === -1) return false;

  store.exams.splice(index, 1);
  saveStore(store);
  return true;
}

// ---------------------------------------------------------------------------
// Subject Operations
// ---------------------------------------------------------------------------

export function getAllSubjects(examId?: string): Subject[] {
  const store = getStore();
  if (examId) {
    return store.subjects.filter((s) => s.examId.toLowerCase() === examId.toLowerCase());
  }
  return [...store.subjects];
}

export function getSubjectById(id: string): Subject | null {
  const store = getStore();
  const subject = store.subjects.find((s) => s.id.toLowerCase() === id.toLowerCase());
  return subject ? { ...subject } : null;
}

export function createSubject(input: {
  examId: string;
  title: string;
  description: string;
  icon?: string;
  status?: ContentStatus;
}): Subject {
  const store = getStore();
  const now = new Date().toISOString();
  const slug = input.title.toLowerCase().replace(/[^a-z0-9]/g, "-") || `subject-${Date.now()}`;
  const id = `${input.examId.toLowerCase()}-${slug}`;

  const newSubject: Subject = {
    id,
    examId: input.examId,
    title: input.title.trim(),
    description: input.description.trim(),
    icon: input.icon || "BookOpen",
    totalTopics: 0,
    status: input.status || "active",
    createdAt: now,
    updatedAt: now,
  };

  store.subjects.push(newSubject);
  updateDerivedCounts(store);
  saveStore(store);
  return newSubject;
}

export function updateSubject(
  id: string,
  input: Partial<{
    examId: string;
    title: string;
    description: string;
    icon?: string;
    status?: ContentStatus;
  }>
): Subject | null {
  const store = getStore();
  const index = store.subjects.findIndex((s) => s.id.toLowerCase() === id.toLowerCase());
  if (index === -1) return null;

  const existing = store.subjects[index];
  const updated: Subject = {
    ...existing,
    ...(input.examId && { examId: input.examId }),
    ...(input.title && { title: input.title.trim() }),
    ...(input.description !== undefined && { description: input.description.trim() }),
    ...(input.icon !== undefined && { icon: input.icon }),
    ...(input.status && { status: input.status }),
    updatedAt: new Date().toISOString(),
  };

  store.subjects[index] = updated;
  updateDerivedCounts(store);
  saveStore(store);
  return updated;
}

export function deleteSubject(id: string): boolean {
  const store = getStore();
  const index = store.subjects.findIndex((s) => s.id.toLowerCase() === id.toLowerCase());
  if (index === -1) return false;

  store.subjects.splice(index, 1);
  updateDerivedCounts(store);
  saveStore(store);
  return true;
}

// ---------------------------------------------------------------------------
// Topic Operations
// ---------------------------------------------------------------------------

export function getAllTopics(subjectId?: string, examId?: string): Topic[] {
  const store = getStore();
  let results = store.topics;
  if (examId) {
    results = results.filter((t) => t.examId.toLowerCase() === examId.toLowerCase());
  }
  if (subjectId) {
    results = results.filter((t) => t.subjectId.toLowerCase() === subjectId.toLowerCase());
  }
  return [...results];
}

export function getTopicById(id: string): Topic | null {
  const store = getStore();
  const topic = store.topics.find((t) => t.id.toLowerCase() === id.toLowerCase());
  return topic ? { ...topic } : null;
}

export function createTopic(input: {
  examId: string;
  subjectId: string;
  title: string;
  description: string;
  status?: ContentStatus;
}): Topic {
  const store = getStore();
  const now = new Date().toISOString();
  const slug = input.title.toLowerCase().replace(/[^a-z0-9]/g, "-") || `topic-${Date.now()}`;
  const id = `${input.subjectId.toLowerCase()}-${slug}`;

  const newTopic: Topic = {
    id,
    examId: input.examId,
    subjectId: input.subjectId,
    title: input.title.trim(),
    description: input.description.trim(),
    questionCount: 0,
    status: input.status || "active",
    createdAt: now,
    updatedAt: now,
  };

  store.topics.push(newTopic);
  updateDerivedCounts(store);
  saveStore(store);
  return newTopic;
}

export function updateTopic(
  id: string,
  input: Partial<{
    examId: string;
    subjectId: string;
    title: string;
    description: string;
    status?: ContentStatus;
  }>
): Topic | null {
  const store = getStore();
  const index = store.topics.findIndex((t) => t.id.toLowerCase() === id.toLowerCase());
  if (index === -1) return null;

  const existing = store.topics[index];
  const updated: Topic = {
    ...existing,
    ...(input.examId && { examId: input.examId }),
    ...(input.subjectId && { subjectId: input.subjectId }),
    ...(input.title && { title: input.title.trim() }),
    ...(input.description !== undefined && { description: input.description.trim() }),
    ...(input.status && { status: input.status }),
    updatedAt: new Date().toISOString(),
  };

  store.topics[index] = updated;
  updateDerivedCounts(store);
  saveStore(store);
  return updated;
}

export function deleteTopic(id: string): boolean {
  const store = getStore();
  const index = store.topics.findIndex((t) => t.id.toLowerCase() === id.toLowerCase());
  if (index === -1) return false;

  store.topics.splice(index, 1);
  updateDerivedCounts(store);
  saveStore(store);
  return true;
}

// ---------------------------------------------------------------------------
// Question Operations
// ---------------------------------------------------------------------------

export interface QuestionFilters {
  examId?: string;
  subjectId?: string;
  topicId?: string;
  difficulty?: QuestionDifficulty;
  status?: QuestionStatus;
  search?: string;
}

export function getAllQuestions(filters?: QuestionFilters): Question[] {
  const store = getStore();
  let list = [...store.questions];

  if (filters?.examId) {
    list = list.filter((q) => q.examId.toLowerCase() === filters.examId!.toLowerCase());
  }
  if (filters?.subjectId) {
    list = list.filter((q) => q.subjectId.toLowerCase() === filters.subjectId!.toLowerCase());
  }
  if (filters?.topicId) {
    list = list.filter((q) => q.topicId.toLowerCase() === filters.topicId!.toLowerCase());
  }
  if (filters?.difficulty) {
    list = list.filter((q) => q.difficulty === filters.difficulty);
  }
  if (filters?.status) {
    list = list.filter((q) => q.status === filters.status);
  }
  if (filters?.search) {
    const term = filters.search.toLowerCase();
    list = list.filter(
      (q) =>
        q.questionText.toLowerCase().includes(term) ||
        q.explanation.toLowerCase().includes(term)
    );
  }

  return list;
}

export function getQuestionById(id: string): Question | null {
  const store = getStore();
  const q = store.questions.find((item) => item.id.toLowerCase() === id.toLowerCase());
  return q ? { ...q } : null;
}

export function getQuestionsByIds(ids: string[]): Question[] {
  const store = getStore();
  const set = new Set(ids.map((id) => id.toLowerCase()));
  return store.questions.filter((q) => set.has(q.id.toLowerCase()));
}

export function createQuestion(input: Omit<Question, "id" | "createdAt" | "updatedAt">): Question {
  const store = getStore();
  const now = new Date().toISOString();
  const id = `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  const newQuestion: Question = {
    ...input,
    id,
    createdAt: now,
    updatedAt: now,
  };

  store.questions.push(newQuestion);
  updateDerivedCounts(store);
  saveStore(store);
  return newQuestion;
}

export function updateQuestion(id: string, input: Partial<Question>): Question | null {
  const store = getStore();
  const index = store.questions.findIndex((q) => q.id.toLowerCase() === id.toLowerCase());
  if (index === -1) return null;

  const existing = store.questions[index];
  const updated: Question = {
    ...existing,
    ...input,
    id: existing.id, // Immutable ID
    updatedAt: new Date().toISOString(),
  };

  store.questions[index] = updated;
  updateDerivedCounts(store);
  saveStore(store);
  return updated;
}

export function deleteQuestion(id: string): boolean {
  const store = getStore();
  const index = store.questions.findIndex((q) => q.id.toLowerCase() === id.toLowerCase());
  if (index === -1) return false;

  store.questions.splice(index, 1);
  updateDerivedCounts(store);
  saveStore(store);
  return true;
}

// ---------------------------------------------------------------------------
// Test Operations
// ---------------------------------------------------------------------------

export interface TestFilters {
  examId?: string;
  subjectId?: string;
  topicId?: string;
  status?: TestStatus;
  search?: string;
}

export function getAllTests(filters?: TestFilters): Test[] {
  const store = getStore();
  let list = [...store.tests];

  if (filters?.examId) {
    list = list.filter((t) => t.examId.toLowerCase() === filters.examId!.toLowerCase());
  }
  if (filters?.subjectId) {
    list = list.filter((t) => t.subjectId.toLowerCase() === filters.subjectId!.toLowerCase());
  }
  if (filters?.topicId) {
    list = list.filter(
      (t) => t.topicId && t.topicId.toLowerCase() === filters.topicId!.toLowerCase()
    );
  }
  if (filters?.status) {
    list = list.filter((t) => t.status === filters.status);
  }
  if (filters?.search) {
    const term = filters.search.toLowerCase();
    list = list.filter(
      (t) =>
        t.title.toLowerCase().includes(term) ||
        t.description.toLowerCase().includes(term)
    );
  }

  return list;
}

export function getTestById(id: string): Test | null {
  const store = getStore();
  const test = store.tests.find((t) => t.id.toLowerCase() === id.toLowerCase());
  return test ? { ...test } : null;
}

export function createTest(input: Omit<Test, "id" | "questionCount" | "createdAt" | "updatedAt">): Test {
  const store = getStore();
  const now = new Date().toISOString();
  const id = `test-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  const newTest: Test = {
    ...input,
    id,
    questionCount: input.questionIds.length,
    createdAt: now,
    updatedAt: now,
  };

  store.tests.push(newTest);
  updateDerivedCounts(store);
  saveStore(store);
  return newTest;
}

export function updateTest(id: string, input: Partial<Test>): Test | null {
  const store = getStore();
  const index = store.tests.findIndex((t) => t.id.toLowerCase() === id.toLowerCase());
  if (index === -1) return null;

  const existing = store.tests[index];
  const questionIds = input.questionIds !== undefined ? input.questionIds : existing.questionIds;

  const updated: Test = {
    ...existing,
    ...input,
    id: existing.id,
    questionIds,
    questionCount: questionIds.length,
    updatedAt: new Date().toISOString(),
  };

  store.tests[index] = updated;
  saveStore(store);
  return updated;
}

export function togglePublishTest(id: string): Test | null {
  const store = getStore();
  const test = store.tests.find((t) => t.id.toLowerCase() === id.toLowerCase());
  if (!test) return null;

  test.status = test.status === "published" ? "draft" : "published";
  test.updatedAt = new Date().toISOString();
  saveStore(store);
  return { ...test };
}

export function deleteTest(id: string): boolean {
  const store = getStore();
  const index = store.tests.findIndex((t) => t.id.toLowerCase() === id.toLowerCase());
  if (index === -1) return false;

  store.tests.splice(index, 1);
  saveStore(store);
  return true;
}
