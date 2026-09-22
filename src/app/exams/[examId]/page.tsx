import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { getExamById, getSubjectsByExamId } from "@/features/exams/services/content-service";
import { SubjectCard } from "@/features/exams/components/subject-card";
import { Button, Badge } from "@/components/ui";

interface ExamDetailPageProps {
  params: Promise<{ examId: string }>;
}

export async function generateMetadata({
  params,
}: ExamDetailPageProps): Promise<Metadata> {
  const { examId } = await params;
  const exam = await getExamById(examId);

  if (!exam) {
    return { title: "Exam Not Found | PakSeekers" };
  }

  return {
    title: `${exam.title} (${exam.code}) | PakSeekers`,
    description: exam.description,
  };
}

export default async function ExamDetailPage({ params }: ExamDetailPageProps) {
  const { examId } = await params;
  const exam = await getExamById(examId);

  if (!exam) {
    notFound();
  }

  const subjects = await getSubjectsByExamId(examId);

  return (
    <div className="flex flex-col gap-8">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumbs" className="flex items-center gap-2 text-xs text-text-secondary">
        <Link href="/exams" className="hover:text-primary transition-colors">
          Exams
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-text-primary">{exam.code}</span>
      </nav>

      {/* Exam Header Banner */}
      <div className="bg-surface border border-border rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded bg-primary/10 text-primary font-bold text-xs uppercase">
                {exam.code}
              </span>
              <Badge variant="success" dot>
                Curriculum Active
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
              {exam.title}
            </h1>
            <p className="text-sm text-text-secondary max-w-3xl leading-relaxed mt-1">
              {exam.description}
            </p>
          </div>

          <Link href="/exams" className="shrink-0 self-start sm:self-auto">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              All Exams
            </Button>
          </Link>
        </div>
      </div>

      {/* Subjects Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              Subjects & Syllabus Breakdown
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Select a subject to view curriculum topics and high-yield question practice.
            </p>
          </div>
          <span className="text-xs font-medium text-text-secondary bg-surface border border-border px-3 py-1 rounded-full">
            {subjects.length} Subjects
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              examId={exam.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
