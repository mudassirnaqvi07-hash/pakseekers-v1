import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/session";
import {
  getAllExams,
  getAllSubjects,
  getAdminAllQuestions,
} from "@/server/services/content-service";
import { PageHeader } from "@/components/shared/page-header";
import { MockTestForm } from "@/features/admin/components/mock-test-form";

export const metadata: Metadata = {
  title: "Assemble Mock Test — PakSeekers Admin",
};

export default async function NewMockTestPage() {
  await requireAdmin();

  const [exams, subjects, questions] = await Promise.all([
    getAllExams(),
    getAllSubjects(),
    getAdminAllQuestions(),
  ]);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <PageHeader
        title="Assemble Mock Exam"
        description="Configure duration, passing thresholds, negative marking rules, and select syllabus questions."
      />

      <MockTestForm
        exams={exams}
        subjects={subjects}
        questions={questions}
      />
    </div>
  );
}
