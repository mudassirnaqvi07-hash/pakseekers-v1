"use client";

/**
 * SubjectForm — PakSeekers Admin.
 *
 * Form for creating or editing subjects under a parent exam.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Subject, Exam, ActionResult } from "@/types";
import { Input, Textarea, Select, Button } from "@/components/ui";

interface SubjectFormProps {
  exams: Exam[];
  initialData?: Subject;
  defaultExamId?: string;
  onSubmit: (data: {
    examId: string;
    title: string;
    description: string;
    icon?: string;
    status: "active" | "draft" | "archived";
  }) => Promise<ActionResult<Subject>>;
  isEdit?: boolean;
}

export function SubjectForm({
  exams,
  initialData,
  defaultExamId,
  onSubmit,
  isEdit = false,
}: SubjectFormProps) {
  const router = useRouter();
  const [examId, setExamId] = useState(
    initialData?.examId || defaultExamId || (exams.length > 0 ? exams[0].id : "")
  );
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [icon, setIcon] = useState(initialData?.icon || "BookOpen");
  const [status, setStatus] = useState<"active" | "draft" | "archived">(
    initialData?.status || "active"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!examId) {
      setErrorMessage("You must select a parent exam. Orphan subjects are not permitted.");
      return;
    }

    startTransition(async () => {
      const res = await onSubmit({
        examId,
        title: title.trim(),
        description: description.trim(),
        icon,
        status,
      });

      if (res.success) {
        router.push("/admin/subjects");
        router.refresh();
      } else {
        setErrorMessage(res.error);
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 max-w-2xl bg-surface border border-border rounded-xl p-6 sm:p-8 shadow-xs"
    >
      {errorMessage && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-error">
          <span className="font-semibold">Error:</span> {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Parent Entrance Exam"
          value={examId}
          onChange={(e) => setExamId(e.target.value)}
          required
          options={exams.map((e) => ({
            value: e.id,
            label: `${e.code} — ${e.title}`,
          }))}
          helperText="Every subject must belong to an exam."
          disabled={isPending}
        />

        <Select
          label="Status"
          value={status}
          onChange={(e) =>
            setStatus(e.target.value as "active" | "draft" | "archived")
          }
          options={[
            { value: "active", label: "Active (Visible to students)" },
            { value: "draft", label: "Draft" },
            { value: "archived", label: "Archived" },
          ]}
          disabled={isPending}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Subject Title"
          placeholder="e.g. Biology, Chemistry, Mathematics"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={isPending}
        />

        <Select
          label="Display Icon"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          options={[
            { value: "BookOpen", label: "Book (General)" },
            { value: "Dna", label: "DNA (Biology / Life Sciences)" },
            { value: "FlaskConical", label: "Flask (Chemistry)" },
            { value: "Zap", label: "Zap / Lightning (Physics)" },
          ]}
          disabled={isPending}
        />
      </div>

      <Textarea
        label="Curriculum Description"
        placeholder="Describe the topics and scope covered by this subject..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
        required
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
          {isEdit ? "Save Subject Changes" : "Create Subject"}
        </Button>
      </div>
    </form>
  );
}
