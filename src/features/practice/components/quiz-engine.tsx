"use client";

/**
 * QuizEngine — PakSeekers Phase 2.
 *
 * Full interactive practice quiz client component.
 * Manages active quiz session, option selection, step navigation,
 * submission evaluation, result presentation, and answer reviews.
 */

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Question, QuizEvaluationResult, UserAnswers } from "@/types";
import { evaluateQuiz } from "../utils/evaluator";
import { QuestionCard } from "./question-card";
import { QuizProgress } from "./quiz-progress";
import { QuizNavigation } from "./quiz-navigation";
import { ResultSummary } from "./result-summary";
import { QuestionReview } from "./question-review";
import { EmptyState } from "@/components/shared";
import { Button } from "@/components/ui";
import { HelpCircle } from "lucide-react";

interface QuizEngineProps {
  questions: Question[];
  topicTitle: string;
  topicHref: string;
}

export function QuizEngine({
  questions,
  topicTitle,
  topicHref,
}: QuizEngineProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswers>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [result, setResult] = useState<QuizEvaluationResult | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!questions || questions.length === 0) {
    return (
      <EmptyState
        icon={<HelpCircle className="w-8 h-8" />}
        title="No Questions Available"
        description="There are currently no published questions available for this topic. Please check back later."
        action={
          <Link href={topicHref}>
            <Button variant="outline">Return to Topic</Button>
          </Link>
        }
      />
    );
  }

  const currentQuestion = questions[currentIndex];
  const questionIds = questions.map((q) => q.id);
  const answeredCount = Object.keys(answers).length;

  // Option selection
  const handleSelectOption = (optionId: string) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }));
  };

  // Step navigation
  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1));
  };

  const handleJump = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index);
    }
  };

  // Submission
  const handleSubmit = () => {
    startTransition(() => {
      const evalResult = evaluateQuiz(questions, answers);
      setResult(evalResult);
      setIsSubmitted(true);
      setIsReviewing(true); // Automatically open review after submit
      // Scroll to top
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  };

  // Restart practice
  const handlePracticeAgain = () => {
    setAnswers({});
    setCurrentIndex(0);
    setIsSubmitted(false);
    setIsReviewing(false);
    setResult(null);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleToggleReview = () => {
    setIsReviewing((prev) => !prev);
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
      {/* If submitted, show the Result Summary banner */}
      {isSubmitted && result ? (
        <>
          <ResultSummary
            result={result}
            topicTitle={topicTitle}
            topicHref={topicHref}
            onReviewAnswers={handleToggleReview}
            onPracticeAgain={handlePracticeAgain}
            isReviewing={isReviewing}
          />

          {/* Detailed Question Review List */}
          {isReviewing && (
            <div className="flex flex-col gap-6 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-text-primary">
                  Detailed Answer Review ({result.correctCount} / {result.totalQuestions} Correct)
                </h3>
                <span className="text-xs text-text-secondary">
                  Explanations included for all questions
                </span>
              </div>

              {result.questionResults.map((item, idx) => (
                <QuestionReview
                  key={item.question.id}
                  item={item}
                  index={idx}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        /* Active Practice Mode */
        <>
          {/* Progress Indicator & Jump Pills */}
          <QuizProgress
            currentIndex={currentIndex}
            totalQuestions={questions.length}
            answeredCount={answeredCount}
            answers={answers}
            questionIds={questionIds}
            onSelectIndex={handleJump}
          />

          {/* Active Question Card */}
          <QuestionCard
            question={currentQuestion}
            questionNumber={currentIndex + 1}
            totalQuestions={questions.length}
            selectedOptionId={answers[currentQuestion.id] || null}
            onSelectOption={handleSelectOption}
            disabled={isPending}
          />

          {/* Previous / Next / Submit Controls */}
          <QuizNavigation
            currentIndex={currentIndex}
            totalQuestions={questions.length}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onSubmit={handleSubmit}
            isSubmitting={isPending}
          />
        </>
      )}
    </div>
  );
}
