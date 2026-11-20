import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Button, Badge } from "@/components/ui";
import { ExamForm } from "@/features/admin/components/exam-form";
import { ExamSubjectManager } from "@/features/admin/components/exam-subject-manager";
import {
  getAdminExamById,
  getSubjectsByExamId,
  getAllSubjects,
} from "@/server/services/content-service";
import { countActiveEnrollmentsForExam } from "@/server/repositories/enrollment-repository";
import { updateExamAction } from "@/server/actions/content-actions";

interface EditExamPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: EditExamPageProps): Promise<Metadata> {
  const { id } = await params;
  const exam = await getAdminExamById(id);
  return {
    title: exam ? `Edit ${exam.code} | PakSeekers Admin` : "Exam Not Found",
  };
}

export default async function EditExamPage({ params }: EditExamPageProps) {
  const { id } = await params;
  const [exam, currentSubjects, allAvailableSubjects, activeEnrollments] =
    await Promise.all([
      getAdminExamById(id),
      getSubjectsByExamId(id),
      getAllSubjects(),
      countActiveEnrollmentsForExam(id),
    ]);

  if (!exam) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="info" className="text-xs font-bold uppercase">
              {exam.code}
            </Badge>
            <Badge variant="success" className="inline-flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>{activeEnrollments} Active Student{activeEnrollments === 1 ? "" : "s"}</span>
            </Badge>
          </div>
          <PageHeader
            title={`Edit Exam: ${exam.title}`}
            description={`Manage metadata, status, and associated curriculum subjects for ${exam.code}.`}
          />
        </div>
        <Link href="/admin/exams" className="shrink-0 self-start sm:self-auto">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Exams
          </Button>
        </Link>
      </div>

      {/* Basic Exam Metadata Form */}
      <ExamForm
        initialData={exam}
        isEdit
        onSubmit={async (data) => {
          "use server";
          return updateExamAction(exam.id, data);
        }}
      />

      {/* Many-to-Many Curriculum Subject Associations */}
      <ExamSubjectManager
        exam={exam}
        currentSubjects={currentSubjects}
        allAvailableSubjects={allAvailableSubjects}
      />
    </div>
  );
}
