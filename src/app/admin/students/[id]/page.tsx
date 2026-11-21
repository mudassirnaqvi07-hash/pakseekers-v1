import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { requireAdmin } from "@/server/auth/session";
import { getStudentWithDetails } from "@/server/services/user-service";
import { getAllExams } from "@/server/services/content-service";
import { getStudentEnrollments } from "@/server/repositories/enrollment-repository";
import { Button, Badge, Card } from "@/components/ui";
import { StudentStatusToggle } from "@/features/admin/components/student-status-toggle";
import { StudentEditForm } from "@/features/admin/components/student-edit-form";
import { StudentEnrollmentsCard } from "@/features/admin/components/student-enrollments-card";
import type { Exam, TestAttempt } from "@/types";

export const metadata: Metadata = {
  title: "Student Details — PakSeekers Admin",
};

interface StudentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentDetailPage({ params }: StudentDetailPageProps) {
  await requireAdmin();
  const { id } = await params;

  const [studentData, exams, enrollments] = await Promise.all([
    getStudentWithDetails(id),
    getAllExams(),
    getStudentEnrollments(id),
  ]);

  if (!studentData) {
    notFound();
  }

  const { student, attempts, stats } = studentData;
  const examMap = new Map<string, Exam>(exams.map((e: Exam) => [e.id, e]));
  const studentStatus = student.status || "active";

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      {/* Top Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/students">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4 shrink-0" />}
          >
            Back to Students
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <Badge
            variant={studentStatus === "active" ? "success" : "error"}
            className="text-xs uppercase tracking-wider font-bold"
          >
            {studentStatus}
          </Badge>
          <StudentStatusToggle
            studentId={student.id}
            studentName={student.name}
            studentEmail={student.email}
            currentStatus={studentStatus}
            redirectOnDelete={true}
          />
        </div>
      </div>

      {/* Header Profile Summary */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl shrink-0">
              {student.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight truncate">
                {student.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary mt-1">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  {student.email}
                </span>
                {student.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    {student.phone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  Joined {new Date(student.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {student.targetExam && (
              <Badge variant="info" className="text-xs font-bold px-3 py-1">
                Target: {student.targetExam}
              </Badge>
            )}
            {student.city && (
              <Badge variant="neutral" className="text-xs px-2.5 py-1">
                {student.city}
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Diagnostic Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-3.5 sm:p-4 text-center">
          <p className="text-[11px] sm:text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Total Attempts
          </p>
          <p className="text-xl sm:text-2xl font-extrabold text-primary mt-1">
            {stats.testsAttempted}
          </p>
        </Card>
        <Card className="p-3.5 sm:p-4 text-center">
          <p className="text-[11px] sm:text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Completed Tests
          </p>
          <p className="text-xl sm:text-2xl font-extrabold text-success mt-1">
            {stats.completedTests}
          </p>
        </Card>
        <Card className="p-3.5 sm:p-4 text-center">
          <p className="text-[11px] sm:text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Average Score
          </p>
          <p className="text-xl sm:text-2xl font-extrabold text-text-primary mt-1">
            {stats.averageScore ?? 0}%
          </p>
        </Card>
        <Card className="p-3.5 sm:p-4 text-center">
          <p className="text-[11px] sm:text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Questions Answered
          </p>
          <p className="text-xl sm:text-2xl font-extrabold text-accent mt-1">
            {stats.questionsSolved}
          </p>
        </Card>
      </div>

      {/* Student Examination Enrollments */}
      <StudentEnrollmentsCard
        studentId={student.id}
        studentName={student.name}
        enrollments={enrollments}
        allExams={exams}
      />

      {/* Profile Edit Form */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-base font-bold text-text-primary mb-3">
          Edit Student Details
        </h3>
        <StudentEditForm student={student} />
      </Card>

      {/* Test Attempt History */}
      <Card noPadding className="overflow-hidden">
        <div className="p-4 border-b border-border bg-background/50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary shrink-0" />
            Recent Assessment History ({attempts.length})
          </h3>
        </div>

        {attempts.length === 0 ? (
          <div className="p-8 text-center text-xs text-text-secondary">
            This student has not taken any diagnostic tests or practice sessions yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[580px] text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-text-secondary uppercase tracking-wider bg-background/30">
                  <th className="py-2.5 px-3 sm:px-4">Test Title</th>
                  <th className="py-2.5 px-3 sm:px-4">Exam</th>
                  <th className="py-2.5 px-3 sm:px-4">Score</th>
                  <th className="py-2.5 px-3 sm:px-4">Accuracy</th>
                  <th className="py-2.5 px-3 sm:px-4">Status</th>
                  <th className="py-2.5 px-3 sm:px-4">Date Taken</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {attempts.map((attempt: TestAttempt) => {
                  const exam = examMap.get(attempt.examId);
                  const isPassed = attempt.percentage >= 60;

                  return (
                    <tr key={attempt.id} className="hover:bg-background/40">
                      <td className="py-3 px-3 sm:px-4 font-medium text-text-primary">
                        {attempt.testTitle}
                      </td>
                      <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                        {exam ? (
                          <Badge variant="info" className="text-[10px]">
                            {exam.code}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 px-3 sm:px-4 whitespace-nowrap font-semibold text-text-primary">
                        {attempt.score} / {attempt.totalQuestions}
                      </td>
                      <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                        <Badge
                          variant={isPassed ? "success" : "error"}
                          className="text-[10px] font-bold"
                        >
                          {attempt.percentage}%
                        </Badge>
                      </td>
                      <td className="py-3 px-3 sm:px-4 whitespace-nowrap capitalize">
                        {attempt.status}
                      </td>
                      <td className="py-3 px-3 sm:px-4 whitespace-nowrap text-text-secondary">
                        {new Date(attempt.startedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
