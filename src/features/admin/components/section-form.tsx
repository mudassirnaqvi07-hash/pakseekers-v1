"use client";

/**
 * Section Form — PakSeekers Admin.
 *
 * Handles creation and editing of curriculum sections with dynamic
 * subject filtering based on selected examination.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button, Input, Select } from "@/components/ui";
import type { Section, Exam, Subject } from "@/types";
import {
  createSectionAction,
  updateSectionAction,
} from "@/server/actions/content-actions";

interface SectionFormProps {
  section?: Section;
  exams: Exam[];
  subjects: Subject[];
}

export function SectionForm({ section, exams, subjects }: SectionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [selectedExamId, setSelectedExamId] = useState(
    section?.examId || (exams.length > 0 ? exams[0].id : "")
  );

  const filteredSubjects = subjects.filter(
    (sub) => !selectedExamId || sub.examId === selectedExamId
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = section
        ? await updateSectionAction(section.id, formData)
        : await createSectionAction(formData);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/sections");
        router.refresh();
      }, 700);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl">
      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 flex items-start gap-3 text-sm"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          role="alert"
          aria-live="polite"
          className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 flex items-center gap-3 text-sm"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>Section saved successfully! Redirecting...</span>
        </div>
      )}

      <div className="bg-surface border border-border rounded-xl p-6 flex flex-col gap-5 shadow-xs">
        <h3 className="font-bold text-text-primary text-base border-b border-border pb-3">
          {section ? "Edit Curriculum Section" : "New Curriculum Section"}
        </h3>

        {/* Exam & Subject Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="examId" className="block text-xs font-semibold text-text-primary mb-1.5">
              Target Examination *
            </label>
            <Select
              id="examId"
              name="examId"
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              required
            >
              <option value="" disabled>
                Select an exam
              </option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.title} ({exam.code})
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label htmlFor="subjectId" className="block text-xs font-semibold text-text-primary mb-1.5">
              Academic Subject *
            </label>
            <Select
              id="subjectId"
              name="subjectId"
              defaultValue={section?.subjectId || filteredSubjects[0]?.id || ""}
              required
            >
              <option value="" disabled>
                Select a subject
              </option>
              {filteredSubjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.title}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Section Title */}
        <div>
          <label htmlFor="title" className="block text-xs font-semibold text-text-primary mb-1.5">
            Section Title *
          </label>
          <Input
            id="title"
            name="title"
            defaultValue={section?.title || ""}
            placeholder="e.g. Organic Chemistry, Cellular Biology, Electromagnetism"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-xs font-semibold text-text-primary mb-1.5">
            Description / Syllabus Scope *
          </label>
          <textarea
            id="description"
            name="description"
            defaultValue={section?.description || ""}
            rows={3}
            required
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            placeholder="Outline the concepts, chapters, or syllabus divisions covered by this section."
          />
        </div>

        {/* Order and Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="order" className="block text-xs font-semibold text-text-primary mb-1.5">
              Display Order
            </label>
            <Input
              id="order"
              name="order"
              type="number"
              min={1}
              defaultValue={section?.order || 1}
              required
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-xs font-semibold text-text-primary mb-1.5">
              Publication Status
            </label>
            <Select
              id="status"
              name="status"
              defaultValue={section?.status || "active"}
            >
              <option value="active">Active (Visible)</option>
              <option value="draft">Draft (Admin Only)</option>
              <option value="archived">Archived</option>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Link href="/admin/sections">
          <Button
            type="button"
            variant="outline"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Cancel
          </Button>
        </Link>

        <Button
          type="submit"
          variant="primary"
          isLoading={isPending}
          disabled={isPending || success}
        >
          {section ? "Save Section Changes" : "Create Curriculum Section"}
        </Button>
      </div>
    </form>
  );
}
