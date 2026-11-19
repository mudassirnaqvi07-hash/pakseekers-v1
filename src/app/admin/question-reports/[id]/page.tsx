import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  HelpCircle,
  Mail,
  Calendar,
} from "lucide-react";
import { requireAdmin } from "@/server/auth/session";
import { getQuestionReportById } from "@/server/services/reports-service";
import { getQuestionById } from "@/server/services/content-service";
import { Button, Badge, Card } from "@/components/ui";
import { ReportStatusForm } from "@/features/admin/components/report-status-form";

export const metadata: Metadata = {
  title: "Review Question Report — PakSeekers Admin",
};

interface ReportDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportDetailPage({ params }: ReportDetailPageProps) {
  await requireAdmin();
  const { id } = await params;

  const report = await getQuestionReportById(id);
  if (!report) {
    notFound();
  }

  const question = await getQuestionById(report.questionId);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      {/* Navigation header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/question-reports">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4 shrink-0" />}
          >
            Back to Reports
          </Button>
        </Link>

        {question && (
          <Link href={`/admin/questions/${question.id}/edit`}>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Edit className="w-4 h-4 shrink-0" />}
            >
              Edit in Question Bank
            </Button>
          </Link>
        )}
      </div>

      {/* Student Issue Report Card */}
      <Card className="p-4 sm:p-6 border-l-4 border-l-error">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-border">
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Reported Issue
            </span>
            <h2 className="text-lg font-bold text-text-primary capitalize mt-0.5">
              {report.reason.replace(/_/g, " ")}
            </h2>
          </div>

          <Badge
            variant={
              report.status === "resolved"
                ? "success"
                : report.status === "under_review"
                ? "warning"
                : report.status === "rejected"
                ? "neutral"
                : "error"
            }
            className="text-xs uppercase font-bold"
          >
            Status: {report.status.replace(/_/g, " ")}
          </Badge>
        </div>

        <div className="bg-background p-3.5 sm:p-4 rounded-md border border-border mb-4">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
            Student Description
          </p>
          <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap break-words">
            {report.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-text-secondary">
          <span className="flex items-center gap-1.5 break-all">
            <Mail className="w-3.5 h-3.5 shrink-0" />
            Reporter: {report.studentEmail || report.userEmail || "Anonymous"}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            Submitted: {new Date(report.createdAt).toLocaleString()}
          </span>
        </div>
      </Card>

      {/* Question Details Card */}
      <Card className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
          <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-primary shrink-0" />
            Question Details (Live Database Record)
          </h3>
          <span className="font-mono text-xs bg-border/60 text-text-secondary px-2 py-0.5 rounded">
            ID: {question?.id.slice(-6)}
          </span>
        </div>

        {question ? (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Question Statement
              </p>
              <p className="text-sm sm:text-base font-medium text-text-primary leading-relaxed bg-background p-3.5 sm:p-4 rounded-md border border-border break-words">
                {question.questionText}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Options & Correct Answer
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {question.options.map((opt) => {
                  const isCorrect = opt.id === question.correctAnswer;
                  return (
                    <div
                      key={opt.id}
                      className={`p-3 rounded-md border text-xs flex items-center justify-between gap-2 break-words ${
                        isCorrect
                          ? "bg-success/10 border-success/40 text-success font-semibold"
                          : "bg-background border-border text-text-primary"
                      }`}
                    >
                      <span className="leading-snug">{opt.text}</span>
                      {isCorrect && (
                        <Badge variant="success" className="text-[10px] uppercase ml-2 shrink-0">
                          Correct
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {question.explanation && (
              <div className="bg-primary/5 p-3.5 sm:p-4 rounded-md border border-primary/20">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                  Stored Explanation
                </p>
                <p className="text-xs text-text-primary leading-relaxed break-words">
                  {question.explanation}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-text-secondary italic">
            This question record no longer exists or has been deleted from the database.
          </p>
        )}
      </Card>

      {/* Admin Resolution Form */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-base font-bold text-text-primary mb-3">
          Triage & Resolution Workflow
        </h3>
        <ReportStatusForm report={report} />
      </Card>
    </div>
  );
}
