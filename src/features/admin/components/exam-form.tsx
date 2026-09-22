"use client";

/**
 * ExamForm — PakSeekers Admin.
 *
 * Form for creating or updating exams.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Exam, ActionResult } from "@/types";
import { Input, Textarea, Select, Button } from "@/components/ui";

interface ExamFormProps {
  initialData?: Exam;
  onSubmit: (data: {
    code: string;
    title: string;
    description: string;
    status: "active" | "draft" | "archived";
  }) => Promise<ActionResult<Exam>>;
  isEdit?: boolean;
}

export function ExamForm({
  initialData,
  onSubmit,
  isEdit = false,
}: ExamFormProps) {
  const router = useRouter();
  const [code, setCode] = useState(initialData?.code || "");
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [status, setStatus] = useState<"active" | "draft" | "archived">(
    initialData?.status || "active"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const res = await onSubmit({
        code: code.trim(),
        title: title.trim(),
        description: description.trim(),
        status,
      });

      if (res.success) {
        router.push("/admin/exams");
        router.refresh();
      } else {
        setErrorMessage(res.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl bg-surface border border-border rounded-xl p-6 sm:p-8 shadow-xs">
      {errorMessage && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-error">
          <span className="font-semibold">Error:</span> {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Exam Code / Abbreviation"
          placeholder="e.g. MDCAT, ECAT, NUST NET"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          helperText="Short uppercase identifier used in URL paths and badges."
          disabled={isPending}
        />

        <Select
          label="Preparation Status"
          value={status}
          onChange={(e) =>
            setStatus(e.target.value as "active" | "draft" | "archived")
          }
          options={[
            { value: "active", label: "Active (Available to students)" },
            { value: "draft", label: "Draft (Under curriculum development)" },
            { value: "archived", label: "Archived (Past exam cycle)" },
          ]}
          disabled={isPending}
        />
      </div>

      <Input
        label="Full Examination Title"
        placeholder="e.g. Medical & Dental College Admission Test"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        disabled={isPending}
      />

      <Textarea
        label="Description & Curriculum Details"
        placeholder="Provide background regarding the conducting body, eligibility, and curriculum scope..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
        required
        helperText="Displayed on the student portal exam landing card and syllabus directory."
        disabled={isPending}
      />

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isPending}>
          {isEdit ? "Save Exam Changes" : "Create Exam"}
        </Button>
      </div>
    </form>
  );
}
