/**
 * Available Tests Page — PakSeekers Phase 4.
 *
 * Full catalog of published tests ready for students to take.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Clock, HelpCircle, ArrowRight, Layers } from "lucide-react";
import { Badge, Button, Card, CardContent } from "@/components/ui";
import { PageHeader, EmptyState } from "@/components/shared";
import { requireStudent } from "@/server/auth/session";
import {
  getAllTests,
  getAllExams,
  getAllSubjects,
} from "@/server/repositories/content-repository";

export const metadata: Metadata = {
  title: "Available Tests",
  description: "Browse and take standardized entrance examination tests and diagnostic quizzes.",
};

export default async function StudentTestsPage({
  searchParams,
}: {
  searchParams: Promise<{ exam?: string }>;
}) {
  await requireStudent();
  const { exam: selectedExam } = await searchParams;

  const [allTests, exams, subjects] = await Promise.all([
    Promise.resolve(
      getAllTests({
        status: "published",
        examId: selectedExam,
      })
    ),
    Promise.resolve(getAllExams("active")),
    Promise.resolve(getAllSubjects()),
  ]);

  return (
    <div className="flex flex-col gap-8 w-full">
      <PageHeader
        title="Available Curriculum Tests"
        description="Choose a timed diagnostic assessment to practice under realistic test conditions."
      />

      {/* Exam Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border">
        <Link href="/student/tests">
          <Button
            variant={!selectedExam ? "primary" : "outline"}
            size="sm"
            className="text-xs shrink-0"
          >
            All Exams ({allTests.length})
          </Button>
        </Link>
        {exams.map((e) => (
          <Link key={e.id} href={`/student/tests?exam=${e.id}`}>
            <Button
              variant={selectedExam === e.id ? "primary" : "outline"}
              size="sm"
              className="text-xs shrink-0"
            >
              {e.code}
            </Button>
          </Link>
        ))}
      </div>

      {/* Tests Grid */}
      {allTests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allTests.map((test) => {
            const exam = exams.find((e) => e.id === test.examId);
            const subject = subjects.find((s) => s.id === test.subjectId);

            return (
              <Card
                key={test.id}
                className="flex flex-col justify-between hover:border-primary/50 transition-all hover:shadow-md"
              >
                <CardContent className="p-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="info" className="font-bold text-xs tracking-wider">
                        {exam?.code || test.examId.toUpperCase()}
                      </Badge>
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
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span>{test.durationMinutes} minutes</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-primary" />
                        <span>{test.questionCount} questions</span>
                      </div>
                      <div className="col-span-2 flex items-center gap-1.5 truncate text-[11px]">
                        <Layers className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                        <span className="truncate">{subject?.title || "Subject"}</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/exams/${test.examId}/topics/${test.topicId || "cell-biology"}/practice?testId=${test.id}`}
                  >
                    <Button size="sm" className="w-full">
                      Start Test
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
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
