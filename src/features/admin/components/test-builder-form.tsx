"use client";

/**
 * TestBuilderForm — PakSeekers Admin.
 *
 * Interactive Test Builder that links tests to reusable questions from the question bank.
 * Includes inline question bank search, question selection, reordering, and student preview.
 */

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Eye,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
} from "lucide-react";
import type {
  Test,
  Exam,
  Subject,
  Topic,
  Question,
  TestDifficulty,
  TestStatus,
  ActionResult,
} from "@/types";
import { Input, Textarea, Select, Button, Badge } from "@/components/ui";

interface TestBuilderFormProps {
  exams: Exam[];
  subjects: Subject[];
  topics: Topic[];
  allQuestions: Question[];
  initialData?: Test;
  defaultExamId?: string;
  defaultSubjectId?: string;
  defaultTopicId?: string;
  onSubmit: (data: Omit<Test, "id" | "questionCount" | "createdAt" | "updatedAt">) => Promise<ActionResult<Test>>;
  isEdit?: boolean;
}

export function TestBuilderForm({
  exams,
  subjects,
  topics,
  allQuestions,
  initialData,
  defaultExamId,
  defaultSubjectId,
  defaultTopicId,
  onSubmit,
  isEdit = false,
}: TestBuilderFormProps) {
  const router = useRouter();

  // 1. Hierarchy Selection
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

  // 2. Test metadata
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [durationMinutes, setDurationMinutes] = useState(
    initialData?.durationMinutes || 15
  );
  const [difficulty, setDifficulty] = useState<TestDifficulty>(
    initialData?.difficulty || "medium"
  );
  const [status, setStatus] = useState<TestStatus>(
    initialData?.status || "published"
  );

  // 3. Question Bank Selection
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>(
    initialData?.questionIds || []
  );

  const [questionSearch, setQuestionSearch] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
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

  // Questions available for picking (filtered by selected Exam & Subject)
  const candidateQuestions = useMemo(() => {
    return allQuestions.filter((q) => {
      // Must match Exam
      if (examId && q.examId.toLowerCase() !== examId.toLowerCase()) return false;
      // Must match Subject if selected
      if (subjectId && q.subjectId.toLowerCase() !== subjectId.toLowerCase())
        return false;
      // Filter by search query if typed
      if (questionSearch.trim()) {
        const term = questionSearch.toLowerCase();
        return (
          q.questionText.toLowerCase().includes(term) ||
          q.explanation.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [allQuestions, examId, subjectId, questionSearch]);

  // Selected question objects
  const selectedQuestions = useMemo(() => {
    const map = new Map(allQuestions.map((q) => [q.id, q]));
    return selectedQuestionIds
      .map((id) => map.get(id))
      .filter((q): q is Question => Boolean(q));
  }, [allQuestions, selectedQuestionIds]);

  const toggleQuestionSelection = (qId: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    );
  };

  const removeSelectedQuestion = (qId: string) => {
    setSelectedQuestionIds((prev) => prev.filter((id) => id !== qId));
  };

  const moveQuestion = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= selectedQuestionIds.length) return;
    setSelectedQuestionIds((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(fromIdx, 1);
      copy.splice(toIdx, 0, moved);
      return copy;
    });
  };

  const handleFormSubmit = (targetStatus: TestStatus) => {
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage("Test title is required.");
      return;
    }

    if (!examId || !subjectId) {
      setErrorMessage("Please select both Exam and Subject.");
      return;
    }

    if (targetStatus === "published" && selectedQuestionIds.length === 0) {
      setErrorMessage("Cannot publish a test with zero questions. Please add questions from the bank.");
      return;
    }

    startTransition(async () => {
      const payload: Omit<Test, "id" | "questionCount" | "createdAt" | "updatedAt"> = {
        title: title.trim(),
        description: description.trim(),
        examId,
        subjectId,
        topicId: topicId || undefined,
        durationMinutes: Number(durationMinutes) || 15,
        difficulty,
        status: targetStatus,
        questionIds: selectedQuestionIds,
      };

      const res = await onSubmit(payload);
      if (res.success) {
        router.push("/admin/tests");
        router.refresh();
      } else {
        setErrorMessage(res.error);
      }
    });
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      {errorMessage && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-error">
          <span className="font-semibold">Validation Error:</span> {errorMessage}
        </div>
      )}

      {/* 1. Test Metadata Card */}
      <div className="bg-surface border border-border rounded-xl p-6 sm:p-8 shadow-xs flex flex-col gap-6">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h2 className="text-base font-bold text-text-primary">
            1. Test Information & Curriculum Scope
          </h2>
          <Badge variant="info">Step 1</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            label="Topic (Optional)"
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            options={[
              { value: "", label: "Entire Subject (Cross-topic)" },
              ...availableTopics.map((t) => ({
                value: t.id,
                label: t.title,
              })),
            ]}
            disabled={isPending}
          />
        </div>

        <Input
          label="Test Title"
          placeholder="e.g. MDCAT Biology Full Chapter Test 01"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={isPending}
        />

        <Textarea
          label="Test Instructions & Syllabus Scope"
          placeholder="Brief student instructions, syllabus coverage, marking rules..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          required
          disabled={isPending}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Duration (Minutes)"
            type="number"
            min={1}
            max={360}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            required
            disabled={isPending}
          />

          <Select
            label="Difficulty"
            value={difficulty}
            onChange={(e) =>
              setDifficulty(e.target.value as TestDifficulty)
            }
            options={[
              { value: "easy", label: "Easy" },
              { value: "medium", label: "Medium" },
              { value: "hard", label: "Hard" },
              { value: "mixed", label: "Mixed Difficulty" },
            ]}
            disabled={isPending}
          />

          <Select
            label="Publishing Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TestStatus)}
            options={[
              { value: "published", label: "Published (Visible to students)" },
              { value: "draft", label: "Draft" },
              { value: "archived", label: "Archived" },
            ]}
            disabled={isPending}
          />
        </div>
      </div>

      {/* 2. Question Bank Selector */}
      <div className="bg-surface border border-border rounded-xl p-6 sm:p-8 shadow-xs flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-text-primary">
              2. Select Questions from Question Bank
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Pick existing questions to include in this test. No duplicate typing required.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary">
              {selectedQuestionIds.length} Selected
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPreviewOpen(!isPreviewOpen)}
              leftIcon={<Eye className="w-4 h-4" />}
            >
              {isPreviewOpen ? "Hide Preview" : "Preview Test"}
            </Button>
          </div>
        </div>

        {/* Search bar inside Question Bank selector */}
        <Input
          placeholder="Filter questions by keywords..."
          value={questionSearch}
          onChange={(e) => setQuestionSearch(e.target.value)}
          disabled={isPending}
        />

        {/* Candidate Questions List */}
        <div className="border border-border rounded-lg max-h-80 overflow-y-auto divide-y divide-border">
          {candidateQuestions.length > 0 ? (
            candidateQuestions.map((q) => {
              const isSelected = selectedQuestionIds.includes(q.id);

              return (
                <div
                  key={q.id}
                  onClick={() => toggleQuestionSelection(q.id)}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-primary/5 hover:bg-primary/10"
                      : "hover:bg-background"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}} // Handled by div onClick
                    className="mt-1 w-4 h-4 text-primary rounded border-border focus:ring-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary line-clamp-2">
                      {q.questionText}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-text-secondary mt-1">
                      <Badge variant="default" className="text-[10px] px-1.5 py-0 capitalize">
                        {q.difficulty}
                      </Badge>
                      <span>•</span>
                      <span>{q.options.length} Options</span>
                      <span>•</span>
                      <span className="truncate">{q.topicId}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-text-secondary">
              No questions found matching your exam and subject selection.
            </div>
          )}
        </div>

        {/* Selected Questions Order List */}
        {selectedQuestions.length > 0 && (
          <div className="flex flex-col gap-3 pt-4 border-t border-border">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Selected Questions ({selectedQuestions.length}) — Set Presentation Order
            </h3>

            <div className="flex flex-col gap-2">
              {selectedQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  className="bg-background border border-border rounded-lg p-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-primary shrink-0 w-6">
                      #{idx + 1}
                    </span>
                    <p className="font-medium text-text-primary truncate">
                      {q.questionText}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveQuestion(idx, idx - 1)}
                      className="p-1 rounded hover:bg-slate-200 disabled:opacity-30"
                      title="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === selectedQuestions.length - 1}
                      onClick={() => moveQuestion(idx, idx + 1)}
                      className="p-1 rounded hover:bg-slate-200 disabled:opacity-30"
                      title="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSelectedQuestion(q.id)}
                      className="p-1 rounded text-error hover:bg-red-50 ml-1"
                      title="Remove question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Student Preview Modal / Section */}
      {isPreviewOpen && (
        <div className="bg-surface border-2 border-primary/40 rounded-xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-base font-bold text-text-primary">
                Student-Facing Test Preview
              </h2>
            </div>
            <span className="text-xs text-text-secondary">
              Verifying test flow before publishing
            </span>
          </div>

          <div className="bg-background border border-border rounded-lg p-5">
            <h3 className="text-xl font-bold text-text-primary">{title || "Untitled Test"}</h3>
            <p className="text-sm text-text-secondary mt-1">{description || "No description provided."}</p>
            <div className="flex items-center gap-3 text-xs text-text-secondary mt-3">
              <span>{selectedQuestionIds.length} Questions</span>
              <span>•</span>
              <span>{durationMinutes} Minutes</span>
              <span>•</span>
              <span className="capitalize">{difficulty}</span>
            </div>
          </div>

          {selectedQuestions.length > 0 ? (
            <div className="flex flex-col gap-4">
              {selectedQuestions.map((q, idx) => (
                <div key={q.id} className="bg-background border border-border rounded-lg p-4 flex flex-col gap-3">
                  <div className="font-semibold text-sm text-text-primary">
                    {idx + 1}. {q.questionText}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt) => (
                      <div
                        key={opt.id}
                        className={`p-2 rounded text-xs border ${
                          opt.id === q.correctAnswer
                            ? "bg-green-100 text-green-950 border-green-300 font-medium"
                            : "bg-surface border-border text-text-secondary"
                        }`}
                      >
                        {opt.label}) {opt.text}
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-text-secondary bg-slate-100 p-2.5 rounded">
                    <strong>Explanation:</strong> {q.explanation}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary text-center py-4">
              No questions selected to preview.
            </p>
          )}
        </div>
      )}

      {/* 4. Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-surface border border-border rounded-xl shadow-xs">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            isLoading={isPending}
            onClick={() => handleFormSubmit("draft")}
          >
            Save as Draft
          </Button>

          <Button
            type="button"
            variant="primary"
            isLoading={isPending}
            onClick={() => handleFormSubmit("published")}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            {isEdit ? "Update & Publish Test" : "Publish Test Now"}
          </Button>
        </div>
      </div>
    </div>
  );
}
