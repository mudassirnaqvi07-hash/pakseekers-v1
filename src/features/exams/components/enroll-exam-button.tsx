"use client";

/**
 * EnrollExamButton — PakSeekers.
 *
 * Interactive button allowing students to enroll in an examination track.
 * Provides instant optimistic feedback, loading states, and error handling.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, PlusCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";
import { enrollInExamAction } from "@/server/actions/enrollment-actions";

interface EnrollExamButtonProps {
  examId: string;
  examCode?: string;
  isEnrolled?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "outline" | "secondary";
  className?: string;
  redirectToWorkspace?: boolean;
}

export function EnrollExamButton({
  examId,
  examCode,
  isEnrolled = false,
  size = "sm",
  variant = "primary",
  className = "",
  redirectToWorkspace = false,
}: EnrollExamButtonProps) {
  const router = useRouter();
  const [enrolled, setEnrolled] = useState(isEnrolled);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleEnroll = async () => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await enrollInExamAction(examId);
      if (res.success) {
        setEnrolled(true);
        if (redirectToWorkspace) {
          router.push(`/exams/${examId}`);
        } else {
          router.refresh();
        }
      } else {
        setErrorMessage(res.error || "Failed to enroll. Please try again.");
      }
    });
  };

  if (enrolled) {
    return (
      <Button
        type="button"
        size={size}
        variant="outline"
        onClick={() => router.push(`/exams/${examId}`)}
        className={`border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 font-semibold ${className}`}
        leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
        rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
      >
        Enrolled • Go to Workspace
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        size={size}
        variant={variant}
        isLoading={isPending}
        onClick={handleEnroll}
        className={`font-semibold ${className}`}
        leftIcon={!isPending ? <PlusCircle className="w-4 h-4" /> : undefined}
      >
        {isPending ? "Enrolling..." : `Enroll in ${examCode || "Exam"}`}
      </Button>
      {errorMessage && (
        <span className="text-[11px] text-error font-medium">{errorMessage}</span>
      )}
    </div>
  );
}
