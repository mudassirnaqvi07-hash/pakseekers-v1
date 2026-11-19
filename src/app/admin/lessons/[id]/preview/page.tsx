import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, CheckCircle2, Edit } from "lucide-react";
import { requireAdmin } from "@/server/auth/session";
import {
  getLessonById,
  getAllTopics,
} from "@/server/services/content-service";
import { Button, Badge, Card } from "@/components/ui";

export const metadata: Metadata = {
  title: "Lesson Preview — PakSeekers Admin",
};

interface LessonPreviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function LessonPreviewPage({ params }: LessonPreviewPageProps) {
  await requireAdmin();
  const { id } = await params;

  const [lesson, topics] = await Promise.all([
    getLessonById(id),
    getAllTopics(),
  ]);

  if (!lesson) {
    notFound();
  }

  const topic = topics.find((t) => t.id === lesson.topicId);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <Link href="/admin/lessons">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4 shrink-0" />}
          >
            Back to Lessons
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <Badge
            variant={lesson.status === "published" ? "success" : "neutral"}
            className="text-xs uppercase tracking-wider"
          >
            {lesson.status}
          </Badge>
          <Link href={`/admin/lessons/${lesson.id}/edit`}>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Edit className="w-4 h-4 shrink-0" />}
            >
              Edit Lesson
            </Button>
          </Link>
        </div>
      </div>

      <Card className="p-8">
        <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary mb-4 pb-4 border-b border-border">
          {topic && (
            <span className="font-semibold text-primary">
              Topic: {topic.title}
            </span>
          )}
          <span>•</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            {lesson.estimatedReadMinutes} min read
          </span>
          <span>•</span>
          <span>Order #{lesson.order}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight mb-4">
          {lesson.title}
        </h1>

        {lesson.summary && (
          <p className="text-base text-text-secondary leading-relaxed mb-6 italic bg-background p-4 rounded-md border border-border">
            {lesson.summary}
          </p>
        )}

        {lesson.learningObjectives && lesson.learningObjectives.length > 0 && (
          <div className="mb-8 p-5 rounded-lg bg-primary/5 border border-primary/20">
            <h3 className="text-sm font-bold text-primary mb-3 uppercase tracking-wider">
              Learning Objectives
            </h3>
            <ul className="space-y-2">
              {lesson.learningObjectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text-primary">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Content Body */}
        <div className="prose prose-slate max-w-none text-text-primary leading-relaxed whitespace-pre-wrap font-sans text-sm sm:text-base border-t border-border pt-6">
          {lesson.content}
        </div>
      </Card>
    </div>
  );
}
