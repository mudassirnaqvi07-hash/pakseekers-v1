"use client";

/**
 * Mock Test Form — PakSeekers Admin.
 *
 * Configures full-length entrance exam simulations with negative marking,
 * timed countdowns, subject-distributed questions, and passing thresholds.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Award,
  HelpCircle,
  Search,
} from "lucide-react";
import { Button, Input, Select, Card, Badge } from "@/components/ui";
import type { Test, Exam, Subject, Question } from "@/types";
import {
  createMockTestAction,
  updateMockTestAction,
} from "@/server/actions/content-actions";

interface MockTestFormProps {
  test?: Test;
  exams: Exam[];
  subjects: Subject[];
  questions: Question[];
}

export function MockTestForm({
  test,
  exams,
  subjects,
  questions,
}: MockTestFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [selectedExamId, setSelectedExamId] = useState(
    test?.examId || (exams.length > 0 ? exams[0].id : "")
  );

  const [negativeMarking, setNegativeMarking] = useState<boolean>(
    Boolean(test?.negativeMarking)
  );

  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>(
    test?.questionIds || []
  );

  const [searchFilter, setSearchFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");

  const filteredSubjects = subjects.filter(
    (s) => !selectedExamId || s.examId === selectedExamId
  );

  const availableQuestions = questions.filter((q) => {
    // Check subject filter if set
    if (subjectFilter !== "all" && q.subjectId !== subjectFilter) {
      return false;
    }
    // Text search
    if (searchFilter) {
      const match =
        q.questionText.toLowerCase().includes(searchFilter.toLowerCase()) ||
        q.id.toLowerCase().includes(searchFilter.toLowerCase());
      if (!match) return false;
    }
    return true;
  });

  function toggleQuestion(id: string) {
    if (selectedQuestionIds.includes(id)) {
      setSelectedQuestionIds(selectedQuestionIds.filter((qId) => qId !== id));
    } else {
      setSelectedQuestionIds([...selectedQuestionIds, id]);
    }
  }

  function selectAllFiltered() {
    const newIds = new Set([
      ...selectedQuestionIds,
      ...availableQuestions.map((q) => q.id),
    ]);
    setSelectedQuestionIds(Array.from(newIds));
  }

  function clearAllFiltered() {
    const toRemove = new Set(availableQuestions.map((q) => q.id));
    setSelectedQuestionIds(selectedQuestionIds.filter((id) => !toRemove.has(id)));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (selectedQuestionIds.length === 0) {
      setError("Please select at least 1 question for this mock exam.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.set("questionIds", JSON.stringify(selectedQuestionIds));
    formData.set("negativeMarking", negativeMarking ? "true" : "false");

    startTransition(async () => {
      const result = test
        ? await updateMockTestAction(test.id, formData)
        : await createMockTestAction(formData);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/mock-tests");
        router.refresh();
      }, 800);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <div className="p-4 rounded-md bg-error/10 border border-error/20 flex items-center gap-3 text-sm text-error">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-md bg-success/10 border border-success/20 flex items-center gap-3 text-sm text-success">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>Mock exam saved successfully! Redirecting...</span>
        </div>
      )}

      {/* Main Configuration Card */}
      <Card className="p-6">
        <h3 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-primary shrink-0" />
          Mock Examination Specifications
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              name="title"
              label="Mock Exam Title"
              placeholder="e.g. MDCAT National Comprehensive Grand Mock #1"
              defaultValue={test?.title}
              required
            />
          </div>

          <div>
            <Select
              name="examId"
              label="Target Entrance Examination"
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              required
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title} ({ex.code})
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Select
              name="status"
              label="Publish Status"
              defaultValue={test?.status || "draft"}
              required
            >
              <option value="draft">Draft (Testing Only)</option>
              <option value="published">Published (Active for Students)</option>
            </Select>
          </div>

          <div>
            <Input
              name="durationMinutes"
              label="Duration (Minutes)"
              type="number"
              min="10"
              max="360"
              defaultValue={test?.durationMinutes || 150}
              required
            />
          </div>

          <div>
            <Input
              name="totalMarks"
              label="Total Marks"
              type="number"
              min="1"
              max="1000"
              defaultValue={test?.totalMarks || 200}
              required
            />
          </div>

          <div>
            <Input
              name="passingMarks"
              label="Passing Marks / Benchmark"
              type="number"
              min="1"
              max="1000"
              defaultValue={test?.passingMarks || 110}
              required
            />
          </div>

          <div className="flex flex-col justify-center">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Marking Scheme
            </label>
            <label className="flex items-center gap-2.5 text-sm font-medium text-text-primary cursor-pointer select-none">
              <input
                type="checkbox"
                checked={negativeMarking}
                onChange={(e) => setNegativeMarking(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
              <span>Enforce Negative Marking (-0.25 penalty per wrong answer)</span>
            </label>
          </div>

          <div className="md:col-span-2">
            <Input
              name="description"
              label="Instructions & Syllabus Notice"
              placeholder="e.g. Full syllabus simulation strictly following PMDC 2026 guidelines. No calculators allowed."
              defaultValue={test?.description}
              required
            />
          </div>
        </div>
      </Card>

      {/* Question Bank Selection Card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-border">
          <div>
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary shrink-0" />
              Question Assembly ({selectedQuestionIds.length} Selected)
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Select questions from the curriculum database to assemble this mock exam paper.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={selectAllFiltered}
            >
              Select All Visible
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={clearAllFiltered}
              className="text-text-secondary"
            >
              Deselect All
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="relative">
            <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
            <input
              type="text"
              placeholder="Search question text or code..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Subjects ({questions.length})</option>
            {filteredSubjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.title}
              </option>
            ))}
          </select>
        </div>

        {/* Questions List */}
        <div className="max-h-96 overflow-y-auto divide-y divide-border border border-border rounded-md bg-background/50">
          {availableQuestions.length === 0 ? (
            <div className="p-8 text-center text-xs text-text-secondary">
              No questions found matching your filter.
            </div>
          ) : (
            availableQuestions.map((q) => {
              const isSelected = selectedQuestionIds.includes(q.id);
              const subject = subjects.find((s) => s.id === q.subjectId);

              return (
                <div
                  key={q.id}
                  onClick={() => toggleQuestion(q.id)}
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
                    className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] bg-border/60 text-text-secondary px-1.5 py-0.5 rounded">
                        #{q.id.slice(-6)}
                      </span>
                      {subject && (
                        <span className="text-[11px] font-semibold text-primary">
                          {subject.title}
                        </span>
                      )}
                      <Badge
                        variant={
                          q.difficulty === "easy"
                            ? "success"
                            : q.difficulty === "hard"
                            ? "error"
                            : "warning"
                        }
                        className="text-[10px] py-0 px-1.5 uppercase"
                      >
                        {q.difficulty}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-primary line-clamp-2 leading-relaxed font-medium">
                      {q.questionText}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Form Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Link href="/admin/mock-tests">
          <Button
            type="button"
            variant="outline"
            leftIcon={<ArrowLeft className="w-4 h-4 shrink-0" />}
          >
            Cancel
          </Button>
        </Link>

        <Button
          type="submit"
          variant="primary"
          isLoading={isPending}
          className="px-8 font-semibold"
        >
          {test ? "Save Mock Exam" : "Create Mock Exam"}
        </Button>
      </div>
    </form>
  );
}
