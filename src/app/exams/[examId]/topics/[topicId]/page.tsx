import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  ArrowLeft,
  Clock,
  Sparkles,
  Play,
  HelpCircle,
} from "lucide-react";
import {
  getExamById,
  getTopicById,
  getSubjectById,
  getQuestionsByTopicId,
  getTestsByTopicId,
} from "@/features/exams/services/content-service";
import { Button, Badge } from "@/components/ui";

interface TopicDetailPageProps {
  params: Promise<{ examId: string; topicId: string }>;
}

export async function generateMetadata({
  params,
}: TopicDetailPageProps): Promise<Metadata> {
  const { topicId } = await params;
  const topic = await getTopicById(topicId);

  if (!topic) {
    return { title: "Topic Not Found | PakSeekers" };
  }

  return {
    title: `${topic.title} | PakSeekers`,
    description: topic.description,
  };
}

export default async function TopicDetailPage({
  params,
}: TopicDetailPageProps) {
  const { examId, topicId } = await params;
  const [exam, topic] = await Promise.all([
    getExamById(examId),
    getTopicById(topicId),
  ]);

  if (!exam || !topic) {
    notFound();
  }

  const subject = await getSubjectById(topic.subjectId);
  const questions = await getQuestionsByTopicId(topic.id);
  const tests = await getTestsByTopicId(topic.id);

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumbs" className="flex items-center gap-2 text-xs text-text-secondary flex-wrap">
        <Link href="/exams" className="hover:text-primary transition-colors">
          Exams
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/exams/${exam.id}`} className="hover:text-primary transition-colors">
          {exam.code}
        </Link>
        {subject && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link
              href={`/exams/${exam.id}/subjects/${subject.id}`}
              className="hover:text-primary transition-colors"
            >
              {subject.title}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-text-primary truncate">{topic.title}</span>
      </nav>

      {/* Main Topic Card */}
      <div className="bg-surface border border-border rounded-xl p-6 sm:p-8 shadow-xs flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary tracking-wide uppercase">
              {subject?.title || "Curriculum"} Topic
            </span>
            <Badge variant="info" dot>
              High Yield
            </Badge>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            {topic.title}
          </h1>

          <p className="text-sm text-text-secondary leading-relaxed max-w-2xl">
            {topic.description}
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-lg bg-background border border-border">
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <HelpCircle className="w-3.5 h-3.5 text-primary" />
              <span>Questions</span>
            </div>
            <div className="text-lg font-bold text-text-primary mt-1">
              {questions.length} MCQs
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-background border border-border">
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <Clock className="w-3.5 h-3.5 text-secondary" />
              <span>Est. Duration</span>
            </div>
            <div className="text-lg font-bold text-text-primary mt-1">
              ~5 Minutes
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-background border border-border col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>Format</span>
            </div>
            <div className="text-lg font-bold text-text-primary mt-1">
              Interactive Quiz
            </div>
          </div>
        </div>

        {/* Start Practice Action */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-border">
          {subject && (
            <Link href={`/exams/${exam.id}/subjects/${subject.id}`}>
              <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back to {subject.title}
              </Button>
            </Link>
          )}

          <Link href={`/exams/${exam.id}/topics/${topic.id}/practice`}>
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Play className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Start Practice Quiz ({questions.length} Questions)
            </Button>
          </Link>
        </div>
      </div>

      {/* Tests in this Topic (if any) */}
      {tests.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-base font-bold text-text-primary">
            Curriculum Tests for this Topic
          </h2>
          <div className="flex flex-col gap-3">
            {tests.map((test) => (
              <div
                key={test.id}
                className="bg-surface border border-border rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <h3 className="text-sm font-bold text-text-primary">
                    {test.title}
                  </h3>
                  <p className="text-xs text-text-secondary mt-1">
                    {test.description}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-text-secondary mt-2">
                    <span>{test.questionCount} Questions</span>
                    <span>•</span>
                    <span>{test.durationMinutes} Mins</span>
                    <span>•</span>
                    <span className="capitalize">{test.difficulty}</span>
                  </div>
                </div>

                <Link href={`/exams/${exam.id}/topics/${topic.id}/practice?testId=${test.id}`}>
                  <Button size="sm" variant="outline">
                    Take Test
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
