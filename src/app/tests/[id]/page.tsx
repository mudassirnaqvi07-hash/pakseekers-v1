/**
 * Direct Test Overview & Instructions Screen — /tests/[id]
 *
 * Enforces student authentication. Unauthenticated visitors are redirected to login.
 * Displays authoritative test syllabus details, duration, question count,
 * target metrics, and rules before the student embarks on the test canvas.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Clock,
  HelpCircle,
  Award,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { requireStudent } from "@/server/auth/session";
import {
  getTestById,
  getQuestionById,
  getAllTopics,
  getExamById,
  getSubjectById,
} from "@/server/services/content-service";
import { Badge, Button, Card, CardContent } from "@/components/ui";

interface TestByIdPageProps {
  params: Promise<{ id: string }>;
}

export default async function TestByIdPage({ params }: TestByIdPageProps) {
  const { id } = await params;

  // 1. Enforce student authentication with callbackUrl
  await requireStudent(`/tests/${id}`);

  // 2. Resolve test
  const test = await getTestById(id);
  if (!test || test.status !== "published") {
    notFound();
  }

  // 3. Resolve parent exam & subject metadata
  const [exam, subject] = await Promise.all([
    getExamById(test.examId),
    getSubjectById(test.subjectId),
  ]);

  // 4. Dynamically resolve topic
  let resolvedTopicId = test.topicId;
  if (!resolvedTopicId && test.questionIds.length > 0) {
    const firstQ = await getQuestionById(test.questionIds[0]);
    if (firstQ?.topicId) {
      resolvedTopicId = firstQ.topicId;
    }
  }

  if (!resolvedTopicId) {
    const availableTopics = await getAllTopics(test.subjectId, test.examId);
    if (availableTopics.length > 0) {
      resolvedTopicId = availableTopics[0].id;
    }
  }

  if (!resolvedTopicId) {
    notFound();
  }

  const startUrl = `/exams/${test.examId}/topics/${resolvedTopicId}/practice?testId=${test.id}`;
  const questionCount = test.questionCount || test.questionIds.length;
  const paceSeconds =
    questionCount > 0 && test.durationMinutes > 0
      ? Math.round((test.durationMinutes * 60) / questionCount)
      : 60;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Top back navigation */}
      <div className="mb-6">
        <Link href="/student/tests">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Available Tests
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-8">
        {/* Header Hero */}
        <div className="bg-surface border border-border rounded-2xl p-4 sm:p-6 md:p-8 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {exam && (
              <Badge variant="info" className="font-semibold">
                {exam.code}
              </Badge>
            )}
            {subject && (
              <Badge variant="default" className="font-medium">
                {subject.title}
              </Badge>
            )}
            <Badge
              variant={
                test.difficulty === "easy"
                  ? "success"
                  : test.difficulty === "hard"
                  ? "error"
                  : "warning"
              }
              className="capitalize"
            >
              {test.difficulty} Difficulty
            </Badge>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">
            {test.title}
          </h1>

          <p className="mt-3 text-sm sm:text-base text-text-secondary leading-relaxed">
            {test.description ||
              "Test your subject mastery under standardized timed examination conditions."}
          </p>

          {/* Test Metrics Grid */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="p-3 sm:p-4 rounded-xl bg-background border border-border flex flex-col">
              <div className="flex items-center gap-1.5 sm:gap-2 text-text-secondary text-xs font-medium">
                <HelpCircle className="w-4 h-4 text-primary shrink-0" />
                <span>Questions</span>
              </div>
              <span className="text-lg sm:text-xl font-bold text-text-primary mt-1">
                {questionCount} MCQs
              </span>
            </div>

            <div className="p-3 sm:p-4 rounded-xl bg-background border border-border flex flex-col">
              <div className="flex items-center gap-1.5 sm:gap-2 text-text-secondary text-xs font-medium">
                <Clock className="w-4 h-4 text-primary shrink-0" />
                <span>Duration</span>
              </div>
              <span className="text-lg sm:text-xl font-bold text-text-primary mt-1">
                {test.durationMinutes} Minutes
              </span>
            </div>

            <div className="p-3 sm:p-4 rounded-xl bg-background border border-border flex flex-col">
              <div className="flex items-center gap-1.5 sm:gap-2 text-text-secondary text-xs font-medium">
                <Award className="w-4 h-4 text-primary shrink-0" />
                <span>Pacing Target</span>
              </div>
              <span className="text-lg sm:text-xl font-bold text-text-primary mt-1">
                ~{paceSeconds}s / question
              </span>
            </div>

            <div className="p-3 sm:p-4 rounded-xl bg-background border border-border flex flex-col">
              <div className="flex items-center gap-1.5 sm:gap-2 text-text-secondary text-xs font-medium">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                <span>Passing Mark</span>
              </div>
              <span className="text-lg sm:text-xl font-bold text-text-primary mt-1">
                70% Benchmark
              </span>
            </div>
          </div>
        </div>

        {/* Instructions and Rules */}
        <Card>
          <CardContent className="p-4 sm:p-6 md:p-8">
            <div className="flex items-center gap-2.5 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-text-primary">
                Test Instructions & Exam Protocol
              </h2>
            </div>

            <ul className="space-y-3.5 text-sm text-text-secondary">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Single Selection:</strong> Select the one best answer for each multiple-choice question.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Free Navigation:</strong> Jump between questions using the index pills or Previous/Next controls at any point prior to final submission.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Timed Session:</strong> A real-time timer will count down. When time expires, your answers are automatically finalized and submitted.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Instant Rationale Review:</strong> Immediately upon submission, detailed pedagogical explanations and topic performance analytics are unlocked.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Official Score Record:</strong> Once submitted, this attempt will be saved to your student profile history and contribute to your progress analytics.
                </span>
              </li>
            </ul>

            <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-text-secondary">
                Ready when you are. Ensure a stable network connection before starting.
              </div>

              <Link href={startUrl} className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto px-8" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Start Test Now
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
