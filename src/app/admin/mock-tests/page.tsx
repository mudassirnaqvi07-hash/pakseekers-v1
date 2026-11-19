import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Award, Clock, HelpCircle, Edit, Eye } from "lucide-react";
import { requireAdmin } from "@/server/auth/session";
import {
  getAdminAllMockTests,
  getAllExams,
} from "@/server/services/content-service";
import { PageHeader } from "@/components/shared/page-header";
import { Button, Badge, Card, CardContent } from "@/components/ui";
import { DeleteConfirmButton } from "@/features/admin/components/delete-confirm-button";
import {
  deleteMockTestAction,
  toggleMockTestPublishAction,
} from "@/server/actions/content-actions";

export const metadata: Metadata = {
  title: "Mock Tests Management — PakSeekers Admin",
  description: "Full-length timed entrance exam simulations.",
};

export default async function MockTestsPage() {
  await requireAdmin();

  const [mockTests, exams] = await Promise.all([
    getAdminAllMockTests(),
    getAllExams(),
  ]);

  const examMap = new Map(exams.map((e) => [e.id, e]));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Mock Tests Management"
        description="Build full-length timed entrance exam simulations with negative marking, custom total marks, and passing benchmarks."
        actions={
          <Link href="/admin/mock-tests/new">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4 shrink-0" />}
            >
              Assemble Mock Test
            </Button>
          </Link>
        }
      />

      {mockTests.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Award className="w-6 h-6 shrink-0" />
            </div>
            <h3 className="text-base font-bold text-text-primary">No Mock Tests Configured</h3>
            <p className="text-sm text-text-secondary max-w-sm">
              Create grand entrance exam simulations to give students full-length, timed test practice.
            </p>
            <Link href="/admin/mock-tests/new" className="mt-2">
              <Button size="sm" variant="primary" leftIcon={<Plus className="w-4 h-4 shrink-0" />}>
                Create First Mock Exam
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card noPadding className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-background/50 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  <th className="py-3 px-3 sm:px-4">Title</th>
                  <th className="py-3 px-3 sm:px-4">Exam</th>
                  <th className="py-3 px-3 sm:px-4">Questions</th>
                  <th className="py-3 px-3 sm:px-4">Duration</th>
                  <th className="py-3 px-3 sm:px-4">Marks</th>
                  <th className="py-3 px-3 sm:px-4">Negative Marking</th>
                  <th className="py-3 px-3 sm:px-4">Status</th>
                  <th className="py-3 px-3 sm:px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mockTests.map((mock) => {
                  const exam = examMap.get(mock.examId);

                  return (
                    <tr
                      key={mock.id}
                      className="hover:bg-background/40 transition-colors group"
                    >
                      <td className="py-3 px-3 sm:px-4 max-w-md">
                        <div className="font-semibold text-text-primary">
                          {mock.title}
                        </div>
                        {mock.description && (
                          <div className="text-xs text-text-secondary line-clamp-1 mt-0.5">
                            {mock.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                        {exam ? (
                          <Badge variant="info" className="text-xs">
                            {exam.code}
                          </Badge>
                        ) : (
                          <span className="text-xs text-text-secondary">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 sm:px-4 whitespace-nowrap text-xs text-text-secondary">
                        <span className="inline-flex items-center gap-1 font-medium text-text-primary">
                          <HelpCircle className="w-3.5 h-3.5 shrink-0 text-primary" />
                          {mock.questionCount} MCQs
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:px-4 whitespace-nowrap text-xs text-text-secondary">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          {mock.durationMinutes} mins
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:px-4 whitespace-nowrap text-xs text-text-secondary">
                        <span className="font-semibold text-text-primary">
                          {mock.totalMarks ?? mock.questionCount}
                        </span>{" "}
                        (Pass: {mock.passingMarks ?? Math.round((mock.totalMarks ?? mock.questionCount) * 0.6)})
                      </td>
                      <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                        <Badge
                          variant={mock.negativeMarking ? "error" : "neutral"}
                          className="text-[10px]"
                        >
                          {mock.negativeMarking ? "Yes (-0.25)" : "No"}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                        <form
                          action={async () => {
                            "use server";
                            await toggleMockTestPublishAction(mock.id);
                          }}
                        >
                          <button
                            type="submit"
                            title="Click to toggle publication"
                            className="cursor-pointer transition-transform active:scale-95"
                          >
                            <Badge
                              variant={mock.status === "published" ? "success" : "neutral"}
                              className="text-xs capitalize"
                            >
                              {mock.status}
                            </Badge>
                          </button>
                        </form>
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <Link href={`/admin/tests/${mock.id}/preview`}>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-text-secondary hover:text-primary"
                              leftIcon={<Eye className="w-3.5 h-3.5 shrink-0" />}
                            >
                              Preview
                            </Button>
                          </Link>
                          <Link href={`/admin/mock-tests/${mock.id}/edit`}>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-text-secondary hover:text-primary"
                              leftIcon={<Edit className="w-3.5 h-3.5 shrink-0" />}
                            >
                              Edit
                            </Button>
                          </Link>
                          <DeleteConfirmButton
                            itemId={mock.id}
                            itemType="Mock Test"
                            itemTitle={mock.title}
                            deleteAction={deleteMockTestAction}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
