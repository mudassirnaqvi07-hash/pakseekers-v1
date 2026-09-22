import type { Metadata } from "next";
import Link from "next/link";
import { PlusCircle, FileEdit, Eye, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui";
import {
  getAllTests,
  getAllExams,
  getExamById,
} from "@/server/repositories/content-repository";
import { deleteTestAction } from "@/server/actions/content-actions";
import { DeleteConfirmButton } from "@/features/admin/components/delete-confirm-button";
import { PublishToggleButton } from "@/features/admin/components/publish-toggle-button";
import type { TestStatus } from "@/types";

export const metadata: Metadata = {
  title: "Test Management | PakSeekers Admin",
};

interface AdminTestsPageProps {
  searchParams: Promise<{
    examId?: string;
    subjectId?: string;
    status?: string;
  }>;
}

export default async function AdminTestsPage({
  searchParams,
}: AdminTestsPageProps) {
  const { examId, subjectId, status } = await searchParams;
  const exams = getAllExams();

  const tests = getAllTests({
    examId,
    subjectId,
    status: status as TestStatus | undefined,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Test Management"
          description="Create, structure, preview, and publish practice quizzes and diagnostic tests for students."
        />
        <Link href="/admin/tests/new">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            Create Test
          </Button>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-surface border border-border rounded-xl shadow-xs">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider mr-1">
          Filter by Exam:
        </span>
        <Link href="/admin/tests">
          <Button
            size="sm"
            variant={!examId ? "primary" : "outline"}
            className="text-xs h-7 px-2.5"
          >
            All Exams
          </Button>
        </Link>
        {exams.map((e) => (
          <Link key={e.id} href={`/admin/tests?examId=${e.id}`}>
            <Button
              size="sm"
              variant={examId?.toLowerCase() === e.id.toLowerCase() ? "primary" : "outline"}
              className="text-xs h-7 px-2.5"
            >
              {e.code}
            </Button>
          </Link>
        ))}

        <span className="h-4 w-px bg-border hidden sm:block mx-1" />

        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider mr-1">
          Status:
        </span>
        {["published", "draft"].map((st) => (
          <Link
            key={st}
            href={`/admin/tests?${examId ? `examId=${examId}&` : ""}status=${st}`}
          >
            <Button
              size="sm"
              variant={status === st ? "primary" : "outline"}
              className="text-xs h-7 px-2.5 capitalize"
            >
              {st}
            </Button>
          </Link>
        ))}
      </div>

      {/* Tests Table */}
      <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-background border-b border-border text-xs font-semibold text-text-secondary uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Test Title</th>
                <th className="px-6 py-3.5">Exam & Subject</th>
                <th className="px-6 py-3.5">Questions</th>
                <th className="px-6 py-3.5">Duration</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tests.length > 0 ? (
                tests.map((test) => {
                  const parentExam = getExamById(test.examId);

                  return (
                    <tr key={test.id} className="hover:bg-background/50 transition-colors">
                      <td className="px-6 py-4 align-top max-w-sm">
                        <div className="font-semibold text-text-primary">
                          {test.title}
                        </div>
                        <p className="text-xs text-text-secondary line-clamp-2 mt-1">
                          {test.description}
                        </p>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold text-xs uppercase inline-block">
                          {parentExam?.code || test.examId}
                        </span>
                        <div className="text-xs text-text-secondary capitalize mt-1">
                          {test.subjectId}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top text-xs text-text-secondary">
                        <span className="font-semibold text-text-primary">
                          {test.questionCount} MCQs
                        </span>
                      </td>
                      <td className="px-6 py-4 align-top text-xs text-text-secondary">
                        {test.durationMinutes} min
                      </td>
                      <td className="px-6 py-4 align-top">
                        <PublishToggleButton
                          testId={test.id}
                          initialStatus={test.status}
                        />
                      </td>
                      <td className="px-6 py-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {test.topicId && (
                            <Link
                              href={`/exams/${test.examId}/topics/${test.topicId}/practice`}
                              target="_blank"
                              title="Take test on student portal"
                            >
                              <Button size="sm" variant="ghost" className="h-8 px-2 text-text-secondary">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Button>
                            </Link>
                          )}
                          <Link href={`/admin/tests/${test.id}/preview`} title="Preview test content">
                            <Button size="sm" variant="ghost" className="h-8 px-2 text-text-secondary">
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              <span className="text-xs">Preview</span>
                            </Button>
                          </Link>
                          <Link href={`/admin/tests/${test.id}/edit`}>
                            <Button size="sm" variant="ghost" className="h-8 px-2 text-text-secondary">
                              <FileEdit className="w-3.5 h-3.5 mr-1" />
                              <span className="text-xs">Edit</span>
                            </Button>
                          </Link>
                          <DeleteConfirmButton
                            itemType="test"
                            onDelete={async () => {
                              "use server";
                              return deleteTestAction(test.id);
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-secondary">
                    No tests found. Click &quot;Create Test&quot; to build a practice test.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
