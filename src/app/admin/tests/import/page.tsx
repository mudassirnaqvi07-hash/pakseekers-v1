import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui";
import { QuizImporter } from "@/features/admin/components/quiz-importer";
import {
  getAdminAllExams,
  getAdminAllSubjects,
  getAdminAllTopics,
} from "@/server/services/content-service";
import { importQuizAction } from "@/server/actions/content-actions";
import { requireAdmin } from "@/server/auth/session";

export const metadata: Metadata = {
  title: "Import Quiz from JSON | PakSeekers Admin",
  description: "Bulk import multiple-choice questions from JSON format into structured practice tests.",
};

interface ImportQuizPageProps {
  searchParams: Promise<{
    examId?: string;
    subjectId?: string;
    topicId?: string;
  }>;
}

export default async function ImportQuizPage({
  searchParams,
}: ImportQuizPageProps) {
  // Authoritative admin session requirement
  await requireAdmin();

  const { examId, subjectId, topicId } = await searchParams;
  const [exams, subjects, topics] = await Promise.all([
    getAdminAllExams(),
    getAdminAllSubjects(),
    getAdminAllTopics(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Create Quiz from JSON"
          description="Paste structured MCQ data in JSON format to automatically populate the question bank and generate playable tests."
        />
        <div className="flex items-center gap-2">
          <Link href="/admin/tests">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Tests
            </Button>
          </Link>
        </div>
      </div>

      <QuizImporter
        exams={exams}
        subjects={subjects}
        topics={topics}
        defaultExamId={examId}
        defaultSubjectId={subjectId}
        defaultTopicId={topicId}
        onSubmit={importQuizAction}
      />
    </div>
  );
}
