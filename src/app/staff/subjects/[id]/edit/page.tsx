import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireStaff } from "@/server/auth/session";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui";
import { SubjectForm } from "@/features/admin/components/subject-form";
import { getAdminSubjectById, getAdminAllExams } from "@/server/services/content-service";
import { updateSubjectAction } from "@/server/actions/content-actions";

export const metadata: Metadata = {
  title: "Edit Subject | Staff | PakSeekers",
};

export default async function StaffEditSubjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff("SUBJECT_EDIT");
  const { id } = await params;

  const [subject, exams] = await Promise.all([
    getAdminSubjectById(id),
    getAdminAllExams(),
  ]);

  if (!subject) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title={`Edit Subject: ${subject.title}`}
          description="Update syllabus details, parent exam assignment, or visibility."
        />
        <Link href="/staff/subjects">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Subjects
          </Button>
        </Link>
      </div>

      <SubjectForm
        exams={exams}
        initialData={subject}
        isEdit
        basePath="/staff"
        onSubmit={async (data) => {
          "use server";
          return updateSubjectAction(subject.id, data);
        }}
      />
    </div>
  );
}
