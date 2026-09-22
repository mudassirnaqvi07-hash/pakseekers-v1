import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui";
import { SubjectForm } from "@/features/admin/components/subject-form";
import {
  getSubjectById,
  getAllExams,
} from "@/server/repositories/content-repository";
import { updateSubjectAction } from "@/server/actions/content-actions";

interface EditSubjectPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: EditSubjectPageProps): Promise<Metadata> {
  const { id } = await params;
  const subject = getSubjectById(id);
  return {
    title: subject ? `Edit ${subject.title} | PakSeekers Admin` : "Subject Not Found",
  };
}

export default async function EditSubjectPage({ params }: EditSubjectPageProps) {
  const { id } = await params;
  const subject = getSubjectById(id);
  const exams = getAllExams();

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
        <Link href="/admin/subjects">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Subjects
          </Button>
        </Link>
      </div>

      <SubjectForm
        exams={exams}
        initialData={subject}
        isEdit
        onSubmit={async (data) => {
          "use server";
          return updateSubjectAction(subject.id, data);
        }}
      />
    </div>
  );
}
