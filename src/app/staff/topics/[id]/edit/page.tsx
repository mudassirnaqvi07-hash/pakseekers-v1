import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireStaff } from "@/server/auth/session";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui";
import { TopicForm } from "@/features/admin/components/topic-form";
import {
  getAdminTopicById,
  getAdminAllExams,
  getAdminAllSubjects,
} from "@/server/services/content-service";
import { updateTopicAction } from "@/server/actions/content-actions";

export const metadata: Metadata = {
  title: "Edit Topic | Staff | PakSeekers",
};

export default async function StaffEditTopicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff("TOPIC_EDIT");
  const { id } = await params;

  const [topic, exams, subjects] = await Promise.all([
    getAdminTopicById(id),
    getAdminAllExams(),
    getAdminAllSubjects(),
  ]);

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
        <Link href="/staff/topics">
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
        basePath="/staff"
        onSubmit={async (data) => {
          "use server";
          return updateTopicAction(topic.id, data);
        }}
      />
    </div>
  );
}
