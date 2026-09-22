import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ArrowLeft } from "lucide-react";
import {
  getExamById,
  getSubjectById,
  getTopicsBySubjectId,
} from "@/features/exams/services/content-service";
import { TopicCard } from "@/features/exams/components/topic-card";
import { Button } from "@/components/ui";

interface SubjectDetailPageProps {
  params: Promise<{ examId: string; subjectId: string }>;
}

export async function generateMetadata({
  params,
}: SubjectDetailPageProps): Promise<Metadata> {
  const { examId, subjectId } = await params;
  const [exam, subject] = await Promise.all([
    getExamById(examId),
    getSubjectById(subjectId),
  ]);

  if (!exam || !subject) {
    return { title: "Subject Not Found | PakSeekers" };
  }

  return {
    title: `${subject.title} — ${exam.code} | PakSeekers`,
    description: subject.description,
  };
}

export default async function SubjectDetailPage({
  params,
}: SubjectDetailPageProps) {
  const { examId, subjectId } = await params;
  const [exam, subject, topics] = await Promise.all([
    getExamById(examId),
    getSubjectById(subjectId),
    getTopicsBySubjectId(subjectId),
  ]);

  if (!exam || !subject) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumbs" className="flex items-center gap-2 text-xs text-text-secondary">
        <Link href="/exams" className="hover:text-primary transition-colors">
          Exams
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/exams/${exam.id}`} className="hover:text-primary transition-colors">
          {exam.code}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-text-primary">{subject.title}</span>
      </nav>

      {/* Subject Header */}
      <div className="bg-surface border border-border rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-primary tracking-wide uppercase">
              {exam.code} Curriculum
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
              {subject.title}
            </h1>
            <p className="text-sm text-text-secondary max-w-2xl leading-relaxed mt-1">
              {subject.description}
            </p>
          </div>

          <Link href={`/exams/${exam.id}`} className="shrink-0 self-start sm:self-auto">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Back to {exam.code}
            </Button>
          </Link>
        </div>
      </div>

      {/* Topics Grid */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              Curriculum Topics
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Choose a topic to practice focused multiple-choice questions.
            </p>
          </div>
          <span className="text-xs font-medium text-text-secondary bg-surface border border-border px-3 py-1 rounded-full">
            {topics.length} Topics
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic) => (
            <TopicCard key={topic.id} topic={topic} examId={exam.id} />
          ))}
        </div>
      </div>
    </div>
  );
}
