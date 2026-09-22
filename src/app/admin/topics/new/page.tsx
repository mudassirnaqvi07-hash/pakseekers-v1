import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui";
import { TopicForm } from "@/features/admin/components/topic-form";
import {
  getAllExams,
  getAllSubjects,
} from "@/server/repositories/content-repository";
import { createTopicAction } from "@/server/actions/content-actions";

export const metadata: Metadata = {
  title: "Create Topic | PakSeekers Admin",
};

interface CreateTopicPageProps {
  searchParams: Promise<{ examId?: string; subjectId?: string }>;
}

export default async function CreateTopicPage({
  searchParams,
}: CreateTopicPageProps) {
  const { examId, subjectId } = await searchParams;
  const exams = getAllExams();
  const subjects = getAllSubjects();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Create Syllabus Topic"
          description="Group individual practice questions under an academic discipline."
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
        defaultExamId={examId}
        defaultSubjectId={subjectId}
        onSubmit={createTopicAction}
      />
    </div>
  );
}
