import type { Metadata } from "next";
import Link from "next/link";
import { PlusCircle, FileEdit, Layers, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Badge, Button } from "@/components/ui";
import { getAdminAllExams } from "@/server/services/content-service";
import { deleteExamAction } from "@/server/actions/content-actions";
import { DeleteConfirmButton } from "@/features/admin/components/delete-confirm-button";

export const metadata: Metadata = {
  title: "Exams Management | PakSeekers Admin",
};

export default async function AdminExamsPage() {
  const exams = await getAdminAllExams();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Exams Management"
        description="Manage entrance test categories, conduct bodies, and active academic tracks."
        actions={
          <Link href="/admin/exams/new">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Create New Exam
            </Button>
          </Link>
        }
      />

      {/* Exams Table */}
      <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden min-w-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[640px]">
            <thead className="bg-background border-b border-border text-xs font-semibold text-text-secondary uppercase tracking-wider">
              <tr>
                <th className="px-4 sm:px-6 py-3 sm:py-3.5">Code</th>
                <th className="px-4 sm:px-6 py-3 sm:py-3.5">Title & Description</th>
                <th className="px-4 sm:px-6 py-3 sm:py-3.5">Subjects</th>
                <th className="px-4 sm:px-6 py-3 sm:py-3.5">Status</th>
                <th className="px-4 sm:px-6 py-3 sm:py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {exams.length > 0 ? (
                exams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-background/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-primary align-top">
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-xs">
                        {exam.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-top max-w-md">
                      <div className="font-semibold text-text-primary">
                        {exam.title}
                      </div>
                      <p className="text-xs text-text-secondary line-clamp-2 mt-1">
                        {exam.description}
                      </p>
                    </td>
                    <td className="px-6 py-4 align-top text-text-secondary">
                      <Link
                        href={`/admin/subjects?examId=${exam.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-text-primary hover:text-primary"
                      >
                        <Layers className="w-3.5 h-3.5 text-primary" />
                        <span>{exam.totalSubjects} Subjects</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <Badge
                        variant={
                          exam.status === "active"
                            ? "success"
                            : exam.status === "draft"
                            ? "draft"
                            : "archived"
                        }
                        dot
                        className="capitalize text-xs"
                      >
                        {exam.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 align-top text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/exams/${exam.id}`} target="_blank" title="View student portal page">
                          <Button size="sm" variant="ghost" className="h-8 px-2 text-text-secondary">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                        <Link href={`/admin/exams/${exam.id}/edit`}>
                          <Button size="sm" variant="ghost" className="h-8 px-2 text-text-secondary">
                            <FileEdit className="w-3.5 h-3.5 mr-1" />
                            <span className="text-xs">Edit</span>
                          </Button>
                        </Link>
                        <DeleteConfirmButton
                          itemType="exam"
                          onDelete={async () => {
                            "use server";
                            return deleteExamAction(exam.id);
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-secondary">
                    No exams configured yet. Click &quot;Create New Exam&quot; to add one.
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
