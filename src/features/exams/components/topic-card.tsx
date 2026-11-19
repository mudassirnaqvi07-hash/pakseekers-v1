/**
 * TopicCard — PakSeekers Phase 2.
 *
 * Displays topic details and provides a direct path to start practice.
 */

import Link from "next/link";
import { ArrowRight, CheckSquare, Sparkles } from "lucide-react";
import type { Topic } from "@/types";

interface TopicCardProps {
  topic: Topic;
  examId: string;
}

export function TopicCard({ topic, examId }: TopicCardProps) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group min-w-0">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-secondary bg-secondary/10 px-2.5 py-1 rounded-full shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
            <span>High Yield</span>
          </span>
          <span className="text-xs font-medium text-text-secondary bg-background border border-border px-2.5 py-1 rounded-full shrink-0">
            {topic.questionCount} Questions
          </span>
        </div>

        <h3 className="text-base sm:text-lg font-bold text-text-primary group-hover:text-primary transition-colors">
          {topic.title}
        </h3>

        <p className="text-xs sm:text-sm text-text-secondary mt-2 line-clamp-3 leading-relaxed">
          {topic.description}
        </p>
      </div>

      <div className="pt-4 mt-4 sm:pt-5 sm:mt-5 border-t border-border flex flex-col xs:flex-row xs:items-center justify-between gap-2.5">
        <Link
          href={`/exams/${examId}/topics/${topic.id}`}
          className="text-xs font-medium text-text-secondary hover:text-text-primary transition-colors py-1"
        >
          View Overview
        </Link>

        <Link
          href={`/exams/${examId}/topics/${topic.id}/practice`}
          className="inline-flex flex-row items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-white text-xs font-semibold hover:bg-primary-hover whitespace-nowrap shrink-0 transition-colors shadow-xs"
        >
          <CheckSquare className="w-3.5 h-3.5 shrink-0" />
          <span>Practice Now</span>
          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
        </Link>
      </div>
    </div>
  );
}
