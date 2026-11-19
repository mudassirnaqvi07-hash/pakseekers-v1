"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, BookOpen } from "lucide-react";
import { Button } from "@/components/ui";

export default function ExamsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Exams curriculum error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface border border-border rounded-xl p-6 sm:p-8 text-center flex flex-col items-center gap-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-text-primary">
            Curriculum Catalog Unavailable
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            We could not retrieve the examination syllabus data. Please try again or return to the catalog home.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={() => reset()}
            className="w-full sm:w-1/2"
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Try Again
          </Button>

          <Link href="/exams" className="w-full sm:w-1/2">
            <Button
              variant="outline"
              size="md"
              className="w-full"
              leftIcon={<BookOpen className="w-4 h-4" />}
            >
              Exams Catalog
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
