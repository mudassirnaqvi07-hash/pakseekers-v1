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
    <div className="flex items-center justify-between gap-2 sm:gap-3 pt-2 w-full">
      {/* Previous Button */}
      <Button
        type="button"
        variant="outline"
        onClick={onPrevious}
        disabled={isFirst}
        className="px-2.5 sm:px-4"
        leftIcon={<ArrowLeft className="w-4 h-4 shrink-0" />}
      >
        <span className="hidden xs:inline">Previous</span>
        <span className="xs:hidden">Prev</span>
      </Button>

      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* If last question, show Submit directly */}
        {isLast ? (
          <Button
            type="button"
            variant="primary"
            onClick={onSubmit}
            isLoading={isSubmitting}
            leftIcon={<CheckCircle className="w-4 h-4 shrink-0" />}
            className="bg-secondary hover:bg-secondary-hover px-3 sm:px-4"
          >
            Submit Quiz
          </Button>
        ) : (
          <>
            {/* Direct Submit shortcut — accessible on both mobile and desktop */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onSubmit}
              className="text-text-secondary hover:text-text-primary text-xs px-2 sm:px-3 h-8 sm:h-auto"
              title="Submit examination"
            >
              <span className="sm:hidden">Submit</span>
              <span className="hidden sm:inline">Submit Early</span>
            </Button>

            {/* Next Button */}
            <Button
              type="button"
              variant="primary"
              onClick={onNext}
              className="px-2.5 sm:px-4"
              rightIcon={<ArrowRight className="w-4 h-4 shrink-0" />}
            >
              <span>Next</span>
              <span className="hidden xs:inline">&nbsp;Question</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
