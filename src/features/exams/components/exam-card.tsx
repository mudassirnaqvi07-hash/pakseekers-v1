import Link from "next/link";
import { ArrowRight, BookOpen, Lock } from "lucide-react";
import { Badge, Button, Card, CardContent } from "@/components/ui";
import { EnrollExamButton } from "./enroll-exam-button";
import type { EnrollmentStatus, Exam } from "@/types/content";

interface ExamCardProps {
  exam: Exam;
  isEnrolled?: boolean;
  enrollmentStatus?: EnrollmentStatus | null;
  showEnrollAction?: boolean;
}

export function ExamCard({
  exam,
  isEnrolled = false,
  enrollmentStatus = null,
  showEnrollAction = false,
}: ExamCardProps) {
  const effectiveStatus: EnrollmentStatus | null =
    enrollmentStatus ?? (isEnrolled ? "APPROVED" : null);

  const isApproved =
    effectiveStatus === "APPROVED" || effectiveStatus === "ACTIVE";

  return (
    <Card className="h-full flex flex-col justify-between border-border hover:border-primary/40 transition-all shadow-2xs">
      <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="px-2.5 py-1 rounded-md bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider">
              {exam.code}
            </span>

            {isApproved ? (
              <Badge variant="success" className="text-[11px] font-semibold">
                Approved Track
              </Badge>
            ) : effectiveStatus === "PENDING" ? (
              <Badge variant="warning" className="text-[11px] font-semibold">
                Pending Approval
              </Badge>
            ) : effectiveStatus === "REJECTED" ? (
              <Badge variant="error" className="text-[11px] font-semibold">
                Rejected
              </Badge>
            ) : effectiveStatus === "REVOKED" || effectiveStatus === "REMOVED" ? (
              <Badge variant="error" className="text-[11px] font-semibold">
                Revoked
              </Badge>
            ) : (
              <Badge variant="neutral" className="text-[11px] font-medium">
                {exam.totalSubjects} {exam.totalSubjects === 1 ? "Subject" : "Subjects"}
              </Badge>
            )}
          </div>

          <h3 className="text-lg font-bold text-text-primary leading-snug">
            {exam.title}
          </h3>
          <p className="text-xs sm:text-sm text-text-secondary mt-2 line-clamp-3 leading-relaxed">
            {exam.description}
          </p>
        </div>

        <div className="pt-4 border-t border-border flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              <span>{exam.totalSubjects} Curriculum Subjects</span>
            </span>
            {!isApproved && showEnrollAction && (
              <span className="inline-flex items-center gap-1 text-[11px] text-text-secondary">
                <Lock className="w-3 h-3" />
                <span>Admin approval required</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            {showEnrollAction && (
              <EnrollExamButton
                examId={exam.id}
                examCode={exam.code}
                enrollmentStatus={effectiveStatus}
                size="sm"
                redirectToWorkspace={true}
              />
            )}

            <Link href={`/exams/${exam.id}`} className="ml-auto">
              <Button
                variant={isApproved ? "primary" : "outline"}
                size="sm"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                {isApproved ? "Enter Workspace" : "View Details"}
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
