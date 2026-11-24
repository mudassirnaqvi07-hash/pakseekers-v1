import type { Metadata } from "next";
import Link from "next/link";
import { PlusCircle, FileEdit, FileCode2, HelpCircle, Search } from "lucide-react";
import { requireStaff } from "@/server/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/shared";
import { Badge, Button, Card } from "@/components/ui";
import {
  getAdminAllQuestions,
  getAdminAllExams,
  getAdminAllTopics,
} from "@/server/services/content-service";
import { deleteQuestionAction } from "@/server/actions/content-actions";
import { DeleteConfirmButton } from "@/features/admin/components/delete-confirm-button";
import type { QuestionDifficulty, QuestionStatus } from "@/types";

export const metadata: Metadata = {
  title: "Question Bank | Staff | PakSeekers",
};

export default async function StaffQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    examId?: string;
    subjectId?: string;
    topicId?: string;
    difficulty?: string;
    status?: string;
    search?: string;
  }>;
}) {
  const user = await requireStaff("QUESTION_VIEW");
  const { examId, subjectId, topicId, difficulty, status, search } = await searchParams;

  const [exams, questions, allTopics] = await Promise.all([
    getAdminAllExams(),
    getAdminAllQuestions({
      examId,
      subjectId,
      topicId,
      difficulty: difficulty as QuestionDifficulty | undefined,
      status: status as QuestionStatus | undefined,
      search,
    }),
    getAdminAllTopics(),
  ]);

  const examMap = new Map(exams.map((e) => [e.id.toLowerCase(), e]));
  const topicMap = new Map(allTopics.map((t) => [t.id.toLowerCase(), t]));

  const canCreate = hasPermission(user, "QUESTION_CREATE");
  const canEdit = hasPermission(user, "QUESTION_EDIT");
  const canDelete = hasPermission(user, "QUESTION_DELETE");
  const canImport = hasPermission(user, "QUESTION_IMPORT");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Question Bank"
        description="Author, review, and organize multiple-choice questions and explanations."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canImport && (
              <Link href="/staff/tests/import">
                <Button variant="outline" size="sm" leftIcon={<FileCode2 className="w-4 h-4" />}>
                  Import JSON
                </Button>
              </Link>
            )}
            {canCreate && (
              <Link href="/staff/questions/new">
                <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
                  Add Question
                </Button>
              </Link>
            )}
          </div>
        }
      />

      <Card className="p-4">
        <form method="GET" className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              name="search"
              placeholder="Search questions..."
              defaultValue={search || ""}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <Button type="submit" size="sm" variant="primary" className="h-9 px-4 text-xs">
            Search
          </Button>
        </form>
      </Card>

      {questions.length === 0 ? (
        <Card className="p-10 text-center flex flex-col items-center gap-3">
          <HelpCircle className="w-8 h-8 text-primary" />
          <p className="text-sm font-semibold text-text-primary">No questions found.</p>
        </Card>
      ) : (
        <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden min-w-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse min-w-[700px]">
              <thead className="bg-background border-b border-border text-xs font-semibold text-text-secondary uppercase tracking-wider">
                <tr>
                  <th className="px-4 sm:px-6 py-3">Question</th>
                  <th className="px-4 sm:px-6 py-3">Curriculum</th>
                  <th className="px-4 sm:px-6 py-3">Difficulty</th>
                  <th className="px-4 sm:px-6 py-3">Status</th>
                  {(canEdit || canDelete) && <th className="px-4 sm:px-6 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {questions.map((q) => {
                  const exam = examMap.get(q.examId.toLowerCase());
                  const topic = topicMap.get(q.topicId.toLowerCase());
                  return (
                    <tr key={q.id} className="hover:bg-background/60 transition-colors">
                      <td className="px-4 sm:px-6 py-4 max-w-md">
                        <p className="font-medium text-text-primary line-clamp-2 text-xs sm:text-sm">
                          {q.questionText}
                        </p>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <Badge variant="info" className="w-fit text-[10px]">
                            {exam?.code || q.examId}
                          </Badge>
                          <span className="text-xs text-text-secondary truncate max-w-[160px]">
                            {topic?.title || q.topicId}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <Badge variant="default" className="capitalize text-xs">
                          {q.difficulty}
                        </Badge>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <Badge
                          variant={q.status === "published" ? "success" : "draft"}
                          dot
                          className="capitalize text-xs"
                        >
                          {q.status}
                        </Badge>
                      </td>
                      {(canEdit || canDelete) && (
                        <td className="px-4 sm:px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            {canEdit && (
                              <Link href={`/staff/questions/${q.id}/edit`}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2.5 text-xs"
                                  leftIcon={<FileEdit className="w-3.5 h-3.5" />}
                                >
                                  Edit
                                </Button>
                              </Link>
                            )}
                            {canDelete && (
                              <DeleteConfirmButton
                                itemId={q.id}
                                itemTitle="question"
                                itemType="question"
                                deleteAction={deleteQuestionAction}
                              />
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
