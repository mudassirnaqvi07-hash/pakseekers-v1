import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireStaff } from "@/server/auth/session";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui";
import { TopicForm } from "@/features/admin/components/topic-form";
import { getAdminAllExams, getAdminAllSubjects } from "@/server/services/content-service";
import { createTopicAction } from "@/server/actions/content-actions";

export const metadata: Metadata = {
  title: "Add Topic | Staff | PakSeekers",
};

export default async function StaffNewTopicPage({
  searchParams,
}: {
  searchParams: Promise<{ examId?: string; subjectId?: string }>;
}) {
  await requireStaff("TOPIC_CREATE");
  const { examId, subjectId } = await searchParams;
  const [exams, subjects] = await Promise.all([
    getAdminAllExams(),
    getAdminAllSubjects(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Add New Topic"
          description="Create a syllabus topic under an academic subject."
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
        defaultExamId={examId}
        defaultSubjectId={subjectId}
        basePath="/staff"
        onSubmit={createTopicAction}
      />
    </div>
  );
}
