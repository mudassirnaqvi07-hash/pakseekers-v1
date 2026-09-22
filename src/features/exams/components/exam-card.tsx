/**
 * ExamCard — PakSeekers Phase 2.
 *
 * Displays high-level exam metadata and links to the exam subjects view.
 */

import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";
import type { Exam } from "@/types";
import { Badge } from "@/components/ui";

interface ExamCardProps {
  exam: Exam;
}

export function ExamCard({ exam }: ExamCardProps) {
  return (
    <div className="bg-surface border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded bg-primary/10 text-primary font-bold text-xs tracking-wide uppercase">
            {exam.code}
          </span>
          <Badge variant="success" dot>
            Active Preparation
          </Badge>
        </div>

        <h3 className="text-xl font-bold text-text-primary group-hover:text-primary transition-colors">
          {exam.title}
        </h3>

        <p className="text-sm text-text-secondary mt-2 line-clamp-3 leading-relaxed">
          {exam.description}
        </p>
      </div>

      <div className="pt-6 mt-6 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
          <Layers className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
          <span>
            <strong className="font-semibold text-text-primary">{exam.totalSubjects}</strong>{" "}
            Subjects Covered
          </span>
        </div>

        <Link
          href={`/exams/${exam.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover group-hover:translate-x-0.5 transition-all"
        >
          <span>Explore Subjects</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
