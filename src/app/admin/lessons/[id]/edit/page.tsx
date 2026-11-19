import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth/session";
import {
  getLessonById,
  getAllTopics,
} from "@/server/services/content-service";
import { PageHeader } from "@/components/shared/page-header";
import { LessonForm } from "@/features/admin/components/lesson-form";

export const metadata: Metadata = {
  title: "Edit Lesson — PakSeekers Admin",
};

interface EditLessonPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditLessonPage({ params }: EditLessonPageProps) {
  await requireAdmin();
  const { id } = await params;

  const [lesson, topics] = await Promise.all([
    getLessonById(id),
    getAllTopics(),
  ]);

  if (!lesson) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <PageHeader
        title={`Edit Lesson: ${lesson.title}`}
        description="Update lesson objectives, Markdown text, order, and publishing status."
      />

      <LessonForm lesson={lesson} topics={topics} />
    </div>
  );
}
