/**
 * ResultSummary — PakSeekers Phase 2.
 *
 * Displays final practice score, percentage, correct/incorrect/unattempted breakdown,
 * and actions for reviewing answers, restarting practice, or returning to the topic.
 */

import Link from "next/link";
import { CheckCircle2, RotateCcw, XCircle, HelpCircle, ArrowLeft, BookOpen } from "lucide-react";
import type { QuizEvaluationResult } from "@/types";
import { Button } from "@/components/ui";

interface ResultSummaryProps {
  result: QuizEvaluationResult;
  topicTitle: string;
  topicHref: string;
  onReviewAnswers: () => void;
  onPracticeAgain: () => void;
  isReviewing: boolean;
  savedAttemptId?: string | null;
}

export function ResultSummary({
  result,
  topicTitle,
  topicHref,
  onReviewAnswers,
  onPracticeAgain,
  isReviewing,
  savedAttemptId,
}: ResultSummaryProps) {
  const isPassed = result.percentage >= 60;

  return (
    <div className="bg-surface border border-border rounded-xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Practice Result
          </span>
          <h2 className="text-2xl font-bold text-text-primary mt-1">
            {topicTitle}
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            {isPassed
              ? "Great job! You have demonstrated a solid command of these concepts."
              : "Good effort! Review the detailed explanations below to strengthen key areas."}
          </p>
        </div>

        {/* Big percentage pill */}
        <div className="flex items-center gap-4 self-start sm:self-auto">
          <div className="text-right">
            <div className="text-3xl sm:text-4xl font-extrabold text-primary">
              {result.percentage}%
            </div>
            <div className="text-xs font-semibold text-text-secondary">
              Score: {result.score} / {result.totalQuestions}
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Correct Answers */}
        <div className="bg-green-50/60 border border-green-200 rounded-lg p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-green-600 text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-green-900">
              {result.correctCount}
            </div>
            <div className="text-xs font-medium text-green-800">
              Correct Answers
            </div>
          </div>
        </div>

        {/* Incorrect Answers */}
        <div className="bg-red-50/60 border border-red-200 rounded-lg p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-red-900">
              {result.incorrectCount}
            </div>
            <div className="text-xs font-medium text-red-800">
              Incorrect Answers
            </div>
          </div>
        </div>

        {/* Unattempted Answers */}
        <div className="bg-slate-50 border border-border rounded-lg p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-slate-500 text-white flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-text-primary">
              {result.unattemptedCount}
            </div>
            <div className="text-xs font-medium text-text-secondary">
              Skipped / Unattempted
            </div>
          </div>
        </div>
      </div>

      {/* Attempt Persistence Status */}
      {savedAttemptId ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-primary/10 border border-primary/20 text-xs">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
            <span>Attempt score recorded to your student profile!</span>
          </div>
          <Link href={`/student/attempts/${savedAttemptId}`}>
            <Button variant="outline" size="sm" className="h-7 text-xs">
              View in My Attempts →
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-surface-hover border border-border text-xs text-text-secondary">
          <span>Sign in to automatically save attempt scores and track subject progress.</span>
          <Link href="/student/login">
            <Button variant="ghost" size="sm" className="h-7 text-xs text-primary font-semibold">
              Student Sign In →
            </Button>
          </Link>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
        <Link href={topicHref}>
          <Button
            type="button"
            variant="outline"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Return to Topic
          </Button>
        </Link>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onPracticeAgain}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Practice Again
          </Button>

          <Button
            type="button"
            variant={isReviewing ? "secondary" : "primary"}
            onClick={onReviewAnswers}
            leftIcon={<BookOpen className="w-4 h-4" />}
          >
            {isReviewing ? "Hide Review" : "Review Answers"}
          </Button>
        </div>
      </div>
    </div>
  );
}
