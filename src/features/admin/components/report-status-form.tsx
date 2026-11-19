"use client";

/**
 * Question Report Status Form — PakSeekers Admin.
 *
 * Allows administrators to update question issue report status ("pending",
 * "under_review", "resolved", "rejected") and add admin resolution notes.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Save } from "lucide-react";
import { Button } from "@/components/ui";
import type { QuestionReport, QuestionReportStatus } from "@/types";
import { updateQuestionReportStatusAction } from "@/server/actions/admin-actions";

interface ReportStatusFormProps {
  report: QuestionReport;
}

export function ReportStatusForm({ report }: ReportStatusFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<QuestionReportStatus>(report.status);
  const [notes, setNotes] = useState(report.adminNotes || "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updateQuestionReportStatusAction(
        report.id,
        status,
        notes
      );

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.refresh();
      }, 600);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="p-3 rounded-md bg-error/10 border border-error/20 flex items-center gap-2 text-xs text-error">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-md bg-success/10 border border-success/20 flex items-center gap-2 text-xs text-success">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Report status and resolution notes updated!</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
            Report Triage Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as QuestionReportStatus)}
            className="w-full px-3 py-2 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="pending">Pending (Awaiting Review)</option>
            <option value="under_review">Under Review (Investigating)</option>
            <option value="resolved">Resolved (Question Updated / Fixed)</option>
            <option value="rejected">Rejected (Report Invalid)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
            Admin Resolution Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Document actions taken, e.g. 'Option C verified as correct per PMDC textbook page 114. Answer key corrected in question bank.'"
            className="w-full p-3 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          variant="primary"
          size="sm"
          isLoading={isPending}
          className="px-6 font-semibold"
          leftIcon={<Save className="w-3.5 h-3.5 shrink-0" />}
        >
          Update Resolution
        </Button>
      </div>
    </form>
  );
}
