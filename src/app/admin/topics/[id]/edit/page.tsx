import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui";
import { TopicForm } from "@/features/admin/components/topic-form";
import {
  getTopicById,
  getAllExams,
  getAllSubjects,
} from "@/server/repositories/content-repository";
import { updateTopicAction } from "@/server/actions/content-actions";

interface EditTopicPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: EditTopicPageProps): Promise<Metadata> {
  const { id } = await params;
  const topic = getTopicById(id);
  return {
    title: topic ? `Edit ${topic.title} | PakSeekers Admin` : "Topic Not Found",
  };
}

export default async function EditTopicPage({ params }: EditTopicPageProps) {
  const { id } = await params;
  const topic = getTopicById(id);
  const exams = getAllExams();
  const subjects = getAllSubjects();

  if (!topic) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title={`Edit Topic: ${topic.title}`}
          description="Update topic scope, parent discipline, or visibility status."
        />
        <Link href="/admin/topics">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Topics
          </Button>
        </Link>
      </div>

      <TopicForm
        exams={exams}
        subjects={subjects}
        initialData={topic}
        isEdit
        onSubmit={async (data) => {
          "use server";
          return updateTopicAction(topic.id, data);
        }}
      />
    </div>
  );
}
