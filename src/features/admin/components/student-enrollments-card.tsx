"use client";

/**
 * StudentEnrollmentsCard — PakSeekers Admin.
 *
 * Allows admins to inspect, grant, approve, reject, and revoke examination track
 * enrollments for a student, with explicit confirmation before changing status.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, GraduationCap, Plus, ShieldAlert, XCircle } from "lucide-react";
import type { StudentEnrollment, Exam, EnrollmentStatus } from "@/types";
import { Button, Badge, Card, CardContent } from "@/components/ui";
import {
  adminUpdateStudentEnrollmentAction,
  approveEnrollmentAction,
  rejectEnrollmentAction,
  revokeEnrollmentAction,
} from "@/server/actions/enrollment-actions";

interface StudentEnrollmentsCardProps {
  studentId: string;
  studentName: string;
  enrollments: StudentEnrollment[];
  allExams: Exam[];
}

type ConfirmDecision =
  | { type: "approve" | "reject" | "revoke"; examId: string; examLabel: string }
  | { type: "grant"; examId: string; examLabel: string };

function getBadgeVariant(
  status: EnrollmentStatus
): "success" | "warning" | "error" | "neutral" {
  if (status === "APPROVED" || status === "ACTIVE") return "success";
  if (status === "PENDING") return "warning";
  if (status === "REJECTED" || status === "REVOKED" || status === "REMOVED") {
    return "error";
  }
  return "neutral";
}

export function StudentEnrollmentsCard({
  studentId,
  studentName,
  enrollments,
  allExams,
}: StudentEnrollmentsCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedExamId, setSelectedExamId] = useState("");
  const [pendingConfirm, setPendingConfirm] = useState<ConfirmDecision | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const examMap = new Map<string, Exam>(
    allExams.map((e) => [e.id.toLowerCase(), e])
  );

  const approvedExamIds = new Set(
    enrollments
      .filter((e) => e.status === "APPROVED" || e.status === "ACTIVE")
      .map((e) => e.examinationId.toLowerCase())
  );

  const availableToEnroll = allExams.filter(
    (e) => !approvedExamIds.has(e.id.toLowerCase())
  );

  const executeConfirmedAction = () => {
    if (!pendingConfirm || isPending) return;
    const current = pendingConfirm;
    setMessage(null);

    startTransition(async () => {
      let res;
      if (current.type === "grant") {
        res = await adminUpdateStudentEnrollmentAction(
          studentId,
          current.examId,
          "APPROVED"
        );
      } else if (current.type === "approve") {
        res = await approveEnrollmentAction(studentId, current.examId);
      } else if (current.type === "reject") {
        res = await rejectEnrollmentAction(studentId, current.examId);
      } else {
        res = await revokeEnrollmentAction(studentId, current.examId);
      }

      if (res.success) {
        if (current.type === "grant") {
          setSelectedExamId("");
        }
        setPendingConfirm(null);
        setMessage({
          type: "success",
          text: `Enrollment ${current.type} completed for ${current.examLabel}.`,
        });
        router.refresh();
      } else {
        setMessage({
          type: "error",
          text: res.error || "Failed to update enrollment status.",
        });
      }
    });
  };

  return (
    <Card className="shadow-xs border-border">
      <CardContent className="p-4 sm:p-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-text-primary">
              Examination Track Enrollments ({enrollments.length})
            </h3>
          </div>
          <span className="text-xs text-text-secondary">
            Manage preparation tracks for {studentName}
          </span>
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg text-xs font-medium ${
              message.type === "success"
                ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                : "bg-error/10 text-error border border-error/20"
            }`}
          >
            {message.text}
          </div>
        )}

        {pendingConfirm && (
          <div className="p-3.5 rounded-lg border border-amber-500/40 bg-amber-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs">
              <p className="font-bold text-amber-800 uppercase tracking-wider text-[10px]">
                Confirmation Required
              </p>
              <p className="font-semibold text-text-primary mt-0.5">
                Confirm {pendingConfirm.type} for {studentName} —{" "}
                {pendingConfirm.examLabel}?
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => setPendingConfirm(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                variant={
                  pendingConfirm.type === "reject" || pendingConfirm.type === "revoke"
                    ? "danger"
                    : "primary"
                }
                disabled={isPending}
                onClick={executeConfirmedAction}
              >
                {isPending ? "Saving..." : "Confirm"}
              </Button>
            </div>
          </div>
        )}

        {/* Grant Enrollment Bar */}
        {availableToEnroll.length > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-3 rounded-lg bg-surface-hover/60 border border-border">
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="text-xs rounded-lg border border-border bg-surface px-3 py-2 text-text-primary flex-1 focus:outline-hidden focus:ring-1 focus:ring-primary"
              disabled={isPending}
            >
              <option value="">-- Grant approved enrollment in exam track --</option>
              {availableToEnroll.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.title} ({exam.code})
                </option>
              ))}
            </select>
            <Button
              type="button"
              size="sm"
              variant="primary"
              disabled={!selectedExamId || isPending}
              onClick={() => {
                const target = examMap.get(selectedExamId.toLowerCase());
                setPendingConfirm({
                  type: "grant",
                  examId: selectedExamId,
                  examLabel: target?.title || selectedExamId,
                });
              }}
              className="h-8 text-xs shrink-0"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Grant Enrollment
            </Button>
          </div>
        )}

        {/* Enrollments List */}
        <div className="flex flex-col gap-2">
          {enrollments.length > 0 ? (
            enrollments.map((enr) => {
              const exam = examMap.get(enr.examinationId.toLowerCase());
              const examLabel = exam?.title || enr.examinationId;
              const isApproved =
                enr.status === "APPROVED" || enr.status === "ACTIVE";
              const isPendingReq = enr.status === "PENDING";

              return (
                <div
                  key={enr.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-surface border border-border"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-text-primary">
                        {examLabel}
                      </span>
                      <Badge
                        variant={getBadgeVariant(enr.status)}
                        className="text-[10px] font-bold uppercase"
                      >
                        {enr.status}
                      </Badge>
                      <Badge variant="default" className="text-[10px] py-0">
                        {enr.enrollmentSource}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary">
                      <span>
                        Requested:{" "}
                        {new Date(
                          enr.requestedAt || enr.enrolledAt
                        ).toLocaleDateString()}
                      </span>
                      {enr.decisionAt && (
                        <span>
                          Decision:{" "}
                          {new Date(enr.decisionAt).toLocaleDateString()}
                        </span>
                      )}
                      {enr.removedAt && (
                        <span>
                          Revoked: {new Date(enr.removedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isApproved && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={() =>
                          setPendingConfirm({
                            type: "approve",
                            examId: enr.examinationId,
                            examLabel,
                          })
                        }
                        className="text-xs h-7 px-2 border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10"
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      >
                        Approve
                      </Button>
                    )}

                    {isPendingReq && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isPending}
                        onClick={() =>
                          setPendingConfirm({
                            type: "reject",
                            examId: enr.examinationId,
                            examLabel,
                          })
                        }
                        className="text-xs h-7 px-2 text-rose-700 hover:bg-rose-500/10"
                        leftIcon={<XCircle className="w-3.5 h-3.5" />}
                      >
                        Reject
                      </Button>
                    )}

                    {isApproved && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isPending}
                        onClick={() =>
                          setPendingConfirm({
                            type: "revoke",
                            examId: enr.examinationId,
                            examLabel,
                          })
                        }
                        className="text-xs h-7 px-2 text-text-secondary hover:text-error hover:bg-error/10"
                        leftIcon={<ShieldAlert className="w-3.5 h-3.5" />}
                      >
                        Revoke Access
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-xs text-text-secondary border border-dashed border-border rounded-lg">
              No examination enrollments recorded for this student.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
