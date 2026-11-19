import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui";
import { TestBuilderForm } from "@/features/admin/components/test-builder-form";
import {
  getAdminAllExams,
  getAdminAllSubjects,
  getAdminAllTopics,
  getAdminAllQuestions,
} from "@/server/services/content-service";
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
  const [exams, subjects, topics, allQuestions] = await Promise.all([
    getAdminAllExams(),
    getAdminAllSubjects(),
    getAdminAllTopics(),
    getAdminAllQuestions(),
  ]);

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
