import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui";
import { ExamForm } from "@/features/admin/components/exam-form";
import { createExamAction } from "@/server/actions/content-actions";

export const metadata: Metadata = {
  title: "Create Exam | PakSeekers Admin",
};

export default function CreateExamPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Create Entrance Exam"
          description="Register a new academic test preparation track for students."
        />
        <Link href="/admin/exams">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Exams
          </Button>
        </Link>
      </div>

      <ExamForm onSubmit={createExamAction} />
    </div>
  );
}
