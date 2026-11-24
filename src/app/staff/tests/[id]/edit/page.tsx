import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireStaff } from "@/server/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui";
import { TestBuilderForm } from "@/features/admin/components/test-builder-form";
import {
  getAdminTestById,
  getAdminAllExams,
  getAdminAllSubjects,
  getAdminAllTopics,
  getAdminAllQuestions,
} from "@/server/services/content-service";
import { updateTestAction } from "@/server/actions/content-actions";

export const metadata: Metadata = {
  title: "Edit Test | Staff | PakSeekers",
};

export default async function StaffEditTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireStaff("TEST_EDIT");
  const { id } = await params;

  const [test, exams, subjects, topics, allQuestions] = await Promise.all([
    getAdminTestById(id),
    getAdminAllExams(),
    getAdminAllSubjects(),
    getAdminAllTopics(),
    getAdminAllQuestions(),
  ]);

  if (!test) {
    notFound();
  }

  const canPublish = hasPermission(user, "TEST_PUBLISH");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title={`Edit Test: ${test.title}`}
          description="Update test questions, duration, curriculum scope, or draft status."
        />
        <Link href="/staff/tests">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Tests
          </Button>
        </Link>
      </div>

      <TestBuilderForm
        exams={exams}
        subjects={subjects}
        topics={topics}
        allQuestions={allQuestions}
        initialData={test}
        isEdit
        basePath="/staff"
        canPublish={canPublish}
        onSubmit={async (data) => {
          "use server";
          return updateTestAction(test.id, data);
        }}
      />
    </div>
  );
}
