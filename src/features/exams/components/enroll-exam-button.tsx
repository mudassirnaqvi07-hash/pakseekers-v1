"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, PlusCircle, ShieldAlert, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requestExamEnrollmentAction } from "@/server/actions/enrollment-actions";
import type { EnrollmentStatus } from "@/types/content";

interface EnrollExamButtonProps {
  examId: string;
  examCode?: string;
  isEnrolled?: boolean;
  enrollmentStatus?: EnrollmentStatus | null;
  variant?: "primary" | "outline";
  size?: "sm" | "md";
  className?: string;
  redirectToWorkspace?: boolean;
}

export function EnrollExamButton({
  examId,
  examCode,
  isEnrolled = false,
  enrollmentStatus,
  variant = "primary",
  size = "sm",
  className = "",
  redirectToWorkspace = true,
}: EnrollExamButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [localStatus, setLocalStatus] = useState<EnrollmentStatus | null>(
    enrollmentStatus ?? (isEnrolled ? "APPROVED" : null)
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const effectiveStatus: EnrollmentStatus | null =
    enrollmentStatus ?? (isEnrolled ? "APPROVED" : localStatus);

  const handleApply = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (effectiveStatus !== null || isPending) return;
    setErrorMessage(null);

    startTransition(async () => {
      const res = await requestExamEnrollmentAction(examId);
      if (res.success) {
        setLocalStatus(res.data?.status ?? "PENDING");
        router.refresh();
      } else {
        setErrorMessage(res.error || "Unable to submit enrollment request.");
        router.refresh();
      }
    });
  };

  if (effectiveStatus === "APPROVED" || effectiveStatus === "ACTIVE") {
    if (redirectToWorkspace) {
      return (
        <Link href={`/exams/${examId}`} className={className}>
          <Button
            type="button"
            variant="outline"
            size={size}
            className="border-emerald-600/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 w-full justify-center"
            leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
          >
            Approved • Open Track
          </Button>
        </Link>
      );
    }

    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-600/30 bg-emerald-500/10 text-emerald-700 text-xs font-semibold ${className}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Approved Enrollment</span>
      </div>
    );
  }

  if (effectiveStatus === "PENDING") {
    return (
      <Button
        type="button"
        variant="outline"
        size={size}
        disabled
        className={`border-amber-500/40 bg-amber-500/10 text-amber-800 opacity-100 cursor-default ${className}`}
        leftIcon={<Clock className="w-3.5 h-3.5 text-amber-600" />}
      >
        Pending Admin Approval
      </Button>
    );
  }

  if (effectiveStatus === "REJECTED") {
    return (
      <Button
        type="button"
        variant="outline"
        size={size}
        disabled
        className={`border-rose-500/35 bg-rose-500/10 text-rose-700 opacity-100 cursor-default ${className}`}
        leftIcon={<XCircle className="w-3.5 h-3.5 text-rose-600" />}
      >
        Enrollment Rejected
      </Button>
    );
  }

  if (effectiveStatus === "REVOKED" || effectiveStatus === "REMOVED") {
    return (
      <Button
        type="button"
        variant="outline"
        size={size}
        disabled
        className={`border-rose-500/35 bg-rose-500/10 text-rose-700 opacity-100 cursor-default ${className}`}
        leftIcon={<ShieldAlert className="w-3.5 h-3.5 text-rose-600" />}
      >
        Enrollment Revoked
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={isPending}
        onClick={handleApply}
        className={className}
        leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
      >
        {isPending
          ? "Submitting Request..."
          : examCode
          ? `Apply for ${examCode}`
          : "Apply for Enrollment"}
      </Button>
      {errorMessage && (
        <p className="text-[11px] font-medium text-rose-600">{errorMessage}</p>
      )}
    </div>
  );
}
