import type { Metadata } from "next";
import Link from "next/link";
import { PlusCircle, FileEdit } from "lucide-react";
import { requireStaff } from "@/server/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/shared";
import { Badge, Button } from "@/components/ui";
import { getAdminAllExams, getAdminAllSubjects } from "@/server/services/content-service";
import { deleteSubjectAction } from "@/server/actions/content-actions";
import { DeleteConfirmButton } from "@/features/admin/components/delete-confirm-button";

export const metadata: Metadata = {
  title: "Subjects | Staff | PakSeekers",
};

export default async function StaffSubjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ examId?: string }>;
}) {
  const user = await requireStaff("SUBJECT_VIEW");
  const { examId } = await searchParams;
  const [exams, subjects] = await Promise.all([
    getAdminAllExams(),
    getAdminAllSubjects(examId),
  ]);
  const examMap = new Map(exams.map((e) => [e.id.toLowerCase(), e]));

  const canCreate = hasPermission(user, "SUBJECT_CREATE");
  const canEdit = hasPermission(user, "SUBJECT_EDIT");
  const canDelete = hasPermission(user, "SUBJECT_DELETE");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Subjects Management"
        description="Organize academic subjects linked to standardized entrance examinations."
        actions={
          canCreate ? (
            <Link href={examId ? `/staff/subjects/new?examId=${examId}` : "/staff/subjects/new"}>
              <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
                Add New Subject
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
                <th className="px-4 sm:px-6 py-3">Subject</th>
                <th className="px-4 sm:px-6 py-3">Exam</th>
                <th className="px-4 sm:px-6 py-3">Topics</th>
                <th className="px-4 sm:px-6 py-3">Status</th>
                {(canEdit || canDelete) && <th className="px-4 sm:px-6 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {subjects.map((subj) => {
                const exam = examMap.get(subj.examId.toLowerCase());
                return (
                  <tr key={subj.id} className="hover:bg-background/60 transition-colors">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="font-semibold text-text-primary">{subj.title}</div>
                      <div className="text-xs text-text-secondary line-clamp-1 mt-0.5">
                        {subj.description}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <Badge variant="info">{exam?.code || subj.examId.toUpperCase()}</Badge>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-xs font-medium text-text-primary">
                      {subj.totalTopics}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <Badge
                        variant={subj.status === "active" ? "success" : "draft"}
                        dot
                        className="capitalize text-xs"
                      >
                        {subj.status}
                      </Badge>
                    </td>
                    {(canEdit || canDelete) && (
                      <td className="px-4 sm:px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {canEdit && (
                            <Link href={`/staff/subjects/${subj.id}/edit`}>
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
                              itemId={subj.id}
                              itemTitle={subj.title}
                              itemType="subject"
                              deleteAction={deleteSubjectAction}
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
    </div>
  );
}
