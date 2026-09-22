/**
 * QuestionReview — PakSeekers Phase 2.
 *
 * Detailed review card showing question text, student's chosen answer,
 * correct answer highlight, correctness badge, and in-depth explanation.
 */

import { CheckCircle2, HelpCircle, Lightbulb, XCircle } from "lucide-react";
import type { QuestionResultItem } from "@/types";
import { Badge } from "@/components/ui";
import { AnswerOption, type OptionReviewState } from "./answer-option";

interface QuestionReviewProps {
  item: QuestionResultItem;
  index: number;
}

export function QuestionReview({ item, index }: QuestionReviewProps) {
  const { question, selectedOptionId, correctOptionId, isCorrect, isAnswered } =
    item;

  // Determine status badge
  let statusBadge = (
    <Badge variant="error" dot className="bg-red-100 text-red-800 border-red-200">
      <XCircle className="w-3.5 h-3.5 mr-1" />
      Incorrect
    </Badge>
  );

  if (isCorrect) {
    statusBadge = (
      <Badge variant="success" dot className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
        Correct
      </Badge>
    );
  } else if (!isAnswered) {
    statusBadge = (
      <Badge variant="default" dot>
        <HelpCircle className="w-3.5 h-3.5 mr-1" />
        Skipped
      </Badge>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-6 sm:p-8 shadow-xs flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-border">
        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
          Question {index + 1}
        </span>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="capitalize text-xs">
            {question.difficulty}
          </Badge>
          {statusBadge}
        </div>
      </div>

      {/* Question Text */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-text-primary leading-relaxed">
          {question.questionText}
        </h3>
      </div>

      {/* Options in Review State */}
      <div className="flex flex-col gap-2.5">
        {question.options.map((option) => {
          let reviewState: OptionReviewState = "unselected";
          const isSelected = selectedOptionId === option.id;
          const isThisOptionCorrect = option.id === correctOptionId;

          if (isThisOptionCorrect) {
            reviewState = "correct";
          } else if (isSelected && !isThisOptionCorrect) {
            reviewState = "incorrect";
          }

          return (
            <AnswerOption
              key={option.id}
              option={option}
              isSelected={isSelected}
              reviewState={reviewState}
              showFeedback={true}
              disabled
            />
          );
        })}
      </div>

      {/* Explanation Box */}
      <div className="rounded-lg bg-blue-50/70 border border-blue-200 p-4 sm:p-5 mt-2">
        <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-2">
          <Lightbulb className="w-4 h-4 text-accent shrink-0" />
          <span>Explanation & Key Learning Points</span>
        </div>
        <p className="text-sm text-text-primary leading-relaxed">
          {question.explanation}
        </p>
      </div>
    </div>
  );
}
