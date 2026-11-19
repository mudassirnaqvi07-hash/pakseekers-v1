"use client";

/**
 * QuizEngine — PakSeekers Phase 2.
 *
 * Full interactive practice quiz client component.
 * Manages active quiz session, option selection, step navigation,
 * real-time countdown timer, authoritative server-side score calculation,
 * zero answer-key leakage defense, and detailed pedagogical review.
 */

import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import type { Question, ClientQuestion, QuizEvaluationResult, UserAnswers } from "@/types";
import { evaluateQuiz } from "../utils/evaluator";
import { QuestionCard } from "./question-card";
import { QuizProgress } from "./quiz-progress";
import { QuizNavigation } from "./quiz-navigation";
import { ResultSummary } from "./result-summary";
import { QuestionReview } from "./question-review";
import { EmptyState } from "@/components/shared";
import { Button } from "@/components/ui";
import { HelpCircle, Clock, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { recordTestAttemptAction } from "@/server/actions/attempt-actions";

interface QuizEngineProps {
  questions: (ClientQuestion | Question)[];
  topicTitle: string;
  topicHref: string;
  examId?: string;
  subjectId?: string;
  topicId?: string;
  testId?: string;
  durationMinutes?: number;
}

export function QuizEngine({
  questions,
  topicTitle,
  topicHref,
  examId,
  subjectId,
  topicId,
  testId,
  durationMinutes,
}: QuizEngineProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswers>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [result, setResult] = useState<QuizEvaluationResult | null>(null);
  const [savedAttemptId, setSavedAttemptId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [flaggedIds, setFlaggedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleToggleFlag = (id: string) => {
    setFlaggedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Countdown timer state
  const totalSeconds = durationMinutes && durationMinutes > 0 ? durationMinutes * 60 : null;
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(totalSeconds);
  const hasAutoSubmitted = useRef(false);

  // Option selection
  const handleSelectOption = (optionId: string) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({
      ...prev,
      [questions[currentIndex].id]: optionId,
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

  // Submission — Authoritatively evaluated on the server
  const handleSubmit = useCallback(() => {
    if (isSubmitted || isPending) return;
    setShowConfirmModal(false);

    startTransition(async () => {
      setSubmitError(null);

      // 1. Authoritative submission via server action
      if (examId) {
        try {
          const res = await recordTestAttemptAction({
            testId,
            examId,
            subjectId: subjectId || "general",
            topicId,
            selectedAnswers: answers,
          });

          if (res.success) {
            const attempt = res.data;
            const evalResult: QuizEvaluationResult = {
              score: attempt.score,
              totalQuestions: attempt.totalQuestions,
              correctCount: attempt.correctCount,
              incorrectCount: attempt.incorrectCount,
              unattemptedCount: attempt.unattemptedCount,
              percentage: attempt.percentage,
              questionResults: attempt.questionResults,
            };
            setResult(evalResult);
            setSavedAttemptId(attempt.id);
            setIsSubmitted(true);
            setIsReviewing(true);

            if (typeof window !== "undefined") {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
            return;
          } else {
            setSubmitError(res.error || "Unable to evaluate test attempt.");
          }
        } catch (err) {
          console.error("Test submission error:", err);
          setSubmitError("Network error while submitting your test. Please try again.");
        }
      }

      // 2. Client-side evaluation fallback (used if full Question[] was provided in dev/offline)
      const hasFullQuestions = questions.every((q): q is Question => "correctAnswer" in q);
      if (hasFullQuestions) {
        const fallbackEval = evaluateQuiz(questions as Question[], answers);
        setResult(fallbackEval);
        setIsSubmitted(true);
        setIsReviewing(true);
      } else if (!examId) {
        setSubmitError("Test could not be submitted. Missing exam identifier.");
      }

      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }, [isSubmitted, isPending, examId, testId, subjectId, topicId, answers, questions]);

  // Countdown timer effect
  useEffect(() => {
    if (totalSeconds === null || isSubmitted) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(timer);
          if (!hasAutoSubmitted.current) {
            hasAutoSubmitted.current = true;
            handleSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [totalSeconds, isSubmitted, handleSubmit]);

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

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isLowTime = secondsRemaining !== null && secondsRemaining <= 120;
  const isCriticalTime = secondsRemaining !== null && secondsRemaining <= 60;

  // Restart practice
  const handlePracticeAgain = () => {
    setAnswers({});
    setCurrentIndex(0);
    setIsSubmitted(false);
    setIsReviewing(false);
    setResult(null);
    setSavedAttemptId(null);
    setSubmitError(null);
    hasAutoSubmitted.current = false;
    if (totalSeconds !== null) {
      setSecondsRemaining(totalSeconds);
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleToggleReview = () => {
    setIsReviewing((prev) => !prev);
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
      {/* Timer Bar (when timed test is active) */}
      {!isSubmitted && secondsRemaining !== null && (
        <div
          className={`sticky top-16 sm:top-20 z-20 flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border shadow-xs transition-colors ${
            isCriticalTime
              ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400 font-bold"
              : isLowTime
              ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-medium"
              : "bg-surface border-border text-text-secondary"
          }`}
        >
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Clock className="w-4 h-4" />
            <span>Time Remaining</span>
          </div>
          <div className="text-base sm:text-lg font-mono font-bold tracking-tight">
            {formatTime(secondsRemaining)}
          </div>
        </div>
      )}

      {/* Submission Error Alert */}
      {submitError && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Submission failed</p>
            <p className="text-xs opacity-90">{submitError}</p>
          </div>
          <Button size="sm" variant="outline" onClick={handleSubmit} disabled={isPending}>
            Retry
          </Button>
        </div>
      )}

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
            savedAttemptId={savedAttemptId}
          />

          {/* Detailed Question Review List */}
          {isReviewing && (
            <div className="flex flex-col gap-6 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-text-primary">
                  Detailed Answer Review ({result.correctCount} / {result.totalQuestions} Correct)
                </h3>
                <span className="text-xs text-text-secondary">
                  Pedagogical rationales provided for every question
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
            flaggedIds={flaggedIds}
          />

          {/* Active Question Card */}
          <QuestionCard
            question={currentQuestion}
            questionNumber={currentIndex + 1}
            totalQuestions={questions.length}
            selectedOptionId={answers[currentQuestion.id] || null}
            onSelectOption={handleSelectOption}
            disabled={isPending}
            isFlagged={flaggedIds.includes(currentQuestion.id)}
            onToggleFlag={() => handleToggleFlag(currentQuestion.id)}
          />

          {/* Previous / Next / Submit Controls */}
          <QuizNavigation
            currentIndex={currentIndex}
            totalQuestions={questions.length}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onSubmit={() => setShowConfirmModal(true)}
            isSubmitting={isPending}
          />

          {/* Submission Confirmation Modal */}
          {showConfirmModal && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-modal-title"
              className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
            >
              <div className="bg-surface border border-border rounded-xl max-w-md w-full p-4 sm:p-6 flex flex-col gap-4 sm:gap-5 shadow-lg max-h-[90dvh] overflow-y-auto">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 id="confirm-modal-title" className="text-sm sm:text-base font-bold text-text-primary">
                        Submit Examination?
                      </h3>
                      <p className="text-[11px] sm:text-xs text-text-secondary">
                        Review your completion status before finalizing score.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(false)}
                    className="text-text-secondary hover:text-text-primary p-1.5 rounded-md cursor-pointer shrink-0"
                    aria-label="Close confirmation dialog"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Status breakdown card */}
                <div className="grid grid-cols-3 gap-2 sm:gap-2.5 p-3 rounded-lg bg-background border border-border text-center text-xs">
                  <div className="flex flex-col">
                    <span className="font-extrabold text-base sm:text-lg text-primary">{answeredCount}</span>
                    <span className="text-text-secondary text-[11px]">Answered</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-extrabold text-base sm:text-lg text-amber-600">
                      {questions.length - answeredCount}
                    </span>
                    <span className="text-text-secondary text-[11px]">Unanswered</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-extrabold text-base sm:text-lg text-text-primary">{flaggedIds.length}</span>
                    <span className="text-text-secondary text-[11px]">Flagged</span>
                  </div>
                </div>

                {questions.length - answeredCount > 0 && (
                  <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                    <span className="text-[11px] leading-relaxed">
                      You have <strong>{questions.length - answeredCount} unanswered</strong> question(s). Unanswered questions will receive 0 marks.
                    </span>
                  </div>
                )}

                <div className="flex flex-col-reverse xs:flex-row items-center justify-end gap-2 sm:gap-3 pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => setShowConfirmModal(false)}
                    disabled={isPending}
                    className="w-full xs:w-auto"
                  >
                    Review Answers
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    isLoading={isPending}
                    onClick={handleSubmit}
                    className="bg-secondary hover:bg-secondary-hover w-full xs:w-auto font-bold"
                  >
                    Confirm & Submit
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
