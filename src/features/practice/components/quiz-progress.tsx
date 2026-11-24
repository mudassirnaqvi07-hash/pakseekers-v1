"use client";

/**
 * QuizProgress — PakSeekers Phase 2.
 *
 * Visual progress indicator displaying completion percentage,
 * question navigation pills, and answered tally.
 */

import { useEffect, useRef } from "react";
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const percentage =
    totalQuestions > 0 ? Math.round(((currentIndex + 1) / totalQuestions) * 100) : 0;

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const activeBtn = scrollContainerRef.current.querySelector<HTMLButtonElement>(
      `[data-index="${currentIndex}"]`
    );
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [currentIndex]);

  return (
    <div className="bg-surface border border-border rounded-xl p-3 sm:p-4 shadow-2xs flex flex-col gap-2.5 sm:gap-3 min-w-0">
      {/* Top info bar */}
      <div className="flex items-center justify-between gap-1.5 text-xs sm:text-sm">
        <span className="font-bold text-text-primary">
          Question {currentIndex + 1} of {totalQuestions}
        </span>
        <span className="text-text-secondary text-xs">
          <strong className="font-bold text-primary">{answeredCount}</strong> of{" "}
          {totalQuestions} answered
          {flaggedIds.length > 0 && (
            <span className="ml-1.5 text-amber-700 font-semibold">
              ({flaggedIds.length} flagged)
            </span>
          )}
        </span>
      </div>

      {/* Progress track */}
      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-primary h-1.5 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={currentIndex + 1}
          aria-valuemin={1}
          aria-valuemax={totalQuestions}
        />
      </div>

      {/* Question Number Pills Navigation */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none scroll-smooth touch-pan-x"
      >
        {questionIds.map((qId, idx) => {
          const isCurrent = idx === currentIndex;
          const isAnswered = Boolean(answers[qId]);
          const isFlagged = flaggedIds.includes(qId);

          return (
            <button
              key={qId}
              type="button"
              data-index={idx}
              onClick={() => onSelectIndex(idx)}
              aria-label={`Jump to question ${idx + 1}${isFlagged ? " (Flagged)" : ""}${isAnswered ? " (Answered)" : ""}`}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "relative min-w-[34px] min-h-[34px] w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-xs font-semibold shrink-0 transition-all flex items-center justify-center border cursor-pointer touch-manipulation",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isCurrent && "border-primary bg-primary text-white shadow-2xs font-bold ring-2 ring-primary/20",
                !isCurrent && isAnswered && "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 font-semibold",
                !isCurrent && !isAnswered && "border-border bg-background text-text-secondary hover:bg-surface-hover hover:border-slate-300"
              )}
            >
              {idx + 1}
              {isFlagged && (
                <span
                  aria-hidden="true"
                  className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-white shadow-2xs"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
