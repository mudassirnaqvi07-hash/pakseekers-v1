import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth/session";
import {
  getTestById,
  getAllExams,
  getAllSubjects,
  getAdminAllQuestions,
} from "@/server/services/content-service";
import { PageHeader } from "@/components/shared/page-header";
import { MockTestForm } from "@/features/admin/components/mock-test-form";

export const metadata: Metadata = {
  title: "Edit Mock Test — PakSeekers Admin",
};

interface EditMockTestPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditMockTestPage({ params }: EditMockTestPageProps) {
  await requireAdmin();
  const { id } = await params;

  const [test, exams, subjects, questions] = await Promise.all([
    getTestById(id),
    getAllExams(),
    getAllSubjects(),
    getAdminAllQuestions(),
  ]);

  if (!test) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <PageHeader
        title={`Edit Mock Exam: ${test.title}`}
        description="Update syllabus questions, duration, negative marking scheme, and passing benchmarks."
      />

      <MockTestForm
        test={test}
        exams={exams}
        subjects={subjects}
        questions={questions}
      />
    </div>
  );
}
