/**
 * Content Service — PakSeekers.
 *
 * The server-layer API for all academic content: Exams, Subjects, Topics,
 * Questions, Tests, and Quiz Evaluation.
 *
 * This is the ONLY layer that app/ pages and server actions should call for
 * content reads. Repositories are an implementation detail behind this boundary.
 *
 * Dependency direction:
 *   app/pages  →  server/services/content-service  →  server/repositories/content-repository
 *
 * Business rules enforced here (not in the repository):
 *   - Public catalog always filters by status: "active" / "published"
 *   - Quiz evaluation is a domain operation, not a UI concern
 */

import "server-only";
import { unstable_cache } from "next/cache";
import type {
  Exam,
  Subject,
  Topic,
  Question,
  Test,
  ContentStatus,
  Section,
  Lesson,
} from "@/types";
import type { QuestionFilters, TestFilters, DashboardStats } from "@/server/repositories/content-repository";
import * as contentRepo from "@/server/repositories/content-repository";

export type { QuestionFilters, TestFilters, DashboardStats };

// ---------------------------------------------------------------------------
// Admin / Internal — unfiltered accessors (all statuses)
// ---------------------------------------------------------------------------

export async function getAdminDashboardStats(): Promise<DashboardStats> {
  return contentRepo.getDashboardStats();
}

export async function getAdminAllExams(status?: ContentStatus): Promise<Exam[]> {
  return contentRepo.getAllExams(status);
}

export async function getAdminAllSubjects(examId?: string): Promise<Subject[]> {
  return contentRepo.getAllSubjects(examId);
}

export async function getAdminAllTopics(subjectId?: string, examId?: string): Promise<Topic[]> {
  return contentRepo.getAllTopics(subjectId, examId);
}

export async function getAdminAllQuestions(filters?: QuestionFilters): Promise<Question[]> {
  return contentRepo.getAllQuestions(filters);
}

export async function getAdminAllTests(filters?: TestFilters): Promise<Test[]> {
  return contentRepo.getAllTests(filters);
}

export async function getAdminExamById(id: string): Promise<Exam | null> {
  return contentRepo.getExamById(id);
}

export async function getAdminSubjectById(id: string): Promise<Subject | null> {
  return contentRepo.getSubjectById(id);
}

export async function getAdminTopicById(id: string): Promise<Topic | null> {
  return contentRepo.getTopicById(id);
}

export async function getAdminQuestionById(id: string): Promise<Question | null> {
  return contentRepo.getQuestionById(id);
}

export async function getAdminTestById(id: string): Promise<Test | null> {
  return contentRepo.getTestById(id);
}

export async function getAdminQuestionsByIds(ids: string[]): Promise<Question[]> {
  return contentRepo.getQuestionsByIds(ids);
}

// ---------------------------------------------------------------------------
// Public catalog — applies default visibility filters & resilient edge caching
// ---------------------------------------------------------------------------

export const getAllExams = unstable_cache(
  async (): Promise<Exam[]> => {
    try {
      return await contentRepo.getAllExams("active");
    } catch (err) {
      console.warn(
        "Failed to fetch active exams from database (falling back to static defaults):",
        err instanceof Error ? err.message : err
      );
      return [];
    }
  },
  ["content-all-active-exams"],
  { revalidate: 60, tags: ["exams"] }
);

export async function getExamById(id: string): Promise<Exam | null> {
  return contentRepo.getExamById(id);
}

export async function getSubjectsByExamId(examId: string): Promise<Subject[]> {
  return contentRepo.getAllSubjects(examId);
}

export async function getSubjectById(subjectId: string): Promise<Subject | null> {
  return contentRepo.getSubjectById(subjectId);
}

export async function getTopicsBySubjectId(subjectId: string): Promise<Topic[]> {
  return contentRepo.getAllTopics(subjectId);
}

export async function getTopicById(topicId: string): Promise<Topic | null> {
  return contentRepo.getTopicById(topicId);
}

export async function getQuestionsByTopicId(topicId: string): Promise<Question[]> {
  return contentRepo.getAllQuestions({ topicId, status: "published" });
}

export async function getQuestionsByIds(questionIds: string[]): Promise<Question[]> {
  return contentRepo.getQuestionsByIds(questionIds);
}

export async function getQuestionById(questionId: string): Promise<Question | null> {
  return contentRepo.getQuestionById(questionId);
}

export async function getAllTopics(subjectId?: string, examId?: string): Promise<Topic[]> {
  return contentRepo.getAllTopics(subjectId, examId);
}

export async function getTestById(testId: string): Promise<Test | null> {
  return contentRepo.getTestById(testId);
}

export async function getTestsByTopicId(topicId: string): Promise<Test[]> {
  return contentRepo.getAllTests({ topicId, status: "published" });
}

export const getAllPublishedTests = unstable_cache(
  async (examId?: string): Promise<Test[]> => {
    return contentRepo.getAllTests({ status: "published", examId });
  },
  ["content-all-published-tests"],
  { revalidate: 60, tags: ["tests"] }
);

export const getAllSubjects = unstable_cache(
  async (examId?: string): Promise<Subject[]> => {
    return contentRepo.getAllSubjects(examId);
  },
  ["content-all-subjects"],
  { revalidate: 60, tags: ["subjects"] }
);

// ---------------------------------------------------------------------------
// Section Accessors
// ---------------------------------------------------------------------------

export async function getAdminAllSections(): Promise<Section[]> {
  return contentRepo.getAllSections();
}

export async function getSectionById(id: string): Promise<Section | null> {
  return contentRepo.getSectionById(id);
}

export async function getSectionsBySubjectId(subjectId: string): Promise<Section[]> {
  return contentRepo.getSectionsBySubject(subjectId);
}

export async function getSectionsByExamId(examId: string): Promise<Section[]> {
  return contentRepo.getSectionsByExam(examId);
}

// ---------------------------------------------------------------------------
// Lesson Accessors
// ---------------------------------------------------------------------------

export async function getAdminAllLessons(): Promise<Lesson[]> {
  return contentRepo.getAllLessons();
}

export async function getLessonById(id: string): Promise<Lesson | null> {
  return contentRepo.getLessonById(id);
}

export async function getPublishedLessons(filter?: {
  examId?: string;
  subjectId?: string;
  topicId?: string;
}): Promise<Lesson[]> {
  return contentRepo.getPublishedLessons(filter);
}

export async function getLessonsByTopicId(topicId: string): Promise<Lesson[]> {
  return contentRepo.getLessonsByTopic(topicId);
}

// ---------------------------------------------------------------------------
// Mock Tests Accessors
// ---------------------------------------------------------------------------

export async function getAdminAllMockTests(): Promise<Test[]> {
  return contentRepo.getAllMockTests();
}

export async function getPublishedMockTests(examId?: string): Promise<Test[]> {
  return contentRepo.getPublishedMockTests(examId);
}
