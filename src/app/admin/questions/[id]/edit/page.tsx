import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui";
import { QuestionForm } from "@/features/admin/components/question-form";
import {
  getAdminQuestionById,
  getAdminAllExams,
  getAdminAllSubjects,
  getAdminAllTopics,
} from "@/server/services/content-service";
import { updateQuestionAction } from "@/server/actions/content-actions";

interface EditQuestionPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: EditQuestionPageProps): Promise<Metadata> {
  const { id } = await params;
  const question = await getAdminQuestionById(id);
  return {
    title: question ? "Edit Question | PakSeekers Admin" : "Question Not Found",
  };
}

export default async function EditQuestionPage({
  params,
}: EditQuestionPageProps) {
  const { id } = await params;
  const [question, exams, subjects, topics] = await Promise.all([
    getAdminQuestionById(id),
    getAdminAllExams(),
    getAdminAllSubjects(),
    getAdminAllTopics(),
  ]);

  if (!question) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Edit Question"
          description="Update question statement, distractors, correct key, or explanation."
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
        initialData={question}
        isEdit
        onSubmit={async (data) => {
          "use server";
          return updateQuestionAction(question.id, data);
        }}
      />
    </div>
  );
}
