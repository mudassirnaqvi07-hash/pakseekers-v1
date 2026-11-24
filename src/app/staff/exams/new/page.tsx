import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireStaff } from "@/server/auth/session";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui";
import { ExamForm } from "@/features/admin/components/exam-form";
import { createExamAction } from "@/server/actions/content-actions";

export const metadata: Metadata = {
  title: "Create Exam | Staff | PakSeekers",
};

export default async function StaffNewExamPage() {
  await requireStaff("EXAM_CREATE");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Create New Exam"
          description="Add a new entrance examination track to the PakSeekers catalog."
        />
        <Link href="/staff/exams">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Exams
          </Button>
        </Link>
      </div>

      <ExamForm basePath="/staff" onSubmit={createExamAction} />
    </div>
  );
}
