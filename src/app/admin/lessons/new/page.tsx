import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/session";
import { getAllTopics } from "@/server/services/content-service";
import { PageHeader } from "@/components/shared/page-header";
import { LessonForm } from "@/features/admin/components/lesson-form";

export const metadata: Metadata = {
  title: "Add New Lesson — PakSeekers Admin",
};

export default async function NewLessonPage() {
  await requireAdmin();
  const topics = await getAllTopics();

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <PageHeader
        title="Create Lesson"
        description="Add a new curriculum lesson with objectives, reading time, and Markdown notes."
      />

      <LessonForm topics={topics} />
    </div>
  );
}
