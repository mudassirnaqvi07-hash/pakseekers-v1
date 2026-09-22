/**
 * QuizNavigation — PakSeekers Phase 2.
 *
 * Controls navigation between questions and test submission.
 */

import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui";

interface QuizNavigationProps {
  currentIndex: number;
  totalQuestions: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export function QuizNavigation({
  currentIndex,
  totalQuestions,
  onPrevious,
  onNext,
  onSubmit,
  isSubmitting = false,
}: QuizNavigationProps) {
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalQuestions - 1;

  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      {/* Previous Button */}
      <Button
        type="button"
        variant="outline"
        onClick={onPrevious}
        disabled={isFirst}
        leftIcon={<ArrowLeft className="w-4 h-4" />}
      >
        Previous
      </Button>

      <div className="flex items-center gap-3">
        {/* If last question, show Submit directly */}
        {isLast ? (
          <Button
            type="button"
            variant="primary"
            onClick={onSubmit}
            isLoading={isSubmitting}
            leftIcon={<CheckCircle className="w-4 h-4" />}
            className="bg-secondary hover:bg-secondary-hover"
          >
            Submit Quiz
          </Button>
        ) : (
          <>
            {/* Direct Submit shortcut */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onSubmit}
              className="text-text-secondary hover:text-text-primary text-xs hidden sm:inline-flex"
            >
              Submit Early
            </Button>

            {/* Next Button */}
            <Button
              type="button"
              variant="primary"
              onClick={onNext}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Next Question
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
