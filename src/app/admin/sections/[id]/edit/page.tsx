import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth/session";
import {
  getSectionById,
  getAllExams,
  getAllSubjects,
} from "@/server/services/content-service";
import { PageHeader } from "@/components/shared/page-header";
import { SectionForm } from "@/features/admin/components/section-form";

export const metadata: Metadata = {
  title: "Edit Section — PakSeekers Admin",
};

interface EditSectionPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSectionPage({ params }: EditSectionPageProps) {
  await requireAdmin();
  const { id } = await params;

  const [section, exams, subjects] = await Promise.all([
    getSectionById(id),
    getAllExams(),
    getAllSubjects(),
  ]);

  if (!section) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <PageHeader
        title={`Edit Section: ${section.title}`}
        description="Update section settings, ordering, time limit, and exam assignment."
      />

      <SectionForm section={section} exams={exams} subjects={subjects} />
    </div>
  );
}
