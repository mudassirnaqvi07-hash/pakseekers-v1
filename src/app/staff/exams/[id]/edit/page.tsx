import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireStaff } from "@/server/auth/session";
import { PageHeader } from "@/components/shared";
import { Button, Badge } from "@/components/ui";
import { ExamForm } from "@/features/admin/components/exam-form";
import { ExamSubjectManager } from "@/features/admin/components/exam-subject-manager";
import {
  getAdminExamById,
  getSubjectsByExamId,
  getAllSubjects,
} from "@/server/services/content-service";
import { updateExamAction } from "@/server/actions/content-actions";

export const metadata: Metadata = {
  title: "Edit Exam | Staff | PakSeekers",
};

export default async function StaffEditExamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff("EXAM_EDIT");
  const { id } = await params;

  const [exam, currentSubjects, allAvailableSubjects] = await Promise.all([
    getAdminExamById(id),
    getSubjectsByExamId(id),
    getAllSubjects(),
  ]);

  if (!exam) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="info" className="text-xs font-bold uppercase mb-1">
            {exam.code}
          </Badge>
          <PageHeader
            title={`Edit Exam: ${exam.title}`}
            description={`Manage metadata, status, and curriculum subjects for ${exam.code}.`}
          />
        </div>
        <Link href="/staff/exams">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Exams
          </Button>
        </Link>
      </div>

      <ExamForm
        initialData={exam}
        isEdit
        basePath="/staff"
        onSubmit={async (data) => {
          "use server";
          return updateExamAction(exam.id, data);
        }}
      />

      <ExamSubjectManager
        exam={exam}
        currentSubjects={currentSubjects}
        allAvailableSubjects={allAvailableSubjects}
      />
    </div>
  );
}
