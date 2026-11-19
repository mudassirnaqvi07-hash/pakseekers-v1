import type { Metadata } from "next";
import Link from "next/link";
import { PlusCircle, FileEdit, HelpCircle, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Badge, Button } from "@/components/ui";
import {
  getAdminAllTopics,
  getAdminAllExams,
  getAdminAllSubjects,
} from "@/server/services/content-service";
import { deleteTopicAction } from "@/server/actions/content-actions";
import { DeleteConfirmButton } from "@/features/admin/components/delete-confirm-button";

export const metadata: Metadata = {
  title: "Topics Management | PakSeekers Admin",
};

interface AdminTopicsPageProps {
  searchParams: Promise<{ examId?: string; subjectId?: string }>;
}

export default async function AdminTopicsPage({
  searchParams,
}: AdminTopicsPageProps) {
  const { examId, subjectId } = await searchParams;
  const [exams, allSubjects, topics] = await Promise.all([
    getAdminAllExams(),
    getAdminAllSubjects(),
    getAdminAllTopics(subjectId, examId),
  ]);

  const subjectMap = new Map(allSubjects.map((s) => [s.id.toLowerCase(), s]));
  const examMap = new Map(exams.map((e) => [e.id.toLowerCase(), e]));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Topics Management"
        description="Manage granular syllabus topics that group multiple-choice questions into practice modules."
        actions={
          <Link
            href={
              subjectId
                ? `/admin/topics/new?subjectId=${subjectId}&examId=${examId || ""}`
                : "/admin/topics/new"
            }
          >
            <Button
              variant="primary"
              size="sm"
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Create Topic
            </Button>
          </Link>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-surface border border-border rounded-xl">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider mr-1">
          Filter by Exam:
        </span>
        <Link href="/admin/topics">
          <Button
            size="sm"
            variant={!examId ? "primary" : "outline"}
            className="text-xs h-7 px-2.5"
          >
            All Exams
          </Button>
        </Link>
        {exams.map((e) => {
          const isSelected = examId?.toLowerCase() === e.id.toLowerCase();
          return (
            <Link key={e.id} href={`/admin/topics?examId=${e.id}`}>
              <Button
                size="sm"
                variant={isSelected ? "primary" : "outline"}
                className="text-xs h-7 px-2.5"
              >
                {e.code}
              </Button>
            </Link>
          );
        })}
      </div>

      {/* Topics Table */}
      <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden min-w-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[640px]">
            <thead className="bg-background border-b border-border text-xs font-semibold text-text-secondary uppercase tracking-wider">
              <tr>
                <th className="px-4 sm:px-6 py-3 sm:py-3.5">Topic</th>
                <th className="px-4 sm:px-6 py-3 sm:py-3.5">Subject & Exam</th>
                <th className="px-4 sm:px-6 py-3 sm:py-3.5">Question Bank</th>
                <th className="px-4 sm:px-6 py-3 sm:py-3.5">Status</th>
                <th className="px-4 sm:px-6 py-3 sm:py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {topics.length > 0 ? (
                topics.map((topic) => {
                  const subject = subjectMap.get(topic.subjectId.toLowerCase());
                  const exam = examMap.get(topic.examId.toLowerCase());

                  return (
                    <tr key={topic.id} className="hover:bg-background/50 transition-colors">
                      <td className="px-6 py-4 align-top max-w-sm">
                        <div className="font-semibold text-text-primary">
                          {topic.title}
                        </div>
                        <p className="text-xs text-text-secondary line-clamp-2 mt-1">
                          {topic.description}
                        </p>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="text-xs font-medium text-text-primary">
                          {subject?.title || topic.subjectId}
                        </div>
                        <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold text-[10px] uppercase mt-1 inline-block">
                          {exam?.code || topic.examId}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <Link
                          href={`/admin/questions?topicId=${topic.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>{topic.questionCount} Questions</span>
                        </Link>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <Badge
                          variant={topic.status === "active" ? "success" : "draft"}
                          dot
                          className="capitalize text-xs"
                        >
                          {topic.status || "active"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/exams/${topic.examId}/topics/${topic.id}`}
                            target="_blank"
                            title="View student topic overview"
                          >
                            <Button size="sm" variant="ghost" className="h-8 px-2 text-text-secondary">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                          <Link href={`/admin/topics/${topic.id}/edit`}>
                            <Button size="sm" variant="ghost" className="h-8 px-2 text-text-secondary">
                              <FileEdit className="w-3.5 h-3.5 mr-1" />
                              <span className="text-xs">Edit</span>
                            </Button>
                          </Link>
                          <DeleteConfirmButton
                            itemType="topic"
                            onDelete={async () => {
                              "use server";
                              return deleteTopicAction(topic.id);
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
                    No topics found. Click &quot;Create Topic&quot; to add one.
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
