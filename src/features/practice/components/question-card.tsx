/**
 * QuestionCard — PakSeekers Phase 2.
 *
 * Renders the active question header, difficulty indicator, question stem,
 * and the list of selectable options during practice.
 */

import type { Question, ClientQuestion, QuestionDifficulty } from "@/types";
import { Bookmark } from "lucide-react";
import { Badge } from "@/components/ui";
import { AnswerOption } from "./answer-option";
import { QuestionReportModal } from "./question-report-modal";

interface QuestionCardProps {
  question: ClientQuestion | Question;
  questionNumber: number;
  totalQuestions: number;
  selectedOptionId: string | null;
  onSelectOption: (optionId: string) => void;
  disabled?: boolean;
  isFlagged?: boolean;
  onToggleFlag?: () => void;
}

const DIFFICULTY_VARIANT_MAP: Record<
  QuestionDifficulty,
  "success" | "warning" | "error"
> = {
  easy: "success",
  medium: "warning",
  hard: "error",
};

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedOptionId,
  onSelectOption,
  disabled = false,
  isFlagged = false,
  onToggleFlag,
}: QuestionCardProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 shadow-2xs min-w-0">
      {/* Meta header */}
      <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-border mb-4 sm:mb-5">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-xs font-bold tracking-wider text-text-secondary uppercase">
            Question {questionNumber} of {totalQuestions}
          </span>
          {onToggleFlag && (
            <button
              type="button"
              onClick={onToggleFlag}
              aria-label={isFlagged ? "Unflag question" : "Flag question for review"}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer min-h-[36px] touch-manipulation ${
                isFlagged
                  ? "bg-amber-500/15 text-amber-800 border-amber-500/40 font-semibold"
                  : "bg-surface text-text-secondary border-border hover:bg-background"
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 shrink-0 ${isFlagged ? "fill-amber-600 text-amber-600" : ""}`} />
              <span>{isFlagged ? "Flagged" : "Flag"}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge
            variant={DIFFICULTY_VARIANT_MAP[question.difficulty]}
            dot
            className="capitalize text-xs font-semibold"
          >
            {question.difficulty}
          </Badge>
        </div>
      </div>

      {/* Question Text */}
      <div className="mb-5 sm:mb-6">
        <h2 className="text-base sm:text-lg font-semibold text-text-primary leading-relaxed break-words">
          {question.questionText}
        </h2>
      </div>

      {/* Options List */}
      <div className="flex flex-col gap-3" role="radiogroup" aria-label="Multiple choice options">
        {question.options.map((option) => (
          <AnswerOption
            key={option.id}
            option={option}
            isSelected={selectedOptionId === option.id}
            onSelect={onSelectOption}
            disabled={disabled}
            reviewState="none"
          />
        ))}
      </div>

      {/* Footer controls: Report Issue */}
      <div className="mt-5 sm:mt-6 pt-4 border-t border-border/80 flex flex-col xs:flex-row xs:items-center justify-between gap-2 text-xs text-text-secondary">
        <span className="text-[11px] text-text-secondary">
          Select the best answer among the options above
        </span>
        <div className="self-end xs:self-auto shrink-0">
          <QuestionReportModal questionId={question.id} />
        </div>
      </div>
    </div>
  );
}
