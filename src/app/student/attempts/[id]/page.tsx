/**
 * Attempt Result & Review Page — PakSeekers Phase 4.
 *
 * Displays detailed question-by-question review of a saved student test attempt.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Badge, Button, Card, CardContent } from "@/components/ui";
import { requireStudent } from "@/server/auth/session";
import { getAttemptById } from "@/server/services/user-service";

interface AttemptDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: AttemptDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const attempt = await getAttemptById(id);
  return {
    title: attempt ? `Result: ${attempt.testTitle}` : "Test Result",
    description: "Detailed result breakdown and question review for your test attempt.",
  };
}

export default async function AttemptDetailPage({ params }: AttemptDetailPageProps) {
  const user = await requireStudent();
  const { id } = await params;

  const attempt = await getAttemptById(id);
  if (!attempt) {
    notFound();
  }

  // Enforce student ownership
  if (attempt.studentId !== user.id) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full">
      {/* Back button */}
      <div>
        <Link
          href="/student/attempts"
          className="inline-flex items-center text-xs font-semibold text-text-secondary hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to My Attempts
        </Link>
      </div>

      {/* Result Score Banner */}
      <div className="rounded-xl border border-border bg-surface p-4 sm:p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xs">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="info" className="font-bold text-xs">
              {attempt.examTitle}
            </Badge>
            <span className="text-xs text-text-secondary font-medium">
              {attempt.subjectTitle}
              {attempt.topicTitle && ` • ${attempt.topicTitle}`}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-text-primary">
            {attempt.testTitle}
          </h1>

          <div className="flex items-center gap-2 text-xs text-text-secondary mt-2">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>
              Attempt completed on{" "}
              {new Date(attempt.completedAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        {/* Score Badge Card */}
        <div className="flex items-center gap-4 sm:gap-6 p-3 sm:p-4 rounded-xl bg-background border border-border shrink-0 justify-around sm:justify-start">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-extrabold text-primary">
              {attempt.percentage}%
            </div>
            <div className="text-[11px] text-text-secondary font-semibold uppercase tracking-wider mt-0.5">
              Score
            </div>
          </div>

          <div className="h-10 w-px bg-border" />

          <div className="flex flex-col gap-1 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success shrink-0" />
              <span className="text-text-secondary">Correct:</span>
              <strong className="text-success">{attempt.correctCount}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-error shrink-0" />
              <span className="text-text-secondary">Incorrect:</span>
              <strong className="text-error">{attempt.incorrectCount}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-text-secondary/40 shrink-0" />
              <span className="text-text-secondary">Unattempted:</span>
              <strong>{attempt.unattemptedCount}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Retake action */}
      <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3">
        <h2 className="text-base sm:text-lg font-bold text-text-primary">
          Question by Question Breakdown
        </h2>
        {attempt.topicId && (
          <Link
            href={`/exams/${attempt.examId}/topics/${attempt.topicId}/practice?testId=${attempt.testId}`}
            className="w-full xs:w-auto"
          >
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RotateCcw className="w-3.5 h-3.5 shrink-0" />}
              className="w-full xs:w-auto"
            >
              Retake This Test
            </Button>
          </Link>
        )}
      </div>

      {/* Question Results List */}
      <div className="flex flex-col gap-6">
        {attempt.questionResults.map((item, idx) => {
          const isCorrect = item.isCorrect;
          const isAnswered = item.isAnswered;

          return (
            <Card
              key={item.question.id}
              className={`border-l-4 shadow-2xs ${
                isCorrect
                  ? "border-l-success"
                  : isAnswered
                  ? "border-l-error"
                  : "border-l-amber-500"
              }`}
            >
              <CardContent className="p-4 sm:p-6">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-surface-hover text-text-primary text-xs font-bold flex items-center justify-center border border-border shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-text-secondary">
                      Question {idx + 1} of {attempt.totalQuestions}
                    </span>
                  </div>

                  <Badge
                    variant={isCorrect ? "success" : isAnswered ? "error" : "warning"}
                    className="text-xs font-bold"
                  >
                    {isCorrect ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Correct
                      </span>
                    ) : isAnswered ? (
                      <span className="flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5 shrink-0" /> Incorrect
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 shrink-0" /> Unattempted
                      </span>
                    )}
                  </Badge>
                </div>

                {/* Question Stem */}
                <p className="text-sm sm:text-base font-semibold text-text-primary leading-relaxed mb-6 break-words">
                  {item.question.questionText}
                </p>

                {/* Options List */}
                <div className="flex flex-col gap-2.5 mb-6">
                  {item.question.options.map((opt) => {
                    const isSelected = item.selectedOptionId === opt.id;
                    const isCanonical = item.correctOptionId === opt.id;

                    let optionStyle =
                      "border-border bg-surface text-text-secondary";

                    if (isCanonical) {
                      optionStyle =
                        "border-success bg-success/10 text-success font-semibold";
                    } else if (isSelected && !isCorrect) {
                      optionStyle =
                        "border-error bg-error/10 text-error line-through font-semibold";
                    }

                    return (
                      <div
                        key={opt.id}
                        className={`flex items-start gap-3 p-3 sm:p-3.5 rounded-lg border text-xs sm:text-sm transition-colors ${optionStyle}`}
                      >
                        <span className="w-6 h-6 rounded bg-background border border-current text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {opt.label || opt.id.replace("opt-", "").toUpperCase()}
                        </span>
                        <span className="flex-1 leading-normal break-words min-w-0">{opt.text}</span>
                        {isCanonical && (
                          <Badge variant="success" className="text-[10px] py-0 shrink-0 ml-1">
                            Correct
                          </Badge>
                        )}
                        {isSelected && !isCorrect && (
                          <Badge variant="error" className="text-[10px] py-0 shrink-0 ml-1">
                            Your Choice
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Step-by-Step Pedagogical Explanation */}
                {item.question.explanation && (
                  <div className="p-3.5 sm:p-4 rounded-lg bg-surface border border-border text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-primary mb-1">
                      <Sparkles className="w-4 h-4 text-accent shrink-0" />
                      <span>Verified Pedagogical Explanation:</span>
                    </div>
                    <p className="text-text-secondary leading-relaxed pl-5 break-words">
                      {item.question.explanation}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
