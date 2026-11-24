import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireStaff } from "@/server/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui";
import { QuizImporter } from "@/features/admin/components/quiz-importer";
import {
  getAdminAllExams,
  getAdminAllSubjects,
  getAdminAllTopics,
} from "@/server/services/content-service";
import { importQuizAction } from "@/server/actions/content-actions";

export const metadata: Metadata = {
  title: "Import Quiz from JSON | Staff | PakSeekers",
};

export default async function StaffImportQuizPage({
  searchParams,
}: {
  searchParams: Promise<{ examId?: string; subjectId?: string; topicId?: string }>;
}) {
  const user = await requireStaff("QUESTION_IMPORT");
  const { examId, subjectId, topicId } = await searchParams;

  const [exams, subjects, topics] = await Promise.all([
    getAdminAllExams(),
    getAdminAllSubjects(),
    getAdminAllTopics(),
  ]);

  const canPublish = hasPermission(user, "TEST_PUBLISH");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Import Quiz from JSON"
          description="Bulk import MCQs into the question bank and generate a quiz."
        />
        <Link href="/staff/tests">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Tests
          </Button>
        </Link>
      </div>

      <QuizImporter
        exams={exams}
        subjects={subjects}
        topics={topics}
        defaultExamId={examId}
        defaultSubjectId={subjectId}
        defaultTopicId={topicId}
        basePath="/staff"
        canPublish={canPublish}
        onSubmit={importQuizAction}
      />
    </div>
  );
}
