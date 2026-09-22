"use client";

/**
 * QuestionForm — PakSeekers Admin.
 *
 * Full authoring form for Multiple Choice Questions.
 * Generates identical normalized Question structure required by the future
 * Bulk Copy/Paste MCQ Importer.
 */

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import type {
  Question,
  Exam,
  Subject,
  Topic,
  QuestionDifficulty,
  QuestionStatus,
  ActionResult,
} from "@/types";
import { Input, Textarea, Select, Button } from "@/components/ui";

interface QuestionFormProps {
  exams: Exam[];
  subjects: Subject[];
  topics: Topic[];
  initialData?: Question;
  defaultExamId?: string;
  defaultSubjectId?: string;
  defaultTopicId?: string;
  onSubmit: (data: Omit<Question, "id" | "createdAt" | "updatedAt">) => Promise<ActionResult<Question>>;
  isEdit?: boolean;
}

export function QuestionForm({
  exams,
  subjects,
  topics,
  initialData,
  defaultExamId,
  defaultSubjectId,
  defaultTopicId,
  onSubmit,
  isEdit = false,
}: QuestionFormProps) {
  const router = useRouter();

  // Hierarchy Selection
  const initialExam =
    initialData?.examId ||
    defaultExamId ||
    (defaultSubjectId
      ? subjects.find((s) => s.id === defaultSubjectId)?.examId
      : "") ||
    (exams.length > 0 ? exams[0].id : "");

  const [examId, setExamId] = useState(initialExam);

  const availableSubjects = useMemo(() => {
    return subjects.filter(
      (s) => s.examId.toLowerCase() === examId.toLowerCase()
    );
  }, [subjects, examId]);

  const initialSubject =
    initialData?.subjectId ||
    defaultSubjectId ||
    (availableSubjects.length > 0 ? availableSubjects[0].id : "");

  const [subjectId, setSubjectId] = useState(initialSubject);

  const availableTopics = useMemo(() => {
    return topics.filter(
      (t) => t.subjectId.toLowerCase() === subjectId.toLowerCase()
    );
  }, [topics, subjectId]);

  const initialTopic =
    initialData?.topicId ||
    defaultTopicId ||
    (availableTopics.length > 0 ? availableTopics[0].id : "");

  const [topicId, setTopicId] = useState(initialTopic);

  // Question fields
  const [questionText, setQuestionText] = useState(initialData?.questionText || "");

  // 4 Standard Options
  const [optA, setOptA] = useState(
    initialData?.options?.find((o) => o.label === "A")?.text || ""
  );
  const [optB, setOptB] = useState(
    initialData?.options?.find((o) => o.label === "B")?.text || ""
  );
  const [optC, setOptC] = useState(
    initialData?.options?.find((o) => o.label === "C")?.text || ""
  );
  const [optD, setOptD] = useState(
    initialData?.options?.find((o) => o.label === "D")?.text || ""
  );

  // Correct answer letter: 'A', 'B', 'C', or 'D'
  const initialCorrectLabel: "A" | "B" | "C" | "D" = useMemo(() => {
    if (!initialData) return "A";
    const matched = initialData.options.find(
      (o) => o.id === initialData.correctAnswer
    );
    const label = matched?.label;
    if (label === "A" || label === "B" || label === "C" || label === "D") {
      return label;
    }
    return "A";
  }, [initialData]);

  const [correctAnswerLabel, setCorrectAnswerLabel] = useState<"A" | "B" | "C" | "D">(
    initialCorrectLabel
  );

  const [explanation, setExplanation] = useState(initialData?.explanation || "");
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>(
    initialData?.difficulty || "medium"
  );
  const [status, setStatus] = useState<QuestionStatus>(
    initialData?.status || "published"
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Cascade handlers
  const handleExamChange = (newExamId: string) => {
    setExamId(newExamId);
    const subs = subjects.filter(
      (s) => s.examId.toLowerCase() === newExamId.toLowerCase()
    );
    const newSubId = subs.length > 0 ? subs[0].id : "";
    setSubjectId(newSubId);
    const tops = topics.filter(
      (t) => t.subjectId.toLowerCase() === newSubId.toLowerCase()
    );
    setTopicId(tops.length > 0 ? tops[0].id : "");
  };

  const handleSubjectChange = (newSubId: string) => {
    setSubjectId(newSubId);
    const tops = topics.filter(
      (t) => t.subjectId.toLowerCase() === newSubId.toLowerCase()
    );
    setTopicId(tops.length > 0 ? tops[0].id : "");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side validations
    if (!examId || !subjectId || !topicId) {
      setErrorMessage("Please select an Exam, Subject, and Topic for this question.");
      return;
    }

    if (!questionText.trim()) {
      setErrorMessage("Question text is required.");
      return;
    }

    const trimmedOptions = [
      { id: "opt-1", label: "A", text: optA.trim() },
      { id: "opt-2", label: "B", text: optB.trim() },
      { id: "opt-3", label: "C", text: optC.trim() },
      { id: "opt-4", label: "D", text: optD.trim() },
    ];

    // Check empty option texts
    const emptyOpt = trimmedOptions.find((o) => !o.text);
    if (emptyOpt) {
      setErrorMessage(`Option ${emptyOpt.label} text cannot be empty.`);
      return;
    }

    // Check duplicates
    const normalizedTexts = trimmedOptions.map((o) => o.text.toLowerCase());
    const hasDup = normalizedTexts.some(
      (val, idx) => normalizedTexts.indexOf(val) !== idx
    );
    if (hasDup) {
      setErrorMessage("Duplicate option text detected. Each option must be distinct.");
      return;
    }

    if (!explanation.trim()) {
      setErrorMessage("Explanation is required to support student learning.");
      return;
    }

    // Map correct answer label to option ID
    const correctOption = trimmedOptions.find((o) => o.label === correctAnswerLabel);
    if (!correctOption) {
      setErrorMessage("Please select a valid correct answer option.");
      return;
    }

    startTransition(async () => {
      const payload: Omit<Question, "id" | "createdAt" | "updatedAt"> = {
        questionText: questionText.trim(),
        options: trimmedOptions,
        correctAnswer: correctOption.id,
        explanation: explanation.trim(),
        examId,
        subjectId,
        topicId,
        difficulty,
        status,
      };

      const res = await onSubmit(payload);
      if (res.success) {
        router.push("/admin/questions");
        router.refresh();
      } else {
        setErrorMessage(res.error);
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 max-w-3xl bg-surface border border-border rounded-xl p-6 sm:p-8 shadow-xs"
    >
      {errorMessage && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-error">
          <span className="font-semibold">Validation Error:</span> {errorMessage}
        </div>
      )}

      {/* 1. Academic Hierarchy Selection */}
      <div className="flex flex-col gap-3 pb-4 border-b border-border">
        <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
          Curriculum Classification
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Exam"
            value={examId}
            onChange={(e) => handleExamChange(e.target.value)}
            required
            options={exams.map((e) => ({
              value: e.id,
              label: e.code,
            }))}
            disabled={isPending}
          />

          <Select
            label="Subject"
            value={subjectId}
            onChange={(e) => handleSubjectChange(e.target.value)}
            required
            options={availableSubjects.map((s) => ({
              value: s.id,
              label: s.title,
            }))}
            disabled={isPending || availableSubjects.length === 0}
          />

          <Select
            label="Topic"
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            required
            options={availableTopics.map((t) => ({
              value: t.id,
              label: t.title,
            }))}
            disabled={isPending || availableTopics.length === 0}
          />
        </div>
      </div>

      {/* 2. Question Stem */}
      <Textarea
        label="Question Stem / Statement"
        placeholder="Enter the full question or problem statement clearly..."
        value={questionText}
        onChange={(e) => setQuestionText(e.target.value)}
        rows={3}
        required
        disabled={isPending}
      />

      {/* 3. Multiple Choice Options (A, B, C, D) */}
      <div className="flex flex-col gap-3.5 bg-background p-4 sm:p-5 rounded-lg border border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Multiple Choice Options & Correct Answer
          </h3>
          <span className="text-xs text-text-secondary">
            Select the radio button of the correct answer
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {/* Option A */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
              <input
                type="radio"
                name="correctAnswer"
                value="A"
                checked={correctAnswerLabel === "A"}
                onChange={() => setCorrectAnswerLabel("A")}
                className="w-4 h-4 text-primary focus:ring-primary"
                disabled={isPending}
              />
              <span className="w-6 h-6 rounded bg-surface border border-border text-xs font-bold flex items-center justify-center">
                A
              </span>
            </label>
            <div className="flex-1">
              <Input
                placeholder="Option A content..."
                value={optA}
                onChange={(e) => setOptA(e.target.value)}
                required
                disabled={isPending}
              />
            </div>
          </div>

          {/* Option B */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
              <input
                type="radio"
                name="correctAnswer"
                value="B"
                checked={correctAnswerLabel === "B"}
                onChange={() => setCorrectAnswerLabel("B")}
                className="w-4 h-4 text-primary focus:ring-primary"
                disabled={isPending}
              />
              <span className="w-6 h-6 rounded bg-surface border border-border text-xs font-bold flex items-center justify-center">
                B
              </span>
            </label>
            <div className="flex-1">
              <Input
                placeholder="Option B content..."
                value={optB}
                onChange={(e) => setOptB(e.target.value)}
                required
                disabled={isPending}
              />
            </div>
          </div>

          {/* Option C */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
              <input
                type="radio"
                name="correctAnswer"
                value="C"
                checked={correctAnswerLabel === "C"}
                onChange={() => setCorrectAnswerLabel("C")}
                className="w-4 h-4 text-primary focus:ring-primary"
                disabled={isPending}
              />
              <span className="w-6 h-6 rounded bg-surface border border-border text-xs font-bold flex items-center justify-center">
                C
              </span>
            </label>
            <div className="flex-1">
              <Input
                placeholder="Option C content..."
                value={optC}
                onChange={(e) => setOptC(e.target.value)}
                required
                disabled={isPending}
              />
            </div>
          </div>

          {/* Option D */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
              <input
                type="radio"
                name="correctAnswer"
                value="D"
                checked={correctAnswerLabel === "D"}
                onChange={() => setCorrectAnswerLabel("D")}
                className="w-4 h-4 text-primary focus:ring-primary"
                disabled={isPending}
              />
              <span className="w-6 h-6 rounded bg-surface border border-border text-xs font-bold flex items-center justify-center">
                D
              </span>
            </label>
            <div className="flex-1">
              <Input
                placeholder="Option D content..."
                value={optD}
                onChange={(e) => setOptD(e.target.value)}
                required
                disabled={isPending}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Pedagogical Explanation */}
      <Textarea
        label="Explanation & Pedagogical Rationale"
        placeholder="Explain step-by-step why the selected option is correct and why other distractors are incorrect..."
        value={explanation}
        onChange={(e) => setExplanation(e.target.value)}
        rows={3}
        required
        helperText="Students will see this explanation during quiz result review."
        disabled={isPending}
      />

      {/* 5. Metadata: Difficulty & Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Question Difficulty"
          value={difficulty}
          onChange={(e) =>
            setDifficulty(e.target.value as QuestionDifficulty)
          }
          options={[
            { value: "easy", label: "Easy" },
            { value: "medium", label: "Medium" },
            { value: "hard", label: "Hard" },
          ]}
          disabled={isPending}
        />

        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as QuestionStatus)}
          options={[
            { value: "published", label: "Published (Available for Tests)" },
            { value: "draft", label: "Draft" },
            { value: "review", label: "Under Review" },
            { value: "archived", label: "Archived" },
          ]}
          disabled={isPending}
        />
      </div>

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
          {isEdit ? "Save Question Changes" : "Add Question to Bank"}
        </Button>
      </div>
    </form>
  );
}
