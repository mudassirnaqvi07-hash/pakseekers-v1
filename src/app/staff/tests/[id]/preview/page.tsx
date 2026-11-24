import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, FileEdit, CheckCircle2 } from "lucide-react";
import { requireStaff } from "@/server/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/shared";
import { Badge, Button } from "@/components/ui";
import {
  getAdminTestById,
  getAdminQuestionsByIds,
  getAdminExamById,
  getAdminSubjectById,
  getAdminTopicById,
  getTestPerformanceInsights,
} from "@/server/services/content-service";
import { PublishToggleButton } from "@/features/admin/components/publish-toggle-button";
import { TestPeerStatisticsCard } from "@/features/practice/components/test-peer-statistics-card";

export const metadata: Metadata = {
  title: "Test Preview | Staff | PakSeekers",
};

export default async function StaffTestPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireStaff("TEST_VIEW");
  const { id } = await params;

  const test = await getAdminTestById(id);
  if (!test) {
    notFound();
  }

  const canPublish = hasPermission(user, "TEST_PUBLISH");
  const canEdit = hasPermission(user, "TEST_EDIT");
  const canViewPerformance = hasPermission(user, "TEST_PERFORMANCE_VIEW");

  const [exam, subject, topic, questions, peerStats] = await Promise.all([
    getAdminExamById(test.examId),
    getAdminSubjectById(test.subjectId),
    test.topicId ? getAdminTopicById(test.topicId) : Promise.resolve(null),
    getAdminQuestionsByIds(test.questionIds),
    canViewPerformance ? getTestPerformanceInsights(test.id) : Promise.resolve(null),
  ]);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Link href="/staff/tests">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Tests
            </Button>
          </Link>
          <span className="text-xs text-text-secondary">Staff Verification Preview</span>
        </div>

        <div className="flex items-center gap-2.5">
          {canPublish ? (
            <PublishToggleButton testId={test.id} initialStatus={test.status} />
          ) : (
            <Badge variant={test.status === "published" ? "success" : "draft"} dot className="capitalize text-xs">
              {test.status}
            </Badge>
          )}
          {canEdit && (
            <Link href={`/staff/tests/${test.id}/edit`}>
              <Button variant="outline" size="sm" leftIcon={<FileEdit className="w-4 h-4" />}>
                Edit Test
              </Button>
            </Link>
          )}
        </div>
      </div>

      <PageHeader
        title={`Preview: ${test.title}`}
        description="Verify question order, answer keys, and explanations prior to publishing."
      />

      <div className="bg-surface border border-border rounded-xl p-6 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-primary/10 text-primary font-bold text-xs uppercase">
              {exam?.code || test.examId}
            </span>
            <span className="text-xs font-semibold text-text-secondary">{subject?.title}</span>
            {topic && (
              <>
                <span className="text-xs text-text-secondary">•</span>
                <span className="text-xs font-medium text-text-primary">{topic.title}</span>
              </>
            )}
          </div>
          <Badge variant="default" className="capitalize text-xs">
            {test.difficulty}
          </Badge>
        </div>

        <h2 className="text-xl font-bold text-text-primary">{test.title}</h2>
        <p className="text-sm text-text-secondary leading-relaxed">{test.description}</p>

        <div className="flex items-center gap-6 pt-3 border-t border-border text-xs text-text-secondary">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-primary" />
            <span>
              <strong>{test.durationMinutes}</strong> Minutes
            </span>
          </div>
          <div>
            <strong>{test.questionCount}</strong> Total Questions
          </div>
        </div>
      </div>

      {peerStats && <TestPeerStatisticsCard stats={peerStats} />}

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-text-primary">
            Included Questions ({questions.length})
          </h3>
          <span className="text-xs text-text-secondary">Verified keys highlighted in green</span>
        </div>

        {questions.map((q, idx) => (
          <div key={q.id} className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-3">
            <div className="font-semibold text-sm text-text-primary">
              {idx + 1}. {q.questionText}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {q.options.map((opt) => {
                const isCorrect = opt.id === q.correctAnswer;
                return (
                  <div
                    key={opt.id}
                    className={`p-2.5 rounded-lg text-xs border flex items-center justify-between ${
                      isCorrect
                        ? "bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold"
                        : "bg-background border-border text-text-secondary"
                    }`}
                  >
                    <span>
                      {opt.label}) {opt.text}
                    </span>
                    {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />}
                  </div>
                );
              })}
            </div>
            <div className="text-xs text-text-secondary bg-background p-3 rounded-lg border border-border/60">
              <strong>Explanation:</strong> {q.explanation}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
