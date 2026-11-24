/**
 * AnswerOption — PakSeekers Phase 2.
 *
 * Reusable MCQ option component. Supports interactive selection during a quiz
 * as well as review state (correct, incorrect, neutral) post-submission.
 */

import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { QuestionOption } from "@/types";

export type OptionReviewState = "none" | "correct" | "incorrect" | "unselected";

interface AnswerOptionProps {
  option: QuestionOption;
  isSelected: boolean;
  onSelect?: (optionId: string) => void;
  disabled?: boolean;
  reviewState?: OptionReviewState;
  showFeedback?: boolean;
}

export function AnswerOption({
  option,
  isSelected,
  onSelect,
  disabled = false,
  reviewState = "none",
  showFeedback = false,
}: AnswerOptionProps) {
  const isInteractive = reviewState === "none";

  // Dynamic styling based on review or interactive state
  let containerStyles = "border-border bg-surface hover:bg-primary/5 hover:border-primary/30";
  let badgeStyles = "border-border bg-background text-text-secondary group-hover:border-primary/40";

  if (isInteractive) {
    if (isSelected) {
      containerStyles = "border-primary bg-primary/10 ring-2 ring-primary/30 shadow-2xs";
      badgeStyles = "border-primary bg-primary text-white font-bold shadow-2xs";
    }
  } else {
    // Review mode
    if (reviewState === "correct") {
      containerStyles = "border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600";
      badgeStyles = "border-emerald-600 bg-emerald-700 text-white font-bold";
    } else if (reviewState === "incorrect") {
      containerStyles = "border-red-500 bg-red-50/80 text-red-950 ring-1 ring-red-500";
      badgeStyles = "border-red-600 bg-red-600 text-white font-bold";
    } else {
      containerStyles = "border-border bg-surface opacity-60";
      badgeStyles = "border-border bg-background text-text-secondary";
    }
  }

  const handleClick = () => {
    if (!disabled && onSelect && isInteractive) {
      onSelect(option.id);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || !isInteractive}
      aria-pressed={isSelected}
      data-multiline="true"
      className={cn(
        "w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all duration-150 flex items-start gap-3 sm:gap-3.5 group relative min-h-[50px] touch-manipulation active:scale-[0.99]",
        "whitespace-normal break-words",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
        disabled && isInteractive && "opacity-50 cursor-not-allowed",
        !disabled && isInteractive && "cursor-pointer",
        containerStyles
      )}
    >
      {/* Option Letter Badge (A, B, C, D) */}
      <span
        className={cn(
          "w-7 h-7 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center text-xs sm:text-sm font-semibold shrink-0 transition-colors mt-0.5",
          badgeStyles
        )}
      >
        {option.label}
      </span>

      {/* Option Text */}
      <div className="flex-1 min-w-0 text-sm sm:text-base font-normal text-text-primary pt-0.5 leading-relaxed break-words">
        {option.text}
      </div>

      {/* Selected Indicator in Interactive Mode */}
      {isInteractive && isSelected && (
        <div className="flex items-center gap-1.5 text-xs font-bold text-primary shrink-0 pt-1 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
          <span className="hidden xs:inline">Selected</span>
        </div>
      )}

      {/* Review Feedback Icons */}
      {showFeedback && reviewState === "correct" && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-green-700 shrink-0 pt-1">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span className="hidden sm:inline">Correct Answer</span>
        </div>
      )}

      {showFeedback && reviewState === "incorrect" && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-red-700 shrink-0 pt-1">
          <XCircle className="w-4 h-4 text-red-600" />
          <span className="hidden sm:inline">Your Selection</span>
        </div>
      )}
    </button>
  );
}
