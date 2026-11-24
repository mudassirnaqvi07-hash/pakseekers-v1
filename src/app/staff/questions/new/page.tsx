import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireStaff } from "@/server/auth/session";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui";
import { QuestionForm } from "@/features/admin/components/question-form";
import {
  getAdminAllExams,
  getAdminAllSubjects,
  getAdminAllTopics,
} from "@/server/services/content-service";
import { createQuestionAction } from "@/server/actions/content-actions";

export const metadata: Metadata = {
  title: "Add Question | Staff | PakSeekers",
};

export default async function StaffNewQuestionPage({
  searchParams,
}: {
  searchParams: Promise<{ examId?: string; subjectId?: string; topicId?: string }>;
}) {
  await requireStaff("QUESTION_CREATE");
  const { examId, subjectId, topicId } = await searchParams;
  const [exams, subjects, topics] = await Promise.all([
    getAdminAllExams(),
    getAdminAllSubjects(),
    getAdminAllTopics(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Add New Question"
          description="Author a multiple-choice question with verified answer key and explanation."
        />
        <Link href="/staff/questions">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Question Bank
          </Button>
        </Link>
      </div>

      <QuestionForm
        exams={exams}
        subjects={subjects}
        topics={topics}
        defaultExamId={examId}
        defaultSubjectId={subjectId}
        defaultTopicId={topicId}
        basePath="/staff"
        onSubmit={createQuestionAction}
      />
    </div>
  );
}
