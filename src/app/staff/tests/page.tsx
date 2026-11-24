import type { Metadata } from "next";
import Link from "next/link";
import { PlusCircle, FileEdit, Eye, FileCode2 } from "lucide-react";
import { requireStaff } from "@/server/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/shared";
import { Badge, Button } from "@/components/ui";
import { getAdminAllTests, getAdminAllExams } from "@/server/services/content-service";
import { deleteTestAction } from "@/server/actions/content-actions";
import { DeleteConfirmButton } from "@/features/admin/components/delete-confirm-button";
import { PublishToggleButton } from "@/features/admin/components/publish-toggle-button";
import type { TestStatus } from "@/types";

export const metadata: Metadata = {
  title: "Tests | Staff | PakSeekers",
};

export default async function StaffTestsPage({
  searchParams,
}: {
  searchParams: Promise<{ examId?: string; subjectId?: string; status?: string }>;
}) {
  const user = await requireStaff("TEST_VIEW");
  const { examId, subjectId, status } = await searchParams;

  const [exams, tests] = await Promise.all([
    getAdminAllExams(),
    getAdminAllTests({
      examId,
      subjectId,
      status: status as TestStatus | undefined,
    }),
  ]);
  const examMap = new Map(exams.map((e) => [e.id.toLowerCase(), e]));

  const canCreate = hasPermission(user, "TEST_CREATE");
  const canEdit = hasPermission(user, "TEST_EDIT");
  const canDelete = hasPermission(user, "TEST_DELETE");
  const canPublish = hasPermission(user, "TEST_PUBLISH");
  const canImport = hasPermission(user, "QUESTION_IMPORT");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tests Management"
        description="Build, edit, and preview diagnostic tests. Publishing and deletion require explicit permission."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canImport && (
              <Link href="/staff/tests/import">
                <Button variant="outline" size="sm" leftIcon={<FileCode2 className="w-4 h-4" />}>
                  Import from JSON
                </Button>
              </Link>
            )}
            {canCreate && (
              <Link href="/staff/tests/new">
                <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
                  Create Test
                </Button>
              </Link>
            )}
          </div>
        }
      />

      <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden min-w-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[700px]">
            <thead className="bg-background border-b border-border text-xs font-semibold text-text-secondary uppercase tracking-wider">
              <tr>
                <th className="px-4 sm:px-6 py-3">Test Title</th>
                <th className="px-4 sm:px-6 py-3">Exam</th>
                <th className="px-4 sm:px-6 py-3">Questions / Time</th>
                <th className="px-4 sm:px-6 py-3">Status</th>
                <th className="px-4 sm:px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tests.map((test) => {
                const exam = examMap.get(test.examId.toLowerCase());
                return (
                  <tr key={test.id} className="hover:bg-background/60 transition-colors">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="font-semibold text-text-primary">{test.title}</div>
                      <div className="text-xs text-text-secondary line-clamp-1 mt-0.5">
                        {test.description}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <Badge variant="info" className="text-xs">
                        {exam?.code || test.examId.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-xs text-text-secondary">
                      <strong>{test.questionCount}</strong> MCQs • {test.durationMinutes} min
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      {canPublish ? (
                        <PublishToggleButton testId={test.id} initialStatus={test.status} />
                      ) : (
                        <Badge
                          variant={test.status === "published" ? "success" : "draft"}
                          dot
                          className="capitalize text-xs"
                        >
                          {test.status}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link href={`/staff/tests/${test.id}/preview`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2.5 text-xs"
                            leftIcon={<Eye className="w-3.5 h-3.5" />}
                          >
                            Preview
                          </Button>
                        </Link>
                        {canEdit && (
                          <Link href={`/staff/tests/${test.id}/edit`}>
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
                            itemId={test.id}
                            itemTitle={test.title}
                            itemType="test"
                            deleteAction={deleteTestAction}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
