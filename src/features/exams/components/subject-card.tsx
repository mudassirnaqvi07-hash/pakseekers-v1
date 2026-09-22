/**
 * SubjectCard — PakSeekers Phase 2.
 *
 * Displays subject details within an exam and links to its topics list.
 */

import Link from "next/link";
import { ArrowRight, BookOpen, Dna, FlaskConical, Zap } from "lucide-react";
import type { Subject } from "@/types";

interface SubjectCardProps {
  subject: Subject;
  examId: string;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Dna,
  FlaskConical,
  Zap,
};

export function SubjectCard({ subject, examId }: SubjectCardProps) {
  const IconComponent = (subject.icon && ICON_MAP[subject.icon]) || BookOpen;

  return (
    <div className="bg-surface border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-200">
            <IconComponent className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium text-text-secondary bg-background border border-border px-2.5 py-1 rounded-full">
            {subject.totalTopics} {subject.totalTopics === 1 ? "Topic" : "Topics"}
          </span>
        </div>

        <h3 className="text-lg font-bold text-text-primary group-hover:text-primary transition-colors">
          {subject.title}
        </h3>

        <p className="text-sm text-text-secondary mt-2 line-clamp-2 leading-relaxed">
          {subject.description}
        </p>
      </div>

      <div className="pt-5 mt-5 border-t border-border flex items-center justify-between">
        <span className="text-xs text-text-secondary">Official Curriculum</span>

        <Link
          href={`/exams/${examId}/subjects/${subject.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover group-hover:translate-x-0.5 transition-all"
        >
          <span>View Topics</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
