import type { Metadata } from "next";
import Link from "next/link";
import { PlusCircle, FileEdit, BookOpen, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Badge, Button } from "@/components/ui";
import {
  getAllSubjects,
  getAllExams,
  getExamById,
} from "@/server/repositories/content-repository";
import { deleteSubjectAction } from "@/server/actions/content-actions";
import { DeleteConfirmButton } from "@/features/admin/components/delete-confirm-button";

export const metadata: Metadata = {
  title: "Subjects Management | PakSeekers Admin",
};

interface AdminSubjectsPageProps {
  searchParams: Promise<{ examId?: string }>;
}

export default async function AdminSubjectsPage({
  searchParams,
}: AdminSubjectsPageProps) {
  const { examId } = await searchParams;
  const exams = getAllExams();
  const subjects = getAllSubjects(examId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Subjects Management"
          description="Manage academic subject disciplines belonging to entrance examination tracks."
        />
        <Link href={examId ? `/admin/subjects/new?examId=${examId}` : "/admin/subjects/new"}>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            Create Subject
          </Button>
        </Link>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Link href="/admin/subjects">
          <Button
            size="sm"
            variant={!examId ? "primary" : "outline"}
            className="text-xs h-8"
          >
            All Exams ({getAllSubjects().length})
          </Button>
        </Link>
        {exams.map((e) => {
          const isSelected = examId?.toLowerCase() === e.id.toLowerCase();
          const count = getAllSubjects(e.id).length;
          return (
            <Link key={e.id} href={`/admin/subjects?examId=${e.id}`}>
              <Button
                size="sm"
                variant={isSelected ? "primary" : "outline"}
                className="text-xs h-8"
              >
                {e.code} ({count})
              </Button>
            </Link>
          );
        })}
      </div>

      {/* Subjects Table */}
      <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-background border-b border-border text-xs font-semibold text-text-secondary uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Subject</th>
                <th className="px-6 py-3.5">Parent Exam</th>
                <th className="px-6 py-3.5">Topics</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {subjects.length > 0 ? (
                subjects.map((subject) => {
                  const parentExam = getExamById(subject.examId);
                  return (
                    <tr key={subject.id} className="hover:bg-background/50 transition-colors">
                      <td className="px-6 py-4 align-top max-w-sm">
                        <div className="font-semibold text-text-primary">
                          {subject.title}
                        </div>
                        <p className="text-xs text-text-secondary line-clamp-2 mt-1">
                          {subject.description}
                        </p>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-xs uppercase">
                          {parentExam?.code || subject.examId}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-top text-text-secondary">
                        <Link
                          href={`/admin/topics?subjectId=${subject.id}&examId=${subject.examId}`}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-text-primary hover:text-primary"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-secondary" />
                          <span>{subject.totalTopics} Topics</span>
                        </Link>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <Badge
                          variant={subject.status === "active" ? "success" : "draft"}
                          dot
                          className="capitalize text-xs"
                        >
                          {subject.status || "active"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/exams/${subject.examId}/subjects/${subject.id}`}
                            target="_blank"
                            title="View student portal page"
                          >
                            <Button size="sm" variant="ghost" className="h-8 px-2 text-text-secondary">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                          <Link href={`/admin/subjects/${subject.id}/edit`}>
                            <Button size="sm" variant="ghost" className="h-8 px-2 text-text-secondary">
                              <FileEdit className="w-3.5 h-3.5 mr-1" />
                              <span className="text-xs">Edit</span>
                            </Button>
                          </Link>
                          <DeleteConfirmButton
                            itemType="subject"
                            onDelete={async () => {
                              "use server";
                              return deleteSubjectAction(subject.id);
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-secondary">
                    No subjects found for this selection. Click &quot;Create Subject&quot; to add one.
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
