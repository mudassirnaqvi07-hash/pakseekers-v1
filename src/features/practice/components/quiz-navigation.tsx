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
    <div className="flex items-center justify-between gap-2.5 pt-3 w-full">
      {/* Previous Button */}
      <Button
        type="button"
        variant="outline"
        size="md"
        onClick={onPrevious}
        disabled={isFirst}
        className="px-3 sm:px-5 font-semibold text-xs sm:text-sm touch-manipulation"
        leftIcon={<ArrowLeft className="w-4 h-4 shrink-0" />}
      >
        <span>Previous</span>
      </Button>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* If last question, show Submit directly */}
        {isLast ? (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onSubmit}
            isLoading={isSubmitting}
            leftIcon={<CheckCircle className="w-4 h-4 shrink-0" />}
            className="px-4 sm:px-6 font-bold shadow-xs touch-manipulation"
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
              className="text-text-secondary hover:text-text-primary text-xs px-2 sm:px-3 h-9 touch-manipulation"
              title="Submit examination early"
            >
              <span>Submit Early</span>
            </Button>

            {/* Next Button */}
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={onNext}
              className="px-4 sm:px-6 font-bold shadow-xs touch-manipulation"
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
