/**
 * QuizProgress — PakSeekers Phase 2.
 *
 * Visual progress indicator displaying completion percentage,
 * question navigation pills, and answered tally.
 */

import { cn } from "@/lib/utils/cn";

interface QuizProgressProps {
  currentIndex: number;
  totalQuestions: number;
  answeredCount: number;
  answers: Record<string, string>;
  questionIds: string[];
  onSelectIndex: (index: number) => void;
}

export function QuizProgress({
  currentIndex,
  totalQuestions,
  answeredCount,
  answers,
  questionIds,
  onSelectIndex,
}: QuizProgressProps) {
  const percentage =
    totalQuestions > 0 ? Math.round(((currentIndex + 1) / totalQuestions) * 100) : 0;

  return (
    <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 shadow-xs flex flex-col gap-4">
      {/* Top info bar */}
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <span className="font-semibold text-text-primary">
          Question {currentIndex + 1} of {totalQuestions}
        </span>
        <span className="text-text-secondary">
          <strong className="font-semibold text-primary">{answeredCount}</strong> of{" "}
          {totalQuestions} answered
        </span>
      </div>

      {/* Progress track */}
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={currentIndex + 1}
          aria-valuemin={1}
          aria-valuemax={totalQuestions}
        />
      </div>

      {/* Question Number Pills Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-thin">
        {questionIds.map((qId, idx) => {
          const isCurrent = idx === currentIndex;
          const isAnswered = Boolean(answers[qId]);

          return (
            <button
              key={qId}
              type="button"
              onClick={() => onSelectIndex(idx)}
              aria-label={`Jump to question ${idx + 1}`}
              className={cn(
                "w-8 h-8 rounded-lg text-xs font-semibold shrink-0 transition-all flex items-center justify-center border",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isCurrent && "border-primary bg-primary text-white shadow-xs",
                !isCurrent && isAnswered && "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20",
                !isCurrent && !isAnswered && "border-border bg-background text-text-secondary hover:bg-slate-200/60"
              )}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
