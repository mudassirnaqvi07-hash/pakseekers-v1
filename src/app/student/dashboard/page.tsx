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
  Award,
  AlertTriangle,
  GraduationCap,
  PlusCircle,
} from "lucide-react";
import { Badge, Button, Card, CardContent } from "@/components/ui";
import { EmptyState } from "@/components/shared";
import { requireStudent } from "@/server/auth/session";
import { getStudentDashboardStats, getStudentAttempts } from "@/server/services/user-service";
import {
  getAllExams,
  getSubjectsByExamId,
  getEnrolledTests,
} from "@/server/services/content-service";
import { getStudentEnrolledExamsDetails } from "@/server/services/enrollment-service";
import { ExamEnrollmentCard } from "@/features/exams/components/exam-enrollment-card";

export const metadata: Metadata = {
  title: "Student Dashboard",
  description: "View your entrance exam preparation overview, recent attempts, and curriculum progress.",
};

export default async function StudentDashboardPage() {
  const user = await requireStudent();

  const [stats, attempts, enrolledDetails, allExams] = await Promise.all([
    getStudentDashboardStats(user.id),
    getStudentAttempts(user.id),
    getStudentEnrolledExamsDetails(user.id),
    getAllExams(),
  ]);

  // Scope subjects and tests strictly to active enrolled examinations
  const hasEnrollments = enrolledDetails.length > 0;
  const enrolledSubjects = hasEnrollments
    ? (await Promise.all(enrolledDetails.map((d) => getSubjectsByExamId(d.exam.id)))).flat()
    : [];

  const enrolledTests = hasEnrollments
    ? await getEnrolledTests(user.id)
    : [];

  const recentAttempts = attempts.slice(0, 5);
  const featuredTests = enrolledTests.slice(0, 4);

  const preparationTrackTitle = hasEnrollments
    ? enrolledDetails.map((d) => d.exam.code).join(" • ")
    : user.profile.targetExam || "Entry Test Prep";

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* ------------------------------------------------------------------ */}
      {/* Welcome Banner */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-xl border border-border bg-gradient-to-r from-primary/10 via-surface to-surface p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="info" className="font-semibold text-xs">
              {preparationTrackTitle}
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

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto shrink-0">
          <Link href="/exams" className="w-full sm:w-auto">
            <Button
              size="md"
              variant="outline"
              className="w-full sm:w-auto justify-center"
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Add Another Exam
            </Button>
          </Link>
          <Link href="/student/tests" className="w-full sm:w-auto">
            <Button
              size="md"
              className="shadow-xs w-full sm:w-auto justify-center"
              leftIcon={<FileCheck2 className="w-4 h-4" />}
            >
              Take Practice Test
            </Button>
          </Link>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* My Examinations / Active Preparations Section */}
      {/* ------------------------------------------------------------------ */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              My Examination Preparations
            </h2>
            <p className="text-xs text-text-secondary">
              {hasEnrollments
                ? `You are currently actively preparing for ${enrolledDetails.length} examination${
                    enrolledDetails.length === 1 ? "" : "s"
                  }.`
                : "Select an examination track to activate your curriculum workspace."}
            </p>
          </div>
          <Link
            href="/exams"
            className="text-xs font-semibold text-primary hover:underline inline-flex flex-row items-center gap-1 whitespace-nowrap shrink-0"
          >
            <span>Browse all exams</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </Link>
        </div>

        {hasEnrollments ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolledDetails.map((details) => (
              <ExamEnrollmentCard
                key={details.enrollment.id}
                details={details}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-surface/70 p-6 sm:p-8 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">
                No Active Examination Preparations
              </h3>
              <p className="text-xs text-text-secondary max-w-md mx-auto mt-1">
                You have not enrolled in any examination tracks yet. Choose your target entrance exams (MDCAT, ECAT, FAST, NTS) to access curriculum subjects and practice tests.
              </p>
            </div>
            <Link href="/exams" className="mt-2">
              <Button size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Explore Examination Tracks
              </Button>
            </Link>
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Metric Overview Cards (Authoritative Database Analytics) */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Tests Attempted */}
        <Card className="shadow-2xs">
          <CardContent className="p-3.5 sm:p-5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-semibold text-text-secondary truncate">Tests Attempted</p>
              <h2 className="text-xl sm:text-2xl font-bold text-text-primary mt-0.5 sm:mt-1">
                {stats.testsAttempted}
              </h2>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FileCheck2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Completed Tests */}
        <Card className="shadow-2xs">
          <CardContent className="p-3.5 sm:p-5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-semibold text-text-secondary truncate">Completed</p>
              <h2 className="text-xl sm:text-2xl font-bold text-text-primary mt-0.5 sm:mt-1">
                {stats.completedTests ?? stats.testsAttempted}
              </h2>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Questions Solved */}
        <Card className="shadow-2xs">
          <CardContent className="p-3.5 sm:p-5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-semibold text-text-secondary truncate">Questions Solved</p>
              <h2 className="text-xl sm:text-2xl font-bold text-text-primary mt-0.5 sm:mt-1">
                {stats.questionsSolved}
              </h2>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0">
              <BarChart2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Average Score */}
        <Card className="shadow-2xs">
          <CardContent className="p-3.5 sm:p-5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-semibold text-text-secondary truncate">Average Score</p>
              <h2 className="text-xl sm:text-2xl font-bold text-text-primary mt-0.5 sm:mt-1">
                {stats.averageScore !== null ? `${stats.averageScore}%` : "—"}
              </h2>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-info/10 text-info flex items-center justify-center shrink-0">
              <Target className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Best Score */}
        <Card className="shadow-2xs col-span-2 sm:col-span-1 lg:col-span-1">
          <CardContent className="p-3.5 sm:p-5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-semibold text-text-secondary truncate">Best Score</p>
              <h2 className="text-xl sm:text-2xl font-bold text-text-primary mt-0.5 sm:mt-1">
                {stats.bestScore !== null ? `${stats.bestScore}%` : "—"}
              </h2>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Weak Areas Revision Alerts (< 60% Accuracy) */}
      {/* ------------------------------------------------------------------ */}
      {stats.weakAreas && stats.weakAreas.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="text-base font-bold text-text-primary">
              Recommended Revisions & Weak Areas
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.weakAreas.map((area) => (
              <Card
                key={area.topicId}
                className="border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50 transition-colors shadow-2xs"
              >
                <CardContent className="p-4 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[11px] font-semibold text-text-secondary truncate">
                        {area.subjectTitle || "Curriculum Topic"}
                      </span>
                      <Badge variant="error" className="text-[10px] font-bold py-0">
                        {area.accuracy}% Accuracy
                      </Badge>
                    </div>
                    <h4 className="text-sm font-bold text-text-primary truncate">
                      {area.topicTitle}
                    </h4>
                    <p className="text-xs text-text-secondary mt-1">
                      {area.incorrectCount} incorrect out of {area.totalQuestions} question{area.totalQuestions === 1 ? "" : "s"}.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/50 flex justify-end">
                    {area.examId && area.topicId ? (
                      <Link
                        href={`/exams/${area.examId}/topics/${area.topicId}/practice`}
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs px-2.5"
                          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                        >
                          Practice This Topic
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/student/tests">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs px-2.5"
                          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                        >
                          Practice Tests
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

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
      {/* Curriculum Disciplines & Subjects Quick Access */}
      {/* ------------------------------------------------------------------ */}
      {enrolledSubjects && enrolledSubjects.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-text-primary">
                Curriculum Subjects
              </h2>
              <p className="text-xs text-text-secondary">
                Explore dedicated subjects across your enrolled examination tracks
              </p>
            </div>
            <Link
              href="/exams"
              className="text-xs font-semibold text-primary hover:underline inline-flex flex-row items-center gap-1 whitespace-nowrap shrink-0"
            >
              <span>Browse all exams</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {enrolledSubjects.map((sub) => {
              const exam = allExams.find((e) => e.id === sub.examId);
              return (
                <Link
                  key={sub.id}
                  href={`/exams/${sub.examId}/subjects/${sub.id}`}
                  className="group"
                >
                  <Card className="p-4 hover:border-primary/50 transition-all hover:shadow-xs group-hover:-translate-y-0.5">
                    <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center mb-2.5">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors truncate">
                      {sub.title}
                    </h4>
                    <p className="text-[11px] text-text-secondary mt-0.5 truncate">
                      {exam?.code || sub.examId.toUpperCase()} • {sub.totalTopics} Topics
                    </p>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}

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
                className="text-xs font-semibold text-primary hover:underline inline-flex flex-row items-center gap-1 whitespace-nowrap shrink-0"
              >
                <span>View all ({attempts.length})</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
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
              className="text-xs font-semibold text-primary hover:underline inline-flex flex-row items-center gap-1 whitespace-nowrap shrink-0"
            >
              <span>Browse all ({enrolledTests.length})</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {featuredTests.map((test) => {
              const exam = allExams.find((e) => e.id === test.examId);
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
                      <Link href={`/tests/${test.id}`}>
                        <Button
                          size="sm"
                          className="h-8 px-3 text-xs"
                          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                        >
                          Start Test
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
