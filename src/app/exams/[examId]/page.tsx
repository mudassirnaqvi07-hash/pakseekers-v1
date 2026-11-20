import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2, Clock, HelpCircle } from "lucide-react";
import { getExamById, getSubjectsByExamId, getAllPublishedTests } from "@/server/services/content-service";
import { getCurrentUser } from "@/server/auth/session";
import { canAccessExamination } from "@/server/services/enrollment-service";
import { SubjectCard } from "@/features/exams/components/subject-card";
import { EnrollExamButton } from "@/features/exams/components/enroll-exam-button";
import { RemoveExamDialog } from "@/features/exams/components/remove-exam-dialog";
import { Button, Badge, Card, CardContent } from "@/components/ui";

interface ExamDetailPageProps {
  params: Promise<{ examId: string }>;
}

export async function generateMetadata({
  params,
}: ExamDetailPageProps): Promise<Metadata> {
  const { examId } = await params;
  const exam = await getExamById(examId);

  if (!exam) {
    return { title: "Exam Not Found | PakSeekers" };
  }

  return {
    title: `${exam.title} (${exam.code}) | PakSeekers`,
    description: exam.description,
  };
}

export default async function ExamDetailPage({ params }: ExamDetailPageProps) {
  const { examId } = await params;
  const exam = await getExamById(examId);

  if (!exam) {
    notFound();
  }

  const [subjects, user, tests] = await Promise.all([
    getSubjectsByExamId(examId),
    getCurrentUser(),
    getAllPublishedTests(exam.id),
  ]);

  const isEnrolled = user ? await canAccessExamination(user.id, exam.id) : false;
  const isStudent = user?.role === "student" || user?.role === "admin";

  return (
    <div className="flex flex-col gap-8">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumbs" className="flex items-center gap-2 text-xs text-text-secondary">
        <Link href="/exams" className="hover:text-primary transition-colors">
          Exams
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-text-primary">{exam.code}</span>
      </nav>

      {/* Exam Header Banner */}
      <div className="bg-surface border border-border rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded bg-primary/10 text-primary font-bold text-xs uppercase">
                {exam.code}
              </span>
              {isEnrolled ? (
                <Badge variant="success" className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Enrolled Track</span>
                </Badge>
              ) : (
                <Badge variant="info" dot>
                  Curriculum Active
                </Badge>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
              {exam.title}
            </h1>
            <p className="text-sm text-text-secondary max-w-3xl leading-relaxed mt-1">
              {exam.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start sm:self-auto">
            {isEnrolled && (
              <RemoveExamDialog
                examId={exam.id}
                examTitle={exam.title}
                examCode={exam.code}
                triggerVariant="outline"
              />
            )}
            <Link href="/exams">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                All Exams
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Enrollment Callout Banner (shown if not currently enrolled) */}
      {!isEnrolled && (
        <div className="rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-surface to-surface p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-2xs">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Full Preparation Track Access</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-text-primary">
              Enroll in {exam.code} Preparation Track
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary mt-1 leading-relaxed">
              Activate your syllabus workspace, unlock full question bank practice, and take timed diagnostic assessments under authentic exam conditions.
            </p>
          </div>

          <div className="shrink-0">
            {isStudent ? (
              <EnrollExamButton
                examId={exam.id}
                examCode={exam.code}
                size="md"
                variant="primary"
                className="shadow-xs"
              />
            ) : (
              <Link href={`/login?callbackUrl=/exams/${exam.id}`}>
                <Button size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Sign In to Enroll
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Subjects Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              Subjects & Syllabus Breakdown
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Select a subject to view curriculum topics and high-yield question practice.
            </p>
          </div>
          <span className="text-xs font-medium text-text-secondary bg-surface border border-border px-3 py-1 rounded-full">
            {subjects.length} Subjects
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              examId={exam.id}
            />
          ))}
        </div>
      </div>

      {/* Tests Section (when enrolled) */}
      {isEnrolled && tests.length > 0 && (
        <div className="flex flex-col gap-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-text-primary">
                Available Assessments & Practice Tests
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Timed curriculum tests and simulations designed specifically for {exam.code}.
              </p>
            </div>
            <Link
              href={`/student/tests?exam=${exam.id}`}
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>View all ({tests.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tests.slice(0, 3).map((test) => (
              <Card key={test.id} className="hover:border-primary/50 transition-all shadow-2xs">
                <CardContent className="p-4 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <Badge variant="info" className="text-[10px] py-0">
                        {test.testType === "mock" ? "Grand Mock" : "Practice"}
                      </Badge>
                      <span className="text-[11px] text-text-secondary flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {test.durationMinutes} mins
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-text-primary line-clamp-1">
                      {test.title}
                    </h3>
                    <p className="text-xs text-text-secondary line-clamp-2 mt-1">
                      {test.description}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    <span className="text-[11px] text-text-secondary flex items-center gap-1">
                      <HelpCircle className="w-3 h-3" />
                      {test.questionCount} MCQs
                    </span>
                    <Link href={`/tests/${test.id}`}>
                      <Button size="sm" className="h-7 text-xs px-2.5">
                        Start Test
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
