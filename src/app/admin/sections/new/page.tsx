import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/session";
import { getAllExams, getAllSubjects } from "@/server/services/content-service";
import { PageHeader } from "@/components/shared/page-header";
import { SectionForm } from "@/features/admin/components/section-form";

export const metadata: Metadata = {
  title: "Add New Section — PakSeekers Admin",
};

export default async function NewSectionPage() {
  await requireAdmin();

  const [exams, subjects] = await Promise.all([
    getAllExams(),
    getAllSubjects(),
  ]);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <PageHeader
        title="Create Section"
        description="Add a new curriculum section with ordering, timing, and exam alignment."
      />

      <SectionForm exams={exams} subjects={subjects} />
    </div>
  );
}
