import type { Metadata } from "next";
import Link from "next/link";
import { Plus, BookOpen, Edit, Eye, Clock } from "lucide-react";
import { requireAdmin } from "@/server/auth/session";
import {
  getAdminAllLessons,
  getAllTopics,
} from "@/server/services/content-service";
import { PageHeader } from "@/components/shared/page-header";
import { Button, Badge, Card, CardContent } from "@/components/ui";
import { DeleteConfirmButton } from "@/features/admin/components/delete-confirm-button";
import {
  deleteLessonAction,
  toggleLessonPublishAction,
} from "@/server/actions/content-actions";

export const metadata: Metadata = {
  title: "Lessons Management — PakSeekers Admin",
  description: "Curriculum lessons, study notes, and conceptual learning materials.",
};

export default async function LessonsPage() {
  await requireAdmin();

  const [lessons, topics] = await Promise.all([
    getAdminAllLessons(),
    getAllTopics(),
  ]);

  const topicMap = new Map(topics.map((t) => [t.id, t]));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Lessons Management"
        description="Create and publish structured lessons, conceptual summaries, and learning objectives."
        actions={
          <Link href="/admin/lessons/new">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4 shrink-0" />}
            >
              Add Lesson
            </Button>
          </Link>
        }
      />

      {lessons.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <BookOpen className="w-6 h-6 shrink-0" />
            </div>
            <h3 className="text-base font-bold text-text-primary">No Lessons Created Yet</h3>
            <p className="text-sm text-text-secondary max-w-sm">
              Add curriculum study notes, formulas, and topic explanations to guide student preparation.
            </p>
            <Link href="/admin/lessons/new" className="mt-2">
              <Button size="sm" variant="primary" leftIcon={<Plus className="w-4 h-4 shrink-0" />}>
                Create First Lesson
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
                  <th className="py-3 px-3 sm:px-4">Title & Summary</th>
                  <th className="py-3 px-3 sm:px-4">Topic</th>
                  <th className="py-3 px-3 sm:px-4">Read Time</th>
                  <th className="py-3 px-3 sm:px-4">Status</th>
                  <th className="py-3 px-3 sm:px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lessons.map((lesson) => {
                  const topic = topicMap.get(lesson.topicId);

                  return (
                    <tr
                      key={lesson.id}
                      className="hover:bg-background/40 transition-colors group"
                    >
                      <td className="py-3 px-3 sm:px-4 font-mono text-xs text-text-secondary">
                        #{lesson.order}
                      </td>
                      <td className="py-3 px-3 sm:px-4 max-w-md">
                        <div className="font-semibold text-text-primary">
                          {lesson.title}
                        </div>
                        {lesson.summary && (
                          <div className="text-xs text-text-secondary line-clamp-1 mt-0.5">
                            {lesson.summary}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                        {topic ? (
                          <span className="text-xs font-medium text-text-primary">
                            {topic.title}
                          </span>
                        ) : (
                          <span className="text-xs text-text-secondary">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 sm:px-4 whitespace-nowrap text-xs text-text-secondary">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          {lesson.estimatedReadMinutes} mins
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                        <form
                          action={async () => {
                            "use server";
                            await toggleLessonPublishAction(lesson.id);
                          }}
                        >
                          <button
                            type="submit"
                            title="Click to toggle publication status"
                            className="cursor-pointer transition-transform active:scale-95"
                          >
                            <Badge
                              variant={lesson.status === "published" ? "success" : "neutral"}
                              className="text-xs capitalize"
                            >
                              {lesson.status}
                            </Badge>
                          </button>
                        </form>
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <Link href={`/admin/lessons/${lesson.id}/preview`}>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-text-secondary hover:text-primary"
                              leftIcon={<Eye className="w-3.5 h-3.5 shrink-0" />}
                            >
                              Preview
                            </Button>
                          </Link>
                          <Link href={`/admin/lessons/${lesson.id}/edit`}>
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
                            itemId={lesson.id}
                            itemType="Lesson"
                            itemTitle={lesson.title}
                            deleteAction={deleteLessonAction}
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
