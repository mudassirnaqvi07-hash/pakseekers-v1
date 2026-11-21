"use client";

/**
 * StudentEnrollmentsCard — PakSeekers Admin.
 *
 * Allows admins to inspect, grant, and manage examination track enrollments
 * for a student.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Plus, XCircle, RotateCcw } from "lucide-react";
import type { StudentEnrollment, Exam } from "@/types";
import { Button, Badge, Card, CardContent } from "@/components/ui";
import { adminUpdateStudentEnrollmentAction } from "@/server/actions/enrollment-actions";

interface StudentEnrollmentsCardProps {
  studentId: string;
  studentName: string;
  enrollments: StudentEnrollment[];
  allExams: Exam[];
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
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const examMap = new Map<string, Exam>(
    allExams.map((e) => [e.id.toLowerCase(), e])
  );

  const activeEnrolledExamIds = new Set(
    enrollments
      .filter((e) => e.status === "ACTIVE")
      .map((e) => e.examinationId.toLowerCase())
  );

  const availableToEnroll = allExams.filter(
    (e) => !activeEnrolledExamIds.has(e.id.toLowerCase())
  );

  const handleUpdateStatus = (examId: string, newStatus: "ACTIVE" | "REMOVED") => {
    setMessage(null);
    startTransition(async () => {
      const res = await adminUpdateStudentEnrollmentAction(studentId, examId, newStatus);
      if (res.success) {
        setMessage({
          type: "success",
          text: `Enrollment status updated to ${newStatus}.`,
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

  const handleGrantEnrollment = () => {
    if (!selectedExamId) return;
    setMessage(null);
    startTransition(async () => {
      const res = await adminUpdateStudentEnrollmentAction(studentId, selectedExamId, "ACTIVE");
      if (res.success) {
        setSelectedExamId("");
        setMessage({
          type: "success",
          text: "Administrative enrollment granted successfully.",
        });
        router.refresh();
      } else {
        setMessage({
          type: "error",
          text: res.error || "Failed to grant enrollment.",
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
                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                : "bg-error/10 text-error border border-error/20"
            }`}
          >
            {message.text}
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
              <option value="">-- Grant enrollment in examination track --</option>
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
              isLoading={isPending}
              onClick={handleGrantEnrollment}
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
              const isActive = enr.status === "ACTIVE";

              return (
                <div
                  key={enr.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-surface border border-border"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-text-primary">
                        {exam?.title || enr.examinationId}
                      </span>
                      <Badge
                        variant={isActive ? "success" : "neutral"}
                        className="text-[10px] font-bold uppercase"
                      >
                        {enr.status}
                      </Badge>
                      <Badge variant="default" className="text-[10px] py-0">
                        {enr.enrollmentSource}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-secondary">
                      <span>
                        Enrolled: {new Date(enr.enrolledAt).toLocaleDateString()}
                      </span>
                      {enr.removedAt && (
                        <span>
                          Removed: {new Date(enr.removedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isActive ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleUpdateStatus(enr.examinationId, "REMOVED")}
                        className="text-xs h-7 px-2 text-text-secondary hover:text-error hover:bg-error/10"
                        leftIcon={<XCircle className="w-3.5 h-3.5" />}
                      >
                        Revoke Access
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleUpdateStatus(enr.examinationId, "ACTIVE")}
                        className="text-xs h-7 px-2 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
                        leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                      >
                        Reactivate Track
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
