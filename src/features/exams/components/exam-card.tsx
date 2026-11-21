/**
 * ExamCard — PakSeekers Phase 2.
 *
 * Displays high-level exam metadata and links to the exam subjects view.
 */

import Link from "next/link";
import { ArrowRight, Layers, CheckCircle2 } from "lucide-react";
import type { Exam } from "@/types";
import { Badge } from "@/components/ui";
import { EnrollExamButton } from "./enroll-exam-button";

interface ExamCardProps {
  exam: Exam;
  isEnrolled?: boolean;
  showEnrollAction?: boolean;
}

export function ExamCard({ exam, isEnrolled = false, showEnrollAction = false }: ExamCardProps) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group min-w-0">
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded bg-primary/10 text-primary font-bold text-xs tracking-wide uppercase">
            {exam.code}
          </span>
          {isEnrolled ? (
            <Badge variant="success" className="text-xs font-semibold py-0.5 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Enrolled Track</span>
            </Badge>
          ) : (
            <Badge variant="info" dot>
              Available Track
            </Badge>
          )}
        </div>

        <h3 className="text-lg sm:text-xl font-bold text-text-primary group-hover:text-primary transition-colors">
          {exam.title}
        </h3>

        <p className="text-xs sm:text-sm text-text-secondary mt-2 line-clamp-3 leading-relaxed">
          {exam.description}
        </p>
      </div>

      <div className="pt-5 mt-5 sm:pt-6 sm:mt-6 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
          <Layers className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
          <span>
            <strong className="font-semibold text-text-primary">{exam.totalSubjects}</strong>{" "}
            Subjects Covered
          </span>
        </div>

        {showEnrollAction && !isEnrolled ? (
          <EnrollExamButton
            examId={exam.id}
            examCode={exam.code}
            isEnrolled={isEnrolled}
            size="sm"
          />
        ) : (
          <Link
            href={`/exams/${exam.id}`}
            className="inline-flex flex-row items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary hover:text-primary-hover whitespace-nowrap shrink-0 group-hover:translate-x-0.5 transition-all"
          >
            <span>{isEnrolled ? "Open Workspace" : "Explore Subjects"}</span>
            <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  );
}
