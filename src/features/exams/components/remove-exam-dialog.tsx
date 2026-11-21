"use client";

/**
 * RemoveExamDialog — PakSeekers.
 *
 * Safe removal confirmation dialog.
 * Explicitly reassures the student that:
 * 1. Historical test attempts and scores will NOT be deleted.
 * 2. Progress records remain permanently in their profile.
 * 3. They can re-enroll at any time with no penalty.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Trash2, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui";
import { removeExamEnrollmentAction } from "@/server/actions/enrollment-actions";

interface RemoveExamDialogProps {
  examId: string;
  examTitle: string;
  examCode: string;
  triggerVariant?: "ghost" | "outline" | "danger";
  size?: "xs" | "sm" | "md";
}

export function RemoveExamDialog({
  examId,
  examTitle,
  examCode,
  triggerVariant = "ghost",
  size = "sm",
}: RemoveExamDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConfirmRemoval = () => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await removeExamEnrollmentAction(examId);
      if (res.success) {
        setIsOpen(false);
        router.refresh();
      } else {
        setErrorMessage(res.error || "Failed to remove examination.");
      }
    });
  };

  return (
    <>
      <Button
        type="button"
        variant={triggerVariant}
        size={size === "xs" ? "sm" : size}
        onClick={() => setIsOpen(true)}
        className="text-text-secondary hover:text-error hover:bg-error/10 text-xs h-7 px-2"
        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
      >
        Remove Track
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-surface border border-border rounded-xl shadow-xl max-w-md w-full p-6 flex flex-col gap-5 animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-exam-title"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3
                    id="remove-exam-title"
                    className="text-base font-bold text-text-primary leading-tight"
                  >
                    Remove {examCode} from Preparations?
                  </h3>
                  <p className="text-xs text-text-secondary mt-0.5 truncate max-w-xs">
                    {examTitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-text-secondary hover:text-text-primary p-1 rounded-md transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Explanation & Data Reassurance */}
            <div className="rounded-lg bg-surface-hover/80 border border-border p-3.5 flex flex-col gap-2.5 text-xs">
              <div className="flex items-start gap-2 text-text-primary font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Your historical attempts and scores are 100% safe.</span>
              </div>
              <p className="text-text-secondary text-[11px] leading-relaxed pl-6">
                Removing this preparation revokes access to the {examCode} workspace and new practice tests. However, all past test attempts, question rationales, and progress analytics will remain permanently saved in your account. You can re-enroll at any time.
              </p>
            </div>

            {errorMessage && (
              <div className="text-xs text-error font-medium p-2.5 rounded bg-error/10 border border-error/20">
                {errorMessage}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => setIsOpen(false)}
              >
                Keep in My Preparations
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                isLoading={isPending}
                onClick={handleConfirmRemoval}
              >
                Confirm Removal
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
