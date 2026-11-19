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
  flaggedIds?: string[];
}

export function QuizProgress({
  currentIndex,
  totalQuestions,
  answeredCount,
  answers,
  questionIds,
  onSelectIndex,
  flaggedIds = [],
}: QuizProgressProps) {
  const percentage =
    totalQuestions > 0 ? Math.round(((currentIndex + 1) / totalQuestions) * 100) : 0;

  return (
    <div className="bg-surface border border-border rounded-xl p-3.5 sm:p-5 shadow-xs flex flex-col gap-3 sm:gap-4 min-w-0">
      {/* Top info bar */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs sm:text-sm">
        <span className="font-semibold text-text-primary">
          Question {currentIndex + 1} of {totalQuestions}
        </span>
        <span className="text-text-secondary text-[11px] sm:text-xs">
          <strong className="font-semibold text-primary">{answeredCount}</strong> of{" "}
          {totalQuestions} answered
          {flaggedIds.length > 0 && (
            <span className="ml-1.5 text-amber-600 font-medium">
              ({flaggedIds.length} flagged)
            </span>
          )}
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
          const isFlagged = flaggedIds.includes(qId);

          return (
            <button
              key={qId}
              type="button"
              onClick={() => onSelectIndex(idx)}
              aria-label={`Jump to question ${idx + 1}${isFlagged ? " (Flagged)" : ""}${isAnswered ? " (Answered)" : ""}`}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "relative min-w-[34px] min-h-[34px] w-9 h-9 rounded-lg text-xs font-semibold shrink-0 transition-all flex items-center justify-center border cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isCurrent && "border-primary bg-primary text-white shadow-xs font-bold",
                !isCurrent && isAnswered && "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20",
                !isCurrent && !isAnswered && "border-border bg-background text-text-secondary hover:bg-slate-200/60"
              )}
            >
              {idx + 1}
              {isFlagged && (
                <span
                  aria-hidden="true"
                  className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-white"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
