import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, FileEdit, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Badge, Button } from "@/components/ui";
import {
  getTestById,
  getQuestionsByIds,
  getExamById,
  getSubjectById,
  getTopicById,
} from "@/server/repositories/content-repository";
import { PublishToggleButton } from "@/features/admin/components/publish-toggle-button";

interface TestPreviewPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: TestPreviewPageProps): Promise<Metadata> {
  const { id } = await params;
  const test = getTestById(id);
  return {
    title: test ? `Preview: ${test.title} | PakSeekers Admin` : "Test Not Found",
  };
}

export default async function TestPreviewPage({
  params,
}: TestPreviewPageProps) {
  const { id } = await params;
  const test = getTestById(id);

  if (!test) {
    notFound();
  }

  const exam = getExamById(test.examId);
  const subject = getSubjectById(test.subjectId);
  const topic = test.topicId ? getTopicById(test.topicId) : null;
  const questions = getQuestionsByIds(test.questionIds);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Header with Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Link href="/admin/tests">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Tests
            </Button>
          </Link>
          <span className="text-xs text-text-secondary">Admin Test Verification Preview</span>
        </div>

        <div className="flex items-center gap-2.5">
          <PublishToggleButton testId={test.id} initialStatus={test.status} />
          <Link href={`/admin/tests/${test.id}/edit`}>
            <Button variant="outline" size="sm" leftIcon={<FileEdit className="w-4 h-4" />}>
              Edit Test
            </Button>
          </Link>
        </div>
      </div>

      <PageHeader
        title={`Preview: ${test.title}`}
        description="Verify question order, answer keys, and explanations prior to publishing for students."
      />

      {/* Test Meta Card */}
      <div className="bg-surface border border-border rounded-xl p-6 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-primary/10 text-primary font-bold text-xs uppercase">
              {exam?.code || test.examId}
            </span>
            <span className="text-xs font-semibold text-text-secondary">
              {subject?.title}
            </span>
            {topic && (
              <>
                <span className="text-xs text-text-secondary">•</span>
                <span className="text-xs font-medium text-text-primary">
                  {topic.title}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="default" className="capitalize text-xs">
              {test.difficulty}
            </Badge>
          </div>
        </div>

        <h2 className="text-xl font-bold text-text-primary">{test.title}</h2>
        <p className="text-sm text-text-secondary leading-relaxed">{test.description}</p>

        <div className="flex items-center gap-6 pt-3 border-t border-border text-xs text-text-secondary">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-secondary" />
            <span>
              <strong>{test.durationMinutes}</strong> Minutes
            </span>
          </div>
          <div>
            <strong>{test.questionCount}</strong> Total Questions
          </div>
        </div>
      </div>

      {/* Questions Review List */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-text-primary">
            Included Questions ({questions.length})
          </h3>
          <span className="text-xs text-text-secondary">
            Verified keys highlighted in green
          </span>
        </div>

        {questions.length > 0 ? (
          questions.map((q, idx) => (
            <div
              key={q.id}
              className="bg-surface border border-border rounded-xl p-6 shadow-xs flex flex-col gap-4"
            >
              <div className="flex items-center justify-between text-xs text-text-secondary pb-2 border-b border-border">
                <span className="font-bold text-primary">Question {idx + 1}</span>
                <span className="capitalize">{q.difficulty}</span>
              </div>

              <p className="text-base font-medium text-text-primary leading-relaxed">
                {q.questionText}
              </p>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {q.options.map((opt) => {
                  const isCorrect = opt.id === q.correctAnswer;
                  return (
                    <div
                      key={opt.id}
                      className={`p-3 rounded-lg border text-sm flex items-start gap-2.5 ${
                        isCorrect
                          ? "bg-green-50 border-green-300 text-green-950 font-medium ring-1 ring-green-400"
                          : "bg-background border-border text-text-secondary"
                      }`}
                    >
                      <span className="font-bold shrink-0">{opt.label})</span>
                      <span className="flex-1">{opt.text}</span>
                      {isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-green-700 shrink-0 mt-0.5" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3 text-xs text-text-primary leading-relaxed">
                <strong className="text-primary">Pedagogical Explanation:</strong>{" "}
                {q.explanation}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-surface border border-border rounded-xl p-8 text-center text-sm text-text-secondary">
            This test has no questions assigned yet.{" "}
            <Link href={`/admin/tests/${test.id}/edit`} className="text-primary font-semibold underline">
              Edit test
            </Link>{" "}
            to select questions.
          </div>
        )}
      </div>
    </div>
  );
}
