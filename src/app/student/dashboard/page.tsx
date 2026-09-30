/**
 * Student Dashboard — PakSeekers Phase 4.
 *
 * Real student dashboard displaying attempt counts, questions solved,
 * average scores, subject progress, recent attempts, and available tests.
 */

import type { Metadata } from "next";
import Link from "next/link";
import {
  FileCheck2,
  CheckCircle2,
  Target,
  BarChart2,
  ArrowRight,
  Clock,
  BookOpen,
  Calendar,
} from "lucide-react";
import { Badge, Button, Card, CardContent } from "@/components/ui";
import { EmptyState } from "@/components/shared";
import { requireStudent } from "@/server/auth/session";
import {
  getStudentDashboardStats,
  getStudentAttempts,
} from "@/server/repositories/user-repository";
import { getAllTests, getAllExams } from "@/server/repositories/content-repository";

export const metadata: Metadata = {
  title: "Student Dashboard",
  description: "View your entrance exam preparation overview, recent attempts, and curriculum progress.",
};

export default async function StudentDashboardPage() {
  const user = await requireStudent();

  const [stats, attempts, allTests, exams] = await Promise.all([
    Promise.resolve(getStudentDashboardStats(user.id)),
    Promise.resolve(getStudentAttempts(user.id)),
    Promise.resolve(getAllTests({ status: "published" })),
    Promise.resolve(getAllExams("active")),
  ]);

  const recentAttempts = attempts.slice(0, 5);
  const featuredTests = allTests.slice(0, 4);

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* ------------------------------------------------------------------ */}
      {/* Welcome Banner */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-xl border border-border bg-gradient-to-r from-primary/10 via-surface to-surface p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="info" className="font-semibold text-xs">
              {user.profile.targetExam || "Entry Test Prep"}
            </Badge>
            <span className="text-xs text-text-secondary">
              {user.profile.institution}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Welcome back, {user.name}
          </h1>
          <p className="text-sm text-text-secondary mt-1 max-w-xl">
            Track your progress, revisit past test rationales, and target high-yield
            curriculum areas for your upcoming entrance examinations.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link href="/student/tests">
            <Button size="md" className="shadow-xs">
              <FileCheck2 className="w-4 h-4 mr-1.5" />
              Take a Practice Test
            </Button>
          </Link>
          <Link href="/student/profile">
            <Button variant="outline" size="md">
              Edit Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Metric Overview Cards (Real Data) */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tests Attempted */}
        <Card className="shadow-2xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-text-secondary">Tests Attempted</p>
              <h2 className="text-2xl font-bold text-text-primary mt-1">
                {stats.testsAttempted}
              </h2>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Questions Solved */}
        <Card className="shadow-2xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-text-secondary">Questions Solved</p>
              <h2 className="text-2xl font-bold text-text-primary mt-1">
                {stats.questionsSolved}
              </h2>
            </div>
            <div className="w-10 h-10 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Average Score */}
        <Card className="shadow-2xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-text-secondary">Average Score</p>
              <h2 className="text-2xl font-bold text-text-primary mt-1">
                {stats.averageScore !== null ? `${stats.averageScore}%` : "—"}
              </h2>
            </div>
            <div className="w-10 h-10 rounded-lg bg-info/10 text-info flex items-center justify-center">
              <BarChart2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Target Exam Focus */}
        <Card className="shadow-2xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-text-secondary">Target Exam</p>
              <h2 className="text-xl font-bold text-text-primary mt-1 truncate max-w-[140px]">
                {user.profile.targetExam || "MDCAT"}
              </h2>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Subject Preparation Progress (Calculated from Real Attempts) */}
      {/* ------------------------------------------------------------------ */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              Subject Preparation Progress
            </h2>
            <p className="text-xs text-text-secondary">
              Accuracy calculated from your completed tests and diagnostic quizzes
            </p>
          </div>
        </div>

        {stats.subjectProgress.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.subjectProgress.map((sub) => (
              <Card key={sub.subjectId} className="shadow-2xs">
                <CardContent className="p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-text-primary text-sm">
                        {sub.subjectTitle}
                      </span>
                      <span className="font-bold text-primary text-sm">
                        {sub.averageScore}%
                      </span>
                    </div>

                    <div className="w-full bg-border rounded-full h-2 mb-3 overflow-hidden">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, sub.averageScore)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-text-secondary border-t border-border pt-2.5">
                    <span>{sub.attemptsCount} test{sub.attemptsCount === 1 ? "" : "s"} taken</span>
                    <span>{sub.questionsSolved} questions</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center border-dashed border-border bg-surface/50">
            <BookOpen className="w-8 h-8 text-text-secondary/60 mx-auto mb-2" />
            <p className="text-sm font-semibold text-text-primary">
              No Subject Progress Recorded Yet
            </p>
            <p className="text-xs text-text-secondary max-w-md mx-auto mt-1 mb-4">
              Complete practice tests to unlock your subject accuracy breakdown and identify
              high-yield topics that need revision.
            </p>
            <Link href="/student/tests">
              <Button variant="outline" size="sm">
                Explore Available Tests
              </Button>
            </Link>
          </Card>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 2-Column: Recent Attempts & Available Tests */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Attempts */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">Recent Test Attempts</h2>
            {attempts.length > 0 && (
              <Link
                href="/student/attempts"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                View all ({attempts.length})
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {recentAttempts.length > 0 ? (
            <div className="flex flex-col gap-3">
              {recentAttempts.map((attempt) => (
                <Card
                  key={attempt.id}
                  className="hover:border-primary/40 transition-colors shadow-2xs"
                >
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="default" className="text-[10px] py-0">
                          {attempt.examTitle}
                        </Badge>
                        <span className="text-[11px] text-text-secondary truncate">
                          {attempt.subjectTitle}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-text-primary truncate">
                        {attempt.testTitle}
                      </h4>
                      <div className="flex items-center gap-3 text-[11px] text-text-secondary mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(attempt.completedAt).toLocaleDateString()}
                        </span>
                        <span>
                          Score: {attempt.score}/{attempt.totalQuestions}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge
                        variant={
                          attempt.percentage >= 70
                            ? "success"
                            : attempt.percentage >= 50
                            ? "warning"
                            : "error"
                        }
                        className="font-bold text-xs"
                      >
                        {attempt.percentage}%
                      </Badge>
                      <Link href={`/student/attempts/${attempt.id}`}>
                        <Button variant="outline" size="sm" className="h-7 text-xs px-2.5">
                          Review
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No tests attempted yet"
              description="Your completed diagnostic assessments and practice quiz results will appear here."
              action={
                <Link href="/student/tests">
                  <Button size="sm">Start a Test</Button>
                </Link>
              }
            />
          )}
        </section>

        {/* Available Tests */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">Available Tests</h2>
            <Link
              href="/student/tests"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              Browse all ({allTests.length})
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {featuredTests.map((test) => {
              const exam = exams.find((e) => e.id === test.examId);
              return (
                <Card
                  key={test.id}
                  className="hover:border-primary/40 transition-colors shadow-2xs"
                >
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="info" className="text-[10px] py-0">
                          {exam?.code || test.examId.toUpperCase()}
                        </Badge>
                        <span className="text-[11px] text-text-secondary flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {test.durationMinutes} mins
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-text-primary truncate">
                        {test.title}
                      </h4>
                      <p className="text-[11px] text-text-secondary line-clamp-1 mt-0.5">
                        {test.questionCount} Questions • {test.difficulty.toUpperCase()}
                      </p>
                    </div>

                    <div className="shrink-0">
                      <Link
                        href={`/exams/${test.examId}/topics/${test.topicId || "cell-biology"}/practice?testId=${test.id}`}
                      >
                        <Button size="sm" className="h-8 px-3 text-xs">
                          Start Test
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
