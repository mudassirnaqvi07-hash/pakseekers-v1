/**
 * Quiz Evaluation Utility — PakSeekers.
 *
 * Pure evaluation function comparing user answers against canonical correct answers.
 * Safe for both Client Components and Server Components.
 */

import type {
  Question,
  QuizEvaluationResult,
  QuestionResultItem,
  UserAnswers,
} from "@/types";

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
