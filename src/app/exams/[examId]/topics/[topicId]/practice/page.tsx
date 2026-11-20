import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ArrowLeft, Lock } from "lucide-react";
import {
  getExamById,
  getTopicById,
  getSubjectById,
  getQuestionsByTopicId,
  getTestById,
  getQuestionsByIds,
} from "@/server/services/content-service";
import { canAccessExamination } from "@/server/services/enrollment-service";
import { EnrollExamButton } from "@/features/exams/components/enroll-exam-button";
import { QuizEngine } from "@/features/practice/components/quiz-engine";
import { Button, Badge } from "@/components/ui";
import { requireStudent } from "@/server/auth/session";

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
    if (test && test.status === "published") {
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

  // Protect test-taking flow: requires an authenticated student.
  // Unauthenticated users are redirected to login with a safe callback destination.
  const returnPath = `/exams/${examId}/topics/${topicId}/practice${
    testId ? `?testId=${encodeURIComponent(testId)}` : ""
  }`;
  const student = await requireStudent(returnPath);

  // Authoritative Access Enforcement: Verify student has active enrollment for this exam
  const hasAccess = await canAccessExamination(student.id, examId);
  if (!hasAccess) {
    const exam = await getExamById(examId);
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
        <div className="rounded-xl border border-border bg-surface p-6 sm:p-8 text-center flex flex-col items-center gap-4 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <Badge variant="warning" className="mb-2">
              Enrollment Required
            </Badge>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
              Enroll in {exam?.code || "Examination"} to Practice This Topic
            </h1>
            <p className="text-sm text-text-secondary mt-2 max-w-md mx-auto leading-relaxed">
              Curriculum topic practice quizzes and diagnostic tests are reserved for students actively enrolled in this preparation track.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 mt-3 w-full sm:w-auto">
            <EnrollExamButton
              examId={examId}
              examCode={exam?.code}
              size="md"
              variant="primary"
              className="w-full sm:w-auto justify-center"
            />
            <Link href="/exams" className="w-full sm:w-auto">
              <Button variant="outline" size="md" className="w-full sm:w-auto justify-center">
                Browse All Exams
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
  let durationMinutes: number | undefined = undefined;

  if (testId) {
    const test = await getTestById(testId);
    // Draft or archived tests must remain unavailable according to publishing rules
    if (!test || test.status !== "published") {
      notFound();
    }

    if (test.questionIds.length > 0) {
      questions = await getQuestionsByIds(test.questionIds);
      activeTitle = test.title;
      durationMinutes = test.durationMinutes;
    }
  }

  // Security: Sanitize questions before sending to the client browser.
  // Strips correctAnswer and explanation so answer keys cannot be inspected via DevTools.
  const sanitizedQuestions = questions.map((q) => {
    const copy = { ...q };
    delete (copy as { correctAnswer?: string }).correctAnswer;
    delete (copy as { explanation?: string }).explanation;
    return copy;
  });

  const topicHref = `/exams/${exam.id}/topics/${topic.id}`;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 sm:gap-2 text-xs text-text-secondary flex-wrap">
          <Link href="/exams" className="hover:text-primary transition-colors">
            Exams
          </Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <Link href={`/exams/${exam.id}`} className="hover:text-primary transition-colors">
            {exam.code}
          </Link>
          {subject && (
            <>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              <Link
                href={`/exams/${exam.id}/subjects/${subject.id}`}
                className="hover:text-primary transition-colors truncate max-w-[100px] sm:max-w-[140px]"
              >
                {subject.title}
              </Link>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <Link href={topicHref} className="hover:text-primary transition-colors truncate max-w-[110px] sm:max-w-[160px]">
            {topic.title}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <span className="font-semibold text-text-primary truncate max-w-[120px] sm:max-w-[180px]">
            {activeTitle}
          </span>
        </nav>

        <div className="self-end sm:self-auto shrink-0">
          <Link href={topicHref}>
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Exit Practice
            </Button>
          </Link>
        </div>
      </div>

      {/* Quiz Engine Interactive Canvas */}
      <QuizEngine
        questions={sanitizedQuestions}
        topicTitle={activeTitle}
        topicHref={topicHref}
        examId={exam.id}
        subjectId={subject?.id}
        topicId={topic.id}
        testId={testId}
        durationMinutes={durationMinutes}
      />
    </div>
  );
}
