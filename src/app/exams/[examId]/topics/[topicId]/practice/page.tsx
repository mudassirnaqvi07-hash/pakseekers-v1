import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ArrowLeft } from "lucide-react";
import {
  getExamById,
  getTopicById,
  getSubjectById,
  getQuestionsByTopicId,
  getTestById,
  getQuestionsByIds,
} from "@/features/exams/services/content-service";
import { QuizEngine } from "@/features/practice/components/quiz-engine";
import { Button } from "@/components/ui";

interface PracticePageProps {
  params: Promise<{ examId: string; topicId: string }>;
  searchParams: Promise<{ testId?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: PracticePageProps): Promise<Metadata> {
  const { topicId } = await params;
  const { testId } = await searchParams;
  const topic = await getTopicById(topicId);

  if (!topic) {
    return { title: "Practice | PakSeekers" };
  }

  if (testId) {
    const test = await getTestById(testId);
    if (test) {
      return {
        title: `${test.title} | PakSeekers`,
        description: test.description,
      };
    }
  }

  return {
    title: `Practice: ${topic.title} | PakSeekers`,
    description: `Interactive multiple choice question practice session for ${topic.title}.`,
  };
}

export default async function PracticePage({
  params,
  searchParams,
}: PracticePageProps) {
  const { examId, topicId } = await params;
  const { testId } = await searchParams;

  const [exam, topic] = await Promise.all([
    getExamById(examId),
    getTopicById(topicId),
  ]);

  if (!exam || !topic) {
    notFound();
  }

  const subject = await getSubjectById(topic.subjectId);
  let questions = await getQuestionsByTopicId(topic.id);
  let activeTitle = topic.title;

  if (testId) {
    const test = await getTestById(testId);
    if (test && test.questionIds.length > 0) {
      questions = await getQuestionsByIds(test.questionIds);
      activeTitle = test.title;
    }
  }

  const topicHref = `/exams/${exam.id}/topics/${topic.id}`;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
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
          <Link href={topicHref} className="hover:text-primary transition-colors truncate max-w-[160px]">
            {topic.title}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-text-primary truncate max-w-[180px]">
            {activeTitle}
          </span>
        </nav>

        <Link href={topicHref}>
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Exit Practice
          </Button>
        </Link>
      </div>

      {/* Quiz Engine Interactive Canvas */}
      <QuizEngine
        questions={questions}
        topicTitle={activeTitle}
        topicHref={topicHref}
      />
    </div>
  );
}
