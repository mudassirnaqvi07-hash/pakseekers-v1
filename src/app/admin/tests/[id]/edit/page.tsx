import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui";
import { TestBuilderForm } from "@/features/admin/components/test-builder-form";
import {
  getTestById,
  getAllExams,
  getAllSubjects,
  getAllTopics,
  getAllQuestions,
} from "@/server/repositories/content-repository";
import { updateTestAction } from "@/server/actions/content-actions";

interface EditTestPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: EditTestPageProps): Promise<Metadata> {
  const { id } = await params;
  const test = getTestById(id);
  return {
    title: test ? `Edit ${test.title} | PakSeekers Admin` : "Test Not Found",
  };
}

export default async function EditTestPage({ params }: EditTestPageProps) {
  const { id } = await params;
  const test = getTestById(id);
  const exams = getAllExams();
  const subjects = getAllSubjects();
  const topics = getAllTopics();
  const allQuestions = getAllQuestions();

  if (!test) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title={`Edit Test: ${test.title}`}
          description="Update test questions, duration, curriculum scope, or status."
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
        initialData={test}
        isEdit
        onSubmit={async (data) => {
          "use server";
          return updateTestAction(test.id, data);
        }}
      />
    </div>
  );
}
