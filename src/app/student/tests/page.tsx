/**
 * Available Tests Page — PakSeekers Phase 4.
 *
 * Full catalog of published tests ready for students to take:
 * topic practice tests and grand entrance exam simulations (mocks).
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Clock, HelpCircle, ArrowRight, Layers, Award, PlusCircle } from "lucide-react";
import { Badge, Button, Card, CardContent } from "@/components/ui";
import { PageHeader, EmptyState } from "@/components/shared";
import { requireStudent } from "@/server/auth/session";
import {
  getAllExams,
  getSubjectsByExamId,
  getEnrolledTests,
} from "@/server/services/content-service";
import { getStudentEnrollments } from "@/server/repositories/enrollment-repository";

export const metadata: Metadata = {
  title: "Available Tests & Mocks — PakSeekers",
  description: "Browse and take standardized entrance examination tests and diagnostic grand mocks.",
};

export default async function StudentTestsPage({
  searchParams,
}: {
  searchParams: Promise<{ exam?: string; subject?: string; type?: string }>;
}) {
  const user = await requireStudent();
  const { exam: selectedExam, subject: selectedSubject, type: selectedType } =
    await searchParams;

  const [activeEnrollments, allExams] = await Promise.all([
    getStudentEnrollments(user.id, "ACTIVE"),
    getAllExams(),
  ]);

  if (activeEnrollments.length === 0) {
    return (
      <div className="flex flex-col gap-8 w-full">
        <PageHeader
          title="Available Curriculum Tests & Mocks"
          description="Choose a timed diagnostic assessment or full-length entrance exam simulation under realistic test conditions."
        />
        <EmptyState
          icon={<Award className="w-8 h-8 text-primary" />}
          title="No Active Examination Preparations"
          description="You are not actively enrolled in any examination tracks. Please enroll in your target exam (MDCAT, ECAT, FAST, NTS) to access curriculum tests."
          action={
            <Link href="/exams">
              <Button size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Browse Examination Catalog
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const enrolledExamIds = new Set(
    activeEnrollments.map((e) => e.examinationId.toLowerCase())
  );
  const enrolledExams = allExams.filter((e) =>
    enrolledExamIds.has(e.id.toLowerCase())
  );

  // Validate selectedExam against enrolled tracks
  const effectiveExam =
    selectedExam && enrolledExamIds.has(selectedExam.toLowerCase())
      ? selectedExam
      : undefined;

  const [rawTests, allSubjects] = await Promise.all([
    getEnrolledTests(user.id, { examId: effectiveExam }),
    effectiveExam
      ? getSubjectsByExamId(effectiveExam)
      : (
          await Promise.all(
            enrolledExams.map((e) => getSubjectsByExamId(e.id))
          )
        ).flat(),
  ]);

  let allTests = selectedSubject
    ? rawTests.filter((t) => t.subjectId === selectedSubject)
    : rawTests;

  if (selectedType === "mock") {
    allTests = allTests.filter((t) => t.testType === "mock");
  } else if (selectedType === "practice") {
    allTests = allTests.filter((t) => t.testType !== "mock");
  }

  const mockCount = rawTests.filter((t) => t.testType === "mock").length;
  const practiceCount = rawTests.filter((t) => t.testType !== "mock").length;

  return (
    <div className="flex flex-col gap-8 w-full">
      <PageHeader
        title="Available Curriculum Tests & Mocks"
        description="Choose a timed diagnostic assessment or full-length entrance exam simulation under realistic test conditions."
      />

      {/* Filter Bars */}
      <div className="flex flex-col gap-3 pb-2 border-b border-border">
        {/* Test Type Tabs */}
        <div className="flex items-center gap-2 pb-2 overflow-x-auto scrollbar-thin">
          <Link
            href={`/student/tests?${new URLSearchParams({
              ...(selectedExam ? { exam: selectedExam } : {}),
              ...(selectedSubject ? { subject: selectedSubject } : {}),
            }).toString()}`}
            className="shrink-0"
          >
            <Button
              variant={!selectedType ? "primary" : "outline"}
              size="sm"
              className="text-xs h-8 whitespace-nowrap"
            >
              All Assessments ({rawTests.length})
            </Button>
          </Link>
          <Link
            href={`/student/tests?${new URLSearchParams({
              ...(selectedExam ? { exam: selectedExam } : {}),
              ...(selectedSubject ? { subject: selectedSubject } : {}),
              type: "practice",
            }).toString()}`}
            className="shrink-0"
          >
            <Button
              variant={selectedType === "practice" ? "primary" : "outline"}
              size="sm"
              className="text-xs h-8 whitespace-nowrap"
            >
              Topic Practice ({practiceCount})
            </Button>
          </Link>
          <Link
            href={`/student/tests?${new URLSearchParams({
              ...(selectedExam ? { exam: selectedExam } : {}),
              ...(selectedSubject ? { subject: selectedSubject } : {}),
              type: "mock",
            }).toString()}`}
            className="shrink-0"
          >
            <Button
              variant={selectedType === "mock" ? "primary" : "outline"}
              size="sm"
              className="text-xs h-8 whitespace-nowrap"
              leftIcon={<Award className="w-3.5 h-3.5 shrink-0" />}
            >
              Full-Length Mocks ({mockCount})
            </Button>
          </Link>
        </div>

        {/* Exam Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Link
            href={`/student/tests${selectedType ? `?type=${selectedType}` : ""}`}
          >
            <Button
              variant={!selectedExam ? "secondary" : "ghost"}
              size="sm"
              className="text-xs shrink-0 h-7 px-2.5"
            >
              All My Exams
            </Button>
          </Link>
          {enrolledExams.map((e) => (
            <Link
              key={e.id}
              href={`/student/tests?exam=${e.id}${
                selectedType ? `&type=${selectedType}` : ""
              }`}
            >
              <Button
                variant={selectedExam === e.id ? "secondary" : "ghost"}
                size="sm"
                className="text-xs shrink-0 h-7 px-2.5"
              >
                {e.code}
              </Button>
            </Link>
          ))}
          <Link href="/exams">
            <Button
              variant="outline"
              size="sm"
              className="text-xs shrink-0 h-7 px-2 border-dashed"
              leftIcon={<PlusCircle className="w-3 h-3" />}
            >
              Add Exam Track
            </Button>
          </Link>
        </div>

        {/* Subject Filter Pills (when available) */}
        {allSubjects.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto text-xs text-text-secondary pt-1">
            <span className="font-semibold shrink-0 text-text-primary text-[11px] uppercase tracking-wider">
              Subjects:
            </span>
            <Link
              href={
                selectedExam
                  ? `/student/tests?exam=${selectedExam}${
                      selectedType ? `&type=${selectedType}` : ""
                    }`
                  : `/student/tests${selectedType ? `?type=${selectedType}` : ""}`
              }
            >
              <Badge
                variant={!selectedSubject ? "default" : "info"}
                className="cursor-pointer hover:bg-surface-hover transition-colors"
              >
                All Subjects
              </Badge>
            </Link>
            {allSubjects.map((s) => (
              <Link
                key={s.id}
                href={
                  selectedExam
                    ? `/student/tests?exam=${selectedExam}&subject=${s.id}${
                        selectedType ? `&type=${selectedType}` : ""
                      }`
                    : `/student/tests?subject=${s.id}${
                        selectedType ? `&type=${selectedType}` : ""
                      }`
                }
              >
                <Badge
                  variant={selectedSubject === s.id ? "default" : "info"}
                  className="cursor-pointer hover:bg-surface-hover transition-colors"
                >
                  {s.title}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Tests Grid */}
      {allTests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allTests.map((test) => {
            const exam = allExams.find((e) => e.id === test.examId);
            const subject = allSubjects.find((s) => s.id === test.subjectId);
            const isMock = test.testType === "mock";

            return (
              <Card
                key={test.id}
                className={`flex flex-col justify-between hover:border-primary/50 transition-all hover:shadow-md ${
                  isMock ? "border-primary/40 bg-primary/2" : ""
                }`}
              >
                <CardContent className="p-4 sm:p-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="info" className="font-bold text-xs tracking-wider">
                          {exam?.code || test.examId.toUpperCase()}
                        </Badge>
                        {isMock && (
                          <Badge variant="default" className="text-[10px] font-bold uppercase bg-primary text-white">
                            Grand Mock
                          </Badge>
                        )}
                      </div>
                      <Badge
                        variant={
                          test.difficulty === "easy"
                            ? "success"
                            : test.difficulty === "medium"
                            ? "info"
                            : "warning"
                        }
                        className="text-[10px] py-0 font-medium"
                      >
                        {test.difficulty.toUpperCase()}
                      </Badge>
                    </div>

                    <h3 className="text-base font-bold text-text-primary leading-snug mb-1">
                      {test.title}
                    </h3>
                    <p className="text-xs text-text-secondary line-clamp-2 mb-4">
                      {test.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-surface border border-border text-xs text-text-secondary mb-6">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{test.durationMinutes} mins</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{test.questionCount} MCQs</span>
                      </div>
                      {isMock ? (
                        <div className="col-span-2 flex items-center justify-between text-[11px] pt-1 border-t border-border">
                          <span>
                            Total: <strong>{test.totalMarks ?? test.questionCount}</strong> marks
                          </span>
                          {test.negativeMarking && (
                            <Badge variant="error" className="text-[10px]">
                              -0.25 Neg Marking
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <div className="col-span-2 flex items-center gap-1.5 truncate text-[11px]">
                          <Layers className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                          <span className="truncate">{subject?.title || "Curriculum Unit"}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Link href={`/tests/${test.id}`}>
                    <Button
                      size="sm"
                      className="w-full"
                      rightIcon={<ArrowRight className="w-3.5 h-3.5 shrink-0" />}
                    >
                      {isMock ? "Begin Mock Exam" : "Start Test"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No Published Tests Found"
          description="There are currently no published tests matching your selected filter. Please check another exam or return to all tests."
          action={
            <Link href="/student/tests">
              <Button size="sm">View All Tests</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
