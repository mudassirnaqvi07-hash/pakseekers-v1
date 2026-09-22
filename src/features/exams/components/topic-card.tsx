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
    <div className="bg-surface border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-secondary bg-secondary/10 px-2.5 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            <span>High Yield</span>
          </span>
          <span className="text-xs font-medium text-text-secondary bg-background border border-border px-2.5 py-1 rounded-full">
            {topic.questionCount} Questions
          </span>
        </div>

        <h3 className="text-lg font-bold text-text-primary group-hover:text-primary transition-colors">
          {topic.title}
        </h3>

        <p className="text-sm text-text-secondary mt-2 line-clamp-3 leading-relaxed">
          {topic.description}
        </p>
      </div>

      <div className="pt-5 mt-5 border-t border-border flex items-center justify-between">
        <Link
          href={`/exams/${examId}/topics/${topic.id}`}
          className="text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          View Overview
        </Link>

        <Link
          href={`/exams/${examId}/topics/${topic.id}/practice`}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors shadow-xs"
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Practice Now</span>
          <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
        </Link>
      </div>
    </div>
  );
}
