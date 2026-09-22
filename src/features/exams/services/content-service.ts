/**
 * Content Service — PakSeekers.
 *
 * Abstracted data access layer for Exams, Subjects, Topics, Questions, and Tests.
 * Delegates to the unified ContentRepository (shared by Student and Admin portals).
 */

import type {
  Exam,
  Subject,
  Topic,
  Question,
  Test,
  QuizEvaluationResult,
  QuestionResultItem,
  UserAnswers,
} from "@/types";
import * as contentRepo from "@/server/repositories/content-repository";

// ---------------------------------------------------------------------------
// Exam Accessors
// ---------------------------------------------------------------------------

export async function getAllExams(): Promise<Exam[]> {
  return contentRepo.getAllExams("active");
}

export async function getExamById(id: string): Promise<Exam | null> {
  return contentRepo.getExamById(id);
}

// ---------------------------------------------------------------------------
// Subject Accessors
// ---------------------------------------------------------------------------

export async function getSubjectsByExamId(examId: string): Promise<Subject[]> {
  return contentRepo.getAllSubjects(examId);
}

export async function getSubjectById(subjectId: string): Promise<Subject | null> {
  return contentRepo.getSubjectById(subjectId);
}

// ---------------------------------------------------------------------------
// Topic Accessors
// ---------------------------------------------------------------------------

export async function getTopicsBySubjectId(subjectId: string): Promise<Topic[]> {
  return contentRepo.getAllTopics(subjectId);
}

export async function getTopicById(topicId: string): Promise<Topic | null> {
  return contentRepo.getTopicById(topicId);
}

// ---------------------------------------------------------------------------
// Question Accessors
// ---------------------------------------------------------------------------

export async function getQuestionsByTopicId(topicId: string): Promise<Question[]> {
  return contentRepo.getAllQuestions({
    topicId,
    status: "published",
  });
}

export async function getQuestionsByIds(questionIds: string[]): Promise<Question[]> {
  return contentRepo.getQuestionsByIds(questionIds);
}

// ---------------------------------------------------------------------------
// Test Accessors
// ---------------------------------------------------------------------------

export async function getTestById(testId: string): Promise<Test | null> {
  return contentRepo.getTestById(testId);
}

export async function getTestsByTopicId(topicId: string): Promise<Test[]> {
  return contentRepo.getAllTests({
    topicId,
    status: "published",
  });
}

// ---------------------------------------------------------------------------
// Quiz Evaluation Logic
// ---------------------------------------------------------------------------

/**
 * Pure evaluation function comparing user answers against canonical correct answers.
 * Can be executed client-side or server-side.
 */
export function evaluateQuiz(
  questions: Question[],
  answers: UserAnswers
): QuizEvaluationResult {
  const totalQuestions = questions.length;
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;

  const questionResults: QuestionResultItem[] = questions.map((question) => {
    const selectedOptionId = answers[question.id] || null;
    const isAnswered = selectedOptionId !== null;
    const isCorrect = isAnswered && selectedOptionId === question.correctAnswer;

    if (!isAnswered) {
      unattemptedCount++;
    } else if (isCorrect) {
      correctCount++;
    } else {
      incorrectCount++;
    }

    return {
      question,
      selectedOptionId,
      correctOptionId: question.correctAnswer,
      isCorrect,
      isAnswered,
    };
  });

  const percentage =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  return {
    score: correctCount,
    totalQuestions,
    correctCount,
    incorrectCount,
    unattemptedCount,
    percentage,
    questionResults,
  };
}
