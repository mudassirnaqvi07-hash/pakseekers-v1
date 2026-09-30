/**
 * My Test Attempts / History Page — PakSeekers Phase 4.
 *
 * Displays chronological history of all tests attempted by the student.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";
import { Badge, Button, Card, CardContent } from "@/components/ui";
import { PageHeader, EmptyState } from "@/components/shared";
import { requireStudent } from "@/server/auth/session";
import { getStudentAttempts } from "@/server/repositories/user-repository";

export const metadata: Metadata = {
  title: "My Attempts",
  description: "Review all your past entrance test attempts, scores, and answer keys.",
};

export default async function StudentAttemptsPage() {
  const user = await requireStudent();
  const attempts = getStudentAttempts(user.id);

  return (
    <div className="flex flex-col gap-8 w-full">
      <PageHeader
        title="My Test Attempts & Results"
        description="Review your past test scores, analyze your question responses, and read verified pedagogical explanations."
      />

      {attempts.length > 0 ? (
        <div className="flex flex-col gap-4">
          <div className="text-xs text-text-secondary font-medium">
            Showing {attempts.length} completed attempt{attempts.length === 1 ? "" : "s"}
          </div>

          <div className="flex flex-col gap-3">
            {attempts.map((attempt) => (
              <Card
                key={attempt.id}
                className="hover:border-primary/40 transition-colors shadow-2xs"
              >
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant="info" className="text-[10px] py-0 font-bold">
                        {attempt.examTitle}
                      </Badge>
                      <span className="text-xs text-text-secondary font-medium truncate">
                        {attempt.subjectTitle}
                        {attempt.topicTitle && ` • ${attempt.topicTitle}`}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-text-primary">
                      {attempt.testTitle}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(attempt.completedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span>
                        Questions: <strong>{attempt.totalQuestions}</strong>
                      </span>
                      <span>
                        Correct:{" "}
                        <strong className="text-success">{attempt.correctCount}</strong>
                      </span>
                      <span>
                        Incorrect:{" "}
                        <strong className="text-error">{attempt.incorrectCount}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-border">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-secondary font-medium sm:hidden">
                        Score:
                      </span>
                      <Badge
                        variant={
                          attempt.percentage >= 70
                            ? "success"
                            : attempt.percentage >= 50
                            ? "warning"
                            : "error"
                        }
                        className="text-sm font-bold px-3 py-1"
                      >
                        {attempt.percentage}%
                      </Badge>
                    </div>

                    <Link href={`/student/attempts/${attempt.id}`}>
                      <Button variant="outline" size="sm" className="h-8 text-xs px-3">
                        View Result
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          title="No Test Attempts Recorded"
          description="You haven't attempted any tests yet. Take an interactive diagnostic test to record your score and review answer explanations."
          action={
            <Link href="/student/tests">
              <Button size="sm">Browse Available Tests</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
