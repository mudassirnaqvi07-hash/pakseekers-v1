import type { Metadata } from "next";
import Link from "next/link";
import { PlusCircle, FileEdit } from "lucide-react";
import { requireStaff } from "@/server/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/shared";
import { Badge, Button } from "@/components/ui";
import {
  getAdminAllExams,
  getAdminAllSubjects,
  getAdminAllTopics,
} from "@/server/services/content-service";
import { deleteTopicAction } from "@/server/actions/content-actions";
import { DeleteConfirmButton } from "@/features/admin/components/delete-confirm-button";

export const metadata: Metadata = {
  title: "Topics | Staff | PakSeekers",
};

export default async function StaffTopicsPage({
  searchParams,
}: {
  searchParams: Promise<{ examId?: string; subjectId?: string }>;
}) {
  const user = await requireStaff("TOPIC_VIEW");
  const { examId, subjectId } = await searchParams;
  const [exams, subjects, topics] = await Promise.all([
    getAdminAllExams(),
    getAdminAllSubjects(),
    getAdminAllTopics(subjectId, examId),
  ]);

  const examMap = new Map(exams.map((e) => [e.id.toLowerCase(), e]));
  const subjectMap = new Map(subjects.map((s) => [s.id.toLowerCase(), s]));

  const canCreate = hasPermission(user, "TOPIC_CREATE");
  const canEdit = hasPermission(user, "TOPIC_EDIT");
  const canDelete = hasPermission(user, "TOPIC_DELETE");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Topics Management"
        description="Manage syllabus chapters and topics across academic subjects."
        actions={
          canCreate ? (
            <Link href="/staff/topics/new">
              <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
                Add New Topic
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
                <th className="px-4 sm:px-6 py-3">Topic</th>
                <th className="px-4 sm:px-6 py-3">Subject / Exam</th>
                <th className="px-4 sm:px-6 py-3">Questions</th>
                <th className="px-4 sm:px-6 py-3">Status</th>
                {(canEdit || canDelete) && <th className="px-4 sm:px-6 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {topics.map((topic) => {
                const exam = examMap.get(topic.examId.toLowerCase());
                const subj = subjectMap.get(topic.subjectId.toLowerCase());
                return (
                  <tr key={topic.id} className="hover:bg-background/60 transition-colors">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="font-semibold text-text-primary">{topic.title}</div>
                      <div className="text-xs text-text-secondary line-clamp-1 mt-0.5">
                        {topic.description}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="info" className="text-[11px]">
                          {exam?.code || topic.examId}
                        </Badge>
                        <span className="text-xs text-text-secondary">
                          {subj?.title || topic.subjectId}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-xs font-medium text-text-primary">
                      {topic.questionCount}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <Badge
                        variant={topic.status === "active" ? "success" : "draft"}
                        dot
                        className="capitalize text-xs"
                      >
                        {topic.status}
                      </Badge>
                    </td>
                    {(canEdit || canDelete) && (
                      <td className="px-4 sm:px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {canEdit && (
                            <Link href={`/staff/topics/${topic.id}/edit`}>
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
                              itemId={topic.id}
                              itemTitle={topic.title}
                              itemType="topic"
                              deleteAction={deleteTopicAction}
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
