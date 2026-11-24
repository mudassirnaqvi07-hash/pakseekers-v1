import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireStaff } from "@/server/auth/session";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui";
import { SubjectForm } from "@/features/admin/components/subject-form";
import { getAdminAllExams } from "@/server/services/content-service";
import { createSubjectAction } from "@/server/actions/content-actions";

export const metadata: Metadata = {
  title: "Add Subject | Staff | PakSeekers",
};

export default async function StaffNewSubjectPage({
  searchParams,
}: {
  searchParams: Promise<{ examId?: string }>;
}) {
  await requireStaff("SUBJECT_CREATE");
  const { examId } = await searchParams;
  const exams = await getAdminAllExams();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Add New Subject"
          description="Create an academic subject linked to an examination track."
        />
        <Link href="/staff/subjects">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Subjects
          </Button>
        </Link>
      </div>

      <SubjectForm
        exams={exams}
        defaultExamId={examId}
        basePath="/staff"
        onSubmit={createSubjectAction}
      />
    </div>
  );
}
