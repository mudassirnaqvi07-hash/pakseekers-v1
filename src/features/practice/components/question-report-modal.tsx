"use client";

/**
 * Question Report Modal — PakSeekers Student Experience.
 *
 * Allows students to report questions during tests and practice
 * (wrong answer key, ambiguous statement, typo, out of syllabus).
 */

import { useState, useTransition } from "react";
import { Flag, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui";
import type { QuestionReportReason } from "@/types";
import { reportQuestionAction } from "@/server/actions/student-actions";

interface QuestionReportModalProps {
  questionId: string;
}

export function QuestionReportModal({ questionId }: QuestionReportModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState<QuestionReportReason>("wrong_answer");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function openModal() {
    setIsOpen(true);
    setError(null);
    setSuccess(false);
    setDescription("");
  }

  function closeModal() {
    setIsOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await reportQuestionAction({
        questionId,
        reason,
        description,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        closeModal();
      }, 1500);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-error transition-colors cursor-pointer select-none"
        title="Report an error or issue with this question"
      >
        <Flag className="w-3.5 h-3.5 shrink-0" />
        <span>Report Issue</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface rounded-xl max-w-md w-full border border-border shadow-xl p-5 sm:p-6 relative max-h-[90dvh] overflow-y-auto">
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-4 right-4 text-text-secondary hover:text-text-primary p-1"
            >
              <X className="w-5 h-5 shrink-0" />
            </button>

            <h3 className="text-base font-bold text-text-primary flex items-center gap-2 mb-1">
              <Flag className="w-4 h-4 text-error shrink-0" />
              Report Question Issue
            </h3>
            <p className="text-xs text-text-secondary mb-4 leading-relaxed">
              Help us maintain curriculum accuracy. Our academic team reviews every reported question.
            </p>

            {error && (
              <div className="p-3 mb-3 rounded-md bg-error/10 border border-error/20 flex items-center gap-2 text-xs text-error">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success ? (
              <div className="p-4 rounded-md bg-success/10 border border-success/20 flex flex-col items-center text-center gap-2 text-success">
                <CheckCircle2 className="w-8 h-8 shrink-0" />
                <p className="text-sm font-semibold">Thank you for reporting!</p>
                <p className="text-xs text-text-secondary">
                  Our academic verification team will review this question promptly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    Issue Category
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value as QuestionReportReason)}
                    className="w-full px-3 py-2 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="wrong_answer">Wrong Answer Marked in Key</option>
                    <option value="typo">Typo or Grammatical Error</option>
                    <option value="explanation_error">Incorrect or Misleading Explanation</option>
                    <option value="out_of_syllabus">Out of Official Syllabus</option>
                    <option value="other">Other Issue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    Description & Reference
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Briefly explain the issue (e.g. 'Option C is correct per Punjab Textbook Chapter 4')..."
                    className="w-full p-2.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={closeModal}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isPending}
                    className="text-xs font-semibold px-4"
                  >
                    Submit Report
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
