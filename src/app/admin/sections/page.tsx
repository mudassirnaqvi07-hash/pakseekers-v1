import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Layers, Edit } from "lucide-react";
import { requireAdmin } from "@/server/auth/session";
import {
  getAdminAllSections,
  getAllExams,
  getAllSubjects,
} from "@/server/services/content-service";
import { PageHeader } from "@/components/shared/page-header";
import { Button, Badge, Card, CardContent } from "@/components/ui";
import { DeleteConfirmButton } from "@/features/admin/components/delete-confirm-button";
import { deleteSectionAction } from "@/server/actions/content-actions";

export const metadata: Metadata = {
  title: "Sections Management — PakSeekers Admin",
  description: "Curriculum and test section structure management.",
};

export default async function SectionsPage() {
  await requireAdmin();

  const [sections, exams, subjects] = await Promise.all([
    getAdminAllSections(),
    getAllExams(),
    getAllSubjects(),
  ]);

  const examMap = new Map(exams.map((e) => [e.id, e]));
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sections Management"
        description="Organize exams and subjects into structured curriculum sections for focused delivery."
        actions={
          <Link href="/admin/sections/new">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4 shrink-0" />}
            >
              Add Section
            </Button>
          </Link>
        }
      />

      {sections.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Layers className="w-6 h-6 shrink-0" />
            </div>
            <h3 className="text-base font-bold text-text-primary">No Sections Created Yet</h3>
            <p className="text-sm text-text-secondary max-w-sm">
              Create curriculum sections to organize topics, questions, and tests into structured test modules.
            </p>
            <Link href="/admin/sections/new" className="mt-2">
              <Button size="sm" variant="primary" leftIcon={<Plus className="w-4 h-4 shrink-0" />}>
                Create First Section
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card noPadding className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-background/50 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  <th className="py-3 px-3 sm:px-4">Order</th>
                  <th className="py-3 px-3 sm:px-4">Section Title</th>
                  <th className="py-3 px-3 sm:px-4">Exam</th>
                  <th className="py-3 px-3 sm:px-4">Subject</th>
                  <th className="py-3 px-3 sm:px-4">Duration</th>
                  <th className="py-3 px-3 sm:px-4">Total Marks</th>
                  <th className="py-3 px-3 sm:px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sections.map((section) => {
                  const exam = examMap.get(section.examId);
                  const subject = section.subjectId ? subjectMap.get(section.subjectId) : null;

                  return (
                    <tr
                      key={section.id}
                      className="hover:bg-background/40 transition-colors group"
                    >
                      <td className="py-3 px-3 sm:px-4 font-mono text-xs text-text-secondary">
                        #{section.order}
                      </td>
                      <td className="py-3 px-3 sm:px-4">
                        <div className="font-semibold text-text-primary">
                          {section.title}
                        </div>
                        {section.description && (
                          <div className="text-xs text-text-secondary line-clamp-1 mt-0.5">
                            {section.description}
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
                      <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                        {subject ? (
                          <span className="text-xs font-medium text-text-primary">
                            {subject.title}
                          </span>
                        ) : (
                          <span className="text-xs text-text-secondary">General (All Subjects)</span>
                        )}
                      </td>
                      <td className="py-3 px-3 sm:px-4 whitespace-nowrap text-xs text-text-secondary">
                        {section.durationMinutes ? `${section.durationMinutes} mins` : "Untimed"}
                      </td>
                      <td className="py-3 px-3 sm:px-4 whitespace-nowrap text-xs font-medium text-text-primary">
                        {section.totalMarks ?? "—"}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <Link href={`/admin/sections/${section.id}/edit`}>
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
                            itemId={section.id}
                            itemType="Section"
                            itemTitle={section.title}
                            deleteAction={deleteSectionAction}
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
