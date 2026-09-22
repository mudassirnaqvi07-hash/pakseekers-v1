import type { Metadata } from "next";
import { getAllExams } from "@/features/exams/services/content-service";
import { ExamCard } from "@/features/exams/components/exam-card";
import { PageHeader } from "@/components/shared";
import { EmptyState } from "@/components/shared";
import { GraduationCap } from "lucide-react";

export const metadata: Metadata = {
  title: "Exams Catalog | PakSeekers",
  description: "Browse standardized university entrance exams and academic test preparation tracks in Pakistan.",
};

export default async function ExamsPage() {
  const exams = await getAllExams();

  return (
    <div className="flex flex-col gap-8">
      {/* Page Heading */}
      <PageHeader
        title="Entry Test Preparation"
        description="Select an examination track to access subject syllabus breakdowns, high-yield topic question banks, and timed practice quizzes."
      />

      {/* Catalog Grid */}
      {exams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <ExamCard key={exam.id} exam={exam} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<GraduationCap className="w-7 h-7" />}
          title="No Exams Available"
          description="Examination tracks are currently being populated by our academic curriculum team."
        />
      )}
    </div>
  );
}
