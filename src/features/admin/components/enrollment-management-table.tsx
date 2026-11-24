"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldAlert,
  User,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  approveEnrollmentAction,
  rejectEnrollmentAction,
  revokeEnrollmentAction,
} from "@/server/actions/enrollment-actions";
import type { AdminEnrollmentView } from "@/server/services/enrollment-service";
import type { EnrollmentStatus } from "@/types/content";

interface EnrollmentManagementTableProps {
  items: AdminEnrollmentView[];
}

type PendingActionType = "approve" | "reject" | "revoke";

interface PendingConfirmation {
  studentId: string;
  studentName: string;
  examId: string;
  examTitle: string;
  examCode: string;
  action: PendingActionType;
}

function getStatusBadge(status: EnrollmentStatus) {
  if (status === "APPROVED" || status === "ACTIVE") {
    return (
      <Badge variant="success" className="text-[11px] font-semibold">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Approved
      </Badge>
    );
  }
  if (status === "PENDING") {
    return (
      <Badge variant="warning" className="text-[11px] font-semibold">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    );
  }
  if (status === "REJECTED") {
    return (
      <Badge variant="error" className="text-[11px] font-semibold">
        <XCircle className="w-3 h-3 mr-1" />
        Rejected
      </Badge>
    );
  }
  return (
    <Badge variant="error" className="text-[11px] font-semibold">
      <ShieldAlert className="w-3 h-3 mr-1" />
      Revoked
    </Badge>
  );
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function EnrollmentManagementTable({
  items,
}: EnrollmentManagementTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmState, setConfirmState] = useState<PendingConfirmation | null>(null);
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const openConfirmation = (
    item: AdminEnrollmentView,
    action: PendingActionType
  ) => {
    setFeedback(null);
    setNotes("");
    setConfirmState({
      studentId: item.enrollment.studentId,
      studentName: item.student?.name || item.enrollment.studentId,
      examId: item.enrollment.examinationId,
      examTitle: item.exam?.title || item.enrollment.examinationId,
      examCode: item.exam?.code || item.enrollment.examinationId.toUpperCase(),
      action,
    });
  };

  const handleConfirm = () => {
    if (!confirmState || isPending) return;
    const { studentId, examId, action, studentName, examCode } = confirmState;
    const trimmedNotes = notes.trim() || undefined;

    startTransition(async () => {
      const res =
        action === "approve"
          ? await approveEnrollmentAction(studentId, examId, trimmedNotes)
          : action === "reject"
          ? await rejectEnrollmentAction(studentId, examId, trimmedNotes)
          : await revokeEnrollmentAction(studentId, examId, trimmedNotes);

      if (res.success) {
        const pastTense =
          action === "approve"
            ? "approved"
            : action === "reject"
            ? "rejected"
            : "revoked";
        setFeedback({
          type: "success",
          text: `Enrollment ${pastTense} for ${studentName} (${examCode}).`,
        });
        setConfirmState(null);
        setNotes("");
        router.refresh();
      } else {
        setFeedback({
          type: "error",
          text: res.error || "Failed to update enrollment status.",
        });
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {feedback && (
        <div
          className={`rounded-lg border px-4 py-3 text-xs font-medium flex items-center justify-between gap-2 ${
            feedback.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800"
              : "border-rose-500/30 bg-rose-500/10 text-rose-700"
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {confirmState && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 sm:p-5 flex flex-col gap-3 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Confirmation Required
              </p>
              <h3 className="text-sm sm:text-base font-bold text-text-primary mt-0.5">
                {confirmState.action === "approve" &&
                  `Approve ${confirmState.studentName} for ${confirmState.examCode}?`}
                {confirmState.action === "reject" &&
                  `Reject ${confirmState.studentName}'s request for ${confirmState.examCode}?`}
                {confirmState.action === "revoke" &&
                  `Revoke ${confirmState.studentName}'s approved enrollment in ${confirmState.examCode}?`}
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                {confirmState.action === "approve" &&
                  "This will immediately grant the student access to all subjects, topics, question banks, and tests in this examination."}
                {confirmState.action === "reject" &&
                  "The student will remain blocked from accessing curriculum and tests for this examination."}
                {confirmState.action === "revoke" &&
                  "The student's access to this examination's subjects, topics, and tests will be removed immediately."}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                confirmState.action === "approve"
                  ? "Optional approval note..."
                  : "Optional reason or reviewer note (shown to student)..."
              }
              className="flex-1 px-3 py-2 text-xs rounded-md border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => setConfirmState(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                variant={confirmState.action === "approve" ? "primary" : "danger"}
                disabled={isPending}
                onClick={handleConfirm}
              >
                {isPending
                  ? "Processing..."
                  : confirmState.action === "approve"
                  ? "Confirm Approval"
                  : confirmState.action === "reject"
                  ? "Confirm Rejection"
                  : "Confirm Revocation"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-surface border border-border rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[820px]">
            <thead className="bg-background border-b border-border text-xs font-semibold text-text-secondary uppercase tracking-wider">
              <tr>
                <th className="px-4 sm:px-5 py-3">Student</th>
                <th className="px-4 sm:px-5 py-3">Examination</th>
                <th className="px-4 sm:px-5 py-3">Status</th>
                <th className="px-4 sm:px-5 py-3">Requested</th>
                <th className="px-4 sm:px-5 py-3">Decision / History</th>
                <th className="px-4 sm:px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => {
                const { enrollment, student, exam, approver } = item;
                const status = enrollment.status;
                const isApproved = status === "APPROVED" || status === "ACTIVE";
                const isPendingReq = status === "PENDING";
                const isRejectedOrRevoked =
                  status === "REJECTED" ||
                  status === "REVOKED" ||
                  status === "REMOVED";

                return (
                  <tr
                    key={enrollment.id}
                    className="hover:bg-background/60 transition-colors"
                  >
                    <td className="px-4 sm:px-5 py-4 align-top">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-text-primary truncate">
                              {student?.name || "Unknown Student"}
                            </span>
                            {student && (
                              <Link
                                href={`/admin/students/${student.id}`}
                                className="text-primary hover:underline inline-flex items-center"
                                title="View student profile"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            )}
                          </div>
                          <div className="text-xs text-text-secondary truncate">
                            {student?.email || enrollment.studentId}
                          </div>
                          {student?.targetExam && (
                            <div className="text-[11px] text-text-secondary mt-0.5">
                              Target: {student.targetExam}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 sm:px-5 py-4 align-top">
                      <span className="inline-block px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-[11px] uppercase tracking-wide">
                        {exam?.code || enrollment.examinationId}
                      </span>
                      <div className="text-xs font-semibold text-text-primary mt-1">
                        {exam?.title || enrollment.examinationId}
                      </div>
                    </td>

                    <td className="px-4 sm:px-5 py-4 align-top">
                      {getStatusBadge(status)}
                      {enrollment.decisionNotes && (
                        <p className="text-[11px] text-text-secondary mt-1.5 max-w-[180px] line-clamp-2">
                          Note: {enrollment.decisionNotes}
                        </p>
                      )}
                    </td>

                    <td className="px-4 sm:px-5 py-4 align-top text-xs text-text-secondary">
                      <div className="font-medium text-text-primary">
                        {formatDate(enrollment.requestedAt || enrollment.enrolledAt)}
                      </div>
                      <div className="text-[11px] mt-0.5 capitalize">
                        {enrollment.enrollmentSource
                          .toLowerCase()
                          .replaceAll("_", " ")}
                      </div>
                    </td>

                    <td className="px-4 sm:px-5 py-4 align-top text-xs text-text-secondary">
                      <div>{formatDate(enrollment.decisionAt || enrollment.updatedAt)}</div>
                      {approver && (
                        <div className="text-[11px] text-text-primary mt-0.5">
                          By: {approver.name}
                        </div>
                      )}
                    </td>

                    <td className="px-4 sm:px-5 py-4 align-top text-right">
                      <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                        {(isPendingReq || isRejectedOrRevoked) && (
                          <Button
                            type="button"
                            size="sm"
                            variant="primary"
                            disabled={isPending}
                            onClick={() => openConfirmation(item, "approve")}
                          >
                            Approve
                          </Button>
                        )}
                        {isPendingReq && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-rose-500/35 text-rose-700 hover:bg-rose-500/10"
                            disabled={isPending}
                            onClick={() => openConfirmation(item, "reject")}
                          >
                            Reject
                          </Button>
                        )}
                        {isApproved && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-rose-500/35 text-rose-700 hover:bg-rose-500/10"
                            disabled={isPending}
                            onClick={() => openConfirmation(item, "revoke")}
                          >
                            Revoke
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
