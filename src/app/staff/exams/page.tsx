import type { Metadata } from "next";
import Link from "next/link";
import { PlusCircle, FileEdit } from "lucide-react";
import { requireStaff } from "@/server/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/shared";
import { Badge, Button } from "@/components/ui";
import { getAdminAllExams } from "@/server/services/content-service";
import { deleteExamAction } from "@/server/actions/content-actions";
import { DeleteConfirmButton } from "@/features/admin/components/delete-confirm-button";

export const metadata: Metadata = {
  title: "Exams | Staff | PakSeekers",
};

export default async function StaffExamsPage() {
  const user = await requireStaff("EXAM_VIEW");
  const exams = await getAdminAllExams();

  const canCreate = hasPermission(user, "EXAM_CREATE");
  const canEdit = hasPermission(user, "EXAM_EDIT");
  const canDelete = hasPermission(user, "EXAM_DELETE");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Exams Management"
        description="Manage entrance examination tracks and active academic categories."
        actions={
          canCreate ? (
            <Link href="/staff/exams/new">
              <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
                Create New Exam
              </Button>
            </Link>
          ) : undefined
        }
      />

      <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden min-w-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[640px]">
            <thead className="bg-background border-b border-border text-xs font-semibold text-text-secondary uppercase tracking-wider">
              <tr>
                <th className="px-4 sm:px-6 py-3">Code</th>
                <th className="px-4 sm:px-6 py-3">Title & Description</th>
                <th className="px-4 sm:px-6 py-3">Subjects</th>
                <th className="px-4 sm:px-6 py-3">Status</th>
                {(canEdit || canDelete) && <th className="px-4 sm:px-6 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {exams.map((exam) => (
                <tr key={exam.id} className="hover:bg-background/60 transition-colors">
                  <td className="px-4 sm:px-6 py-4">
                    <Badge variant="info" className="font-bold">
                      {exam.code}
                    </Badge>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="font-semibold text-text-primary">{exam.title}</div>
                    <div className="text-xs text-text-secondary line-clamp-1 mt-0.5">
                      {exam.description}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-xs font-medium text-text-primary">
                    {exam.totalSubjects}
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <Badge
                      variant={exam.status === "active" ? "success" : "draft"}
                      dot
                      className="capitalize text-xs"
                    >
                      {exam.status}
                    </Badge>
                  </td>
                  {(canEdit || canDelete) && (
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        {canEdit && (
                          <Link href={`/staff/exams/${exam.id}/edit`}>
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
                            itemId={exam.id}
                            itemTitle={exam.code}
                            itemType="exam"
                            deleteAction={deleteExamAction}
                          />
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
