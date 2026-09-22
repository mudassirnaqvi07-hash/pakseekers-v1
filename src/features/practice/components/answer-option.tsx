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
  let containerStyles = "border-border bg-surface hover:bg-slate-50/70 hover:border-slate-300";
  let badgeStyles = "border-border bg-background text-text-secondary";

  if (isInteractive) {
    if (isSelected) {
      containerStyles = "border-primary bg-primary/5 ring-2 ring-primary/20";
      badgeStyles = "border-primary bg-primary text-white font-semibold";
    }
  } else {
    // Review mode
    if (reviewState === "correct") {
      containerStyles = "border-green-500 bg-green-50/70 text-green-950 ring-1 ring-green-500";
      badgeStyles = "border-green-600 bg-green-600 text-white font-bold";
    } else if (reviewState === "incorrect") {
      containerStyles = "border-red-500 bg-red-50/70 text-red-950 ring-1 ring-red-500";
      badgeStyles = "border-red-600 bg-red-600 text-white font-bold";
    } else {
      containerStyles = "border-border bg-surface opacity-70";
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
      className={cn(
        "w-full text-left p-4 rounded-lg border transition-all duration-150 flex items-start gap-3.5 group relative",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
        disabled && isInteractive && "opacity-50 cursor-not-allowed",
        !disabled && isInteractive && "cursor-pointer",
        containerStyles
      )}
    >
      {/* Option Letter Badge (A, B, C, D) */}
      <span
        className={cn(
          "w-7 h-7 rounded-md border flex items-center justify-center text-xs shrink-0 transition-colors",
          badgeStyles
        )}
      >
        {option.label}
      </span>

      {/* Option Text */}
      <div className="flex-1 text-sm font-medium text-text-primary pt-0.5 leading-relaxed">
        {option.text}
      </div>

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
