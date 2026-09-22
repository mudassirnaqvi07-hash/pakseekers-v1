"use client";

/**
 * TopicForm — PakSeekers Admin.
 *
 * Form for creating or editing topics. Features cascading Exam -> Subject selection.
 */

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Topic, Subject, Exam, ActionResult } from "@/types";
import { Input, Textarea, Select, Button } from "@/components/ui";

interface TopicFormProps {
  exams: Exam[];
  subjects: Subject[];
  initialData?: Topic;
  defaultExamId?: string;
  defaultSubjectId?: string;
  onSubmit: (data: {
    examId: string;
    subjectId: string;
    title: string;
    description: string;
    status: "active" | "draft" | "archived";
  }) => Promise<ActionResult<Topic>>;
  isEdit?: boolean;
}

export function TopicForm({
  exams,
  subjects,
  initialData,
  defaultExamId,
  defaultSubjectId,
  onSubmit,
  isEdit = false,
}: TopicFormProps) {
  const router = useRouter();

  // Initial exam selection
  const initialExam =
    initialData?.examId ||
    defaultExamId ||
    (defaultSubjectId
      ? subjects.find((s) => s.id === defaultSubjectId)?.examId
      : "") ||
    (exams.length > 0 ? exams[0].id : "");

  const [examId, setExamId] = useState(initialExam);

  // Filter subjects belonging to selected exam
  const filteredSubjects = useMemo(() => {
    return subjects.filter(
      (s) => s.examId.toLowerCase() === examId.toLowerCase()
    );
  }, [subjects, examId]);

  // Initial subject selection
  const initialSubject =
    initialData?.subjectId ||
    defaultSubjectId ||
    (filteredSubjects.length > 0 ? filteredSubjects[0].id : "");

  const [subjectId, setSubjectId] = useState(initialSubject);
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [status, setStatus] = useState<"active" | "draft" | "archived">(
    initialData?.status || "active"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // When exam changes, update subject to first available in that exam
  const handleExamChange = (newExamId: string) => {
    setExamId(newExamId);
    const available = subjects.filter(
      (s) => s.examId.toLowerCase() === newExamId.toLowerCase()
    );
    setSubjectId(available.length > 0 ? available[0].id : "");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!examId || !subjectId) {
      setErrorMessage("Both Exam and Subject must be selected to preserve hierarchy.");
      return;
    }

    startTransition(async () => {
      const res = await onSubmit({
        examId,
        subjectId,
        title: title.trim(),
        description: description.trim(),
        status,
      });

      if (res.success) {
        router.push("/admin/topics");
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

      {/* Cascading Exam & Subject Pickers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="1. Select Exam"
          value={examId}
          onChange={(e) => handleExamChange(e.target.value)}
          required
          options={exams.map((e) => ({
            value: e.id,
            label: `${e.code} — ${e.title}`,
          }))}
          disabled={isPending}
        />

        <Select
          label="2. Select Subject"
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          required
          options={filteredSubjects.map((s) => ({
            value: s.id,
            label: s.title,
          }))}
          helperText={
            filteredSubjects.length === 0
              ? "No subjects found for this exam. Create one first."
              : undefined
          }
          disabled={isPending || filteredSubjects.length === 0}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <Input
            label="Topic Title"
            placeholder="e.g. Cell Biology & Ultrastructure, Genetics"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={isPending}
          />
        </div>

        <Select
          label="Status"
          value={status}
          onChange={(e) =>
            setStatus(e.target.value as "active" | "draft" | "archived")
          }
          options={[
            { value: "active", label: "Active (Available)" },
            { value: "draft", label: "Draft" },
            { value: "archived", label: "Archived" },
          ]}
          disabled={isPending}
        />
      </div>

      <Textarea
        label="Topic Scope & Syllabus Summary"
        placeholder="Detail the sub-concepts, key learning outcomes, and formulas..."
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
          {isEdit ? "Save Topic Changes" : "Create Topic"}
        </Button>
      </div>
    </form>
  );
}
