import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui";
import { QuestionForm } from "@/features/admin/components/question-form";
import {
  getAllExams,
  getAllSubjects,
  getAllTopics,
} from "@/server/repositories/content-repository";
import { createQuestionAction } from "@/server/actions/content-actions";

export const metadata: Metadata = {
  title: "Add Question | PakSeekers Admin",
};

interface AddQuestionPageProps {
  searchParams: Promise<{
    examId?: string;
    subjectId?: string;
    topicId?: string;
  }>;
}

export default async function AddQuestionPage({
  searchParams,
}: AddQuestionPageProps) {
  const { examId, subjectId, topicId } = await searchParams;
  const exams = getAllExams();
  const subjects = getAllSubjects();
  const topics = getAllTopics();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Add Question to Bank"
          description="Author multiple-choice questions with answer choices, verified key, and pedagogical explanations."
        />
        <Link href="/admin/questions">
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
        onSubmit={createQuestionAction}
      />
    </div>
  );
}
