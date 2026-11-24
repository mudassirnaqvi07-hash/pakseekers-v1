import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Lock,
  ShieldAlert,
  UserCheck,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EnrollExamButton } from "./enroll-exam-button";
import type { EnrollmentStatus } from "@/types/content";

interface EnrollmentAccessGateProps {
  examId: string;
  examTitle?: string;
  examCode?: string;
  enrollmentStatus?: EnrollmentStatus | null;
  decisionNotes?: string | null;
  isAuthenticated: boolean;
  userRole?: string | null;
  callbackUrl?: string;
  resourceLabel?: string;
}

export function EnrollmentAccessGate({
  examId,
  examTitle,
  examCode,
  enrollmentStatus = null,
  decisionNotes = null,
  isAuthenticated,
  userRole = null,
  callbackUrl,
  resourceLabel = "subjects, topics, question banks, and practice tests",
}: EnrollmentAccessGateProps) {
  const loginHref = `/student/login${
    callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""
  }`;
  const displayExam = examTitle || examCode || "this examination program";

  let badgeVariant: "warning" | "error" | "info" | "neutral" = "info";
  let badgeText = "Approval Required";
  let title = "Enrollment Required to Access Content";
  let description = `Access to ${displayExam} (${resourceLabel}) is restricted to students with an Admin-approved enrollment.`;
  let Icon = Lock;
  let iconBg = "bg-primary/10 text-primary";

  if (!isAuthenticated) {
    badgeVariant = "neutral";
    badgeText = "Student Account Required";
    title = "Sign In to Request Exam Enrollment";
    description = `Sign in to your student account to apply for enrollment in ${displayExam}. Curriculum subjects, topics, and practice tests unlock once an Admin approves your request.`;
  } else if (userRole === "staff") {
    badgeVariant = "warning";
    badgeText = "Student Enrollment Only";
    title = "Staff Accounts Cannot Enroll in Student Tracks";
    description = `Exam workspaces and test attempts are restricted to students with approved enrollments. Manage curriculum materials from your Staff Portal.`;
    Icon = ShieldAlert;
    iconBg = "bg-amber-500/10 text-amber-700";
  } else if (enrollmentStatus === "PENDING") {
    badgeVariant = "warning";
    badgeText = "Pending Admin Approval";
    title = "Your Enrollment Request is Pending Review";
    description = `Your enrollment request for ${displayExam} has been submitted and is waiting for Administrator approval. You will gain access to all ${resourceLabel} once approved.`;
    Icon = Clock;
    iconBg = "bg-amber-500/10 text-amber-700";
  } else if (enrollmentStatus === "REJECTED") {
    badgeVariant = "error";
    badgeText = "Request Rejected";
    title = "Enrollment Request Was Rejected";
    description = `Your enrollment request for ${displayExam} was not approved by an Administrator, so access to ${resourceLabel} remains locked.`;
    Icon = XCircle;
    iconBg = "bg-rose-500/10 text-rose-700";
  } else if (enrollmentStatus === "REVOKED" || enrollmentStatus === "REMOVED") {
    badgeVariant = "error";
    badgeText = "Enrollment Revoked";
    title = "Your Enrollment Access Was Revoked";
    description = `An Administrator has revoked your enrollment for ${displayExam}. Access to ${resourceLabel} has been removed.`;
    Icon = ShieldAlert;
    iconBg = "bg-rose-500/10 text-rose-700";
  }

  return (
    <Card className="border-border bg-surface shadow-2xs">
      <CardContent className="p-6 sm:p-10 flex flex-col items-center text-center gap-4 max-w-2xl mx-auto">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}
        >
          <Icon className="w-6 h-6" />
        </div>

        <Badge variant={badgeVariant} className="text-xs font-semibold">
          {badgeText}
        </Badge>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-text-primary">{title}</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            {description}
          </p>
        </div>

        {decisionNotes &&
          (enrollmentStatus === "REJECTED" ||
            enrollmentStatus === "REVOKED" ||
            enrollmentStatus === "REMOVED") && (
            <div className="w-full rounded-lg border border-rose-500/25 bg-rose-500/5 px-4 py-3 text-left">
              <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                Administrator Note
              </p>
              <p className="text-xs text-text-primary mt-1">{decisionNotes}</p>
            </div>
          )}

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {!isAuthenticated ? (
            <Link href={loginHref}>
              <Button size="sm" leftIcon={<UserCheck className="w-4 h-4" />}>
                Sign In as Student
              </Button>
            </Link>
          ) : userRole === "staff" ? (
            <Link href="/staff/dashboard">
              <Button size="sm">Return to Staff Dashboard</Button>
            </Link>
          ) : (
            <>
              <EnrollExamButton
                examId={examId}
                examCode={examCode}
                enrollmentStatus={enrollmentStatus}
                size="sm"
                redirectToWorkspace={false}
              />
              {userRole === "student" && (
                <Link href="/student/dashboard">
                  <Button variant="outline" size="sm">
                    Student Dashboard
                  </Button>
                </Link>
              )}
            </>
          )}

          <Link href="/exams">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              Browse All Exams
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
