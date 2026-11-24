import Link from "next/link";
import { BookOpen, FileCheck2, ArrowRight, Award } from "lucide-react";
import type { EnrolledExamDetails } from "@/types";
import { Badge, Button, Card, CardContent } from "@/components/ui";
import { RemoveExamDialog } from "./remove-exam-dialog";

interface ExamEnrollmentCardProps {
  details: EnrolledExamDetails;
}

export function ExamEnrollmentCard({ details }: ExamEnrollmentCardProps) {
  const { exam, totalSubjects, totalTests, completedAttempts, averageScore } = details;

  return (
    <Card className="shadow-2xs border-primary/20 hover:border-primary/40 transition-all flex flex-col justify-between">
      <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full gap-4">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded bg-primary/10 text-primary font-bold text-xs uppercase tracking-wide">
              {exam.code}
            </span>
            <div className="flex items-center gap-1.5">
              <Badge variant="success" className="text-[10px] py-0 font-bold">
                Approved Track
              </Badge>
              <RemoveExamDialog
                examId={exam.id}
                examTitle={exam.title}
                examCode={exam.code}
                size="xs"
              />
            </div>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-text-primary line-clamp-1">
            {exam.title}
          </h3>
          <p className="text-xs text-text-secondary line-clamp-2 mt-1">
            {exam.description}
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-surface-hover/60 border border-border text-center">
          <div>
            <div className="flex items-center justify-center gap-1 text-[11px] text-text-secondary">
              <BookOpen className="w-3 h-3 text-primary" />
              <span>Subjects</span>
            </div>
            <p className="text-sm font-bold text-text-primary mt-0.5">
              {totalSubjects}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1 text-[11px] text-text-secondary">
              <FileCheck2 className="w-3 h-3 text-emerald-600" />
              <span>Tests</span>
            </div>
            <p className="text-sm font-bold text-text-primary mt-0.5">
              {totalTests}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1 text-[11px] text-text-secondary">
              <Award className="w-3 h-3 text-amber-500" />
              <span>Accuracy</span>
            </div>
            <p className="text-sm font-bold text-text-primary mt-0.5">
              {averageScore !== null ? `${averageScore}%` : "—"}
            </p>
          </div>
        </div>

        {/* Action Footer */}
        <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
          <span className="text-[11px] text-text-secondary">
            {completedAttempts} test{completedAttempts === 1 ? "" : "s"} completed
          </span>
          <Link href={`/exams/${exam.id}`}>
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7 px-2.5 font-semibold"
              rightIcon={<ArrowRight className="w-3 h-3" />}
            >
              Enter Workspace
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
