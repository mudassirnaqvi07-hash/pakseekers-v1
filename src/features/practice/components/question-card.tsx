/**
 * QuestionCard — PakSeekers Phase 2.
 *
 * Renders the active question header, difficulty indicator, question stem,
 * and the list of selectable options during practice.
 */

import type { Question, QuestionDifficulty } from "@/types";
import { Badge } from "@/components/ui";
import { AnswerOption } from "./answer-option";

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  selectedOptionId: string | null;
  onSelectOption: (optionId: string) => void;
  disabled?: boolean;
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
}: QuestionCardProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-6 sm:p-8 shadow-xs">
      {/* Meta header */}
      <div className="flex items-center justify-between gap-4 pb-5 border-b border-border mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold tracking-wider text-text-secondary uppercase">
            Question {questionNumber} of {totalQuestions}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={DIFFICULTY_VARIANT_MAP[question.difficulty]}
            dot
            className="capitalize"
          >
            {question.difficulty}
          </Badge>
        </div>
      </div>

      {/* Question Text */}
      <div className="mb-6">
        <h2 className="text-base sm:text-lg font-semibold text-text-primary leading-relaxed">
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
    </div>
  );
}
