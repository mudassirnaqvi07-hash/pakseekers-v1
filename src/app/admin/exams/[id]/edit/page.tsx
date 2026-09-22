import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui";
import { ExamForm } from "@/features/admin/components/exam-form";
import { getExamById } from "@/server/repositories/content-repository";
import { updateExamAction } from "@/server/actions/content-actions";

interface EditExamPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: EditExamPageProps): Promise<Metadata> {
  const { id } = await params;
  const exam = getExamById(id);
  return {
    title: exam ? `Edit ${exam.code} | PakSeekers Admin` : "Exam Not Found",
  };
}

export default async function EditExamPage({ params }: EditExamPageProps) {
  const { id } = await params;
  const exam = getExamById(id);

  if (!exam) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title={`Edit Exam: ${exam.code}`}
          description={`Update metadata, title, description, or status for ${exam.title}.`}
        />
        <Link href="/admin/exams">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Exams
          </Button>
        </Link>
      </div>

      <ExamForm
        initialData={exam}
        isEdit
        onSubmit={async (data) => {
          "use server";
          return updateExamAction(exam.id, data);
        }}
      />
    </div>
  );
}
