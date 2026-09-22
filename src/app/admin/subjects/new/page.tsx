import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui";
import { SubjectForm } from "@/features/admin/components/subject-form";
import { getAllExams } from "@/server/repositories/content-repository";
import { createSubjectAction } from "@/server/actions/content-actions";

export const metadata: Metadata = {
  title: "Create Subject | PakSeekers Admin",
};

interface CreateSubjectPageProps {
  searchParams: Promise<{ examId?: string }>;
}

export default async function CreateSubjectPage({
  searchParams,
}: CreateSubjectPageProps) {
  const { examId } = await searchParams;
  const exams = getAllExams();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Create Academic Subject"
          description="Add a curriculum discipline under an entrance examination track."
        />
        <Link href="/admin/subjects">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Subjects
          </Button>
        </Link>
      </div>

      <SubjectForm
        exams={exams}
        defaultExamId={examId}
        onSubmit={createSubjectAction}
      />
    </div>
  );
}
