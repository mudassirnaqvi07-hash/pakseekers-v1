import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui";
import { TestBuilderForm } from "@/features/admin/components/test-builder-form";
import {
  getAllExams,
  getAllSubjects,
  getAllTopics,
  getAllQuestions,
} from "@/server/repositories/content-repository";
import { createTestAction } from "@/server/actions/content-actions";

export const metadata: Metadata = {
  title: "Create Test | PakSeekers Admin",
};

interface CreateTestPageProps {
  searchParams: Promise<{
    examId?: string;
    subjectId?: string;
    topicId?: string;
  }>;
}

export default async function CreateTestPage({
  searchParams,
}: CreateTestPageProps) {
  const { examId, subjectId, topicId } = await searchParams;
  const exams = getAllExams();
  const subjects = getAllSubjects();
  const topics = getAllTopics();
  const allQuestions = getAllQuestions();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Create Practice Test"
          description="Define test parameters and select questions directly from the question bank."
        />
        <Link href="/admin/tests">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Tests
          </Button>
        </Link>
      </div>

      <TestBuilderForm
        exams={exams}
        subjects={subjects}
        topics={topics}
        allQuestions={allQuestions}
        defaultExamId={examId}
        defaultSubjectId={subjectId}
        defaultTopicId={topicId}
        onSubmit={createTestAction}
      />
    </div>
  );
}
