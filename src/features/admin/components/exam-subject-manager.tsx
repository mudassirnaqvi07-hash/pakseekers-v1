"use client";

/**
 * ExamSubjectManager — PakSeekers Admin.
 *
 * Provides many-to-many subject management for examinations:
 * 1. Associate reusable subjects from other tracks.
 * 2. Configure display order in the curriculum.
 * 3. Disassociate subjects without deleting the underlying subject entity.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Layers,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  BookOpen,
} from "lucide-react";
import type { Subject, Exam } from "@/types";
import { Button, Badge, Card, CardContent } from "@/components/ui";
import {
  assignSubjectToExamAction,
  removeSubjectFromExamAction,
  updateExamSubjectOrderAction,
} from "@/server/actions/content-actions";

interface ExamSubjectManagerProps {
  exam: Exam;
  currentSubjects: Subject[];
  allAvailableSubjects: Subject[];
}

export function ExamSubjectManager({
  exam,
  currentSubjects,
  allAvailableSubjects,
}: ExamSubjectManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const associatedSubjectIds = new Set(currentSubjects.map((s) => s.id));
  const unassociatedSubjects = allAvailableSubjects.filter(
    (s) => !associatedSubjectIds.has(s.id)
  );

  const handleAddSubject = () => {
    if (!selectedSubjectId) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await assignSubjectToExamAction(exam.id, selectedSubjectId);
      if (res.success) {
        setSelectedSubjectId("");
        setFeedback({ type: "success", text: "Subject associated successfully." });
        router.refresh();
      } else {
        setFeedback({ type: "error", text: res.error || "Failed to associate subject." });
      }
    });
  };

  const handleRemoveSubject = (subjectId: string, subjectTitle: string) => {
    if (!confirm(`Disassociate "${subjectTitle}" from ${exam.code}? The subject entity and questions will NOT be deleted.`)) {
      return;
    }
    setFeedback(null);
    startTransition(async () => {
      const res = await removeSubjectFromExamAction(exam.id, subjectId);
      if (res.success) {
        setFeedback({ type: "success", text: "Subject disassociated successfully." });
        router.refresh();
      } else {
        setFeedback({ type: "error", text: res.error || "Failed to disassociate subject." });
      }
    });
  };

  const handleMoveOrder = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentSubjects.length) return;

    const reordered = [...currentSubjects];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const orderPayload = reordered.map((sub, idx) => ({
      subjectId: sub.id,
      displayOrder: idx + 1,
    }));

    setFeedback(null);
    startTransition(async () => {
      const res = await updateExamSubjectOrderAction(exam.id, orderPayload);
      if (res.success) {
        router.refresh();
      } else {
        setFeedback({ type: "error", text: res.error || "Failed to reorder subjects." });
      }
    });
  };

  return (
    <Card className="shadow-xs border-border">
      <CardContent className="p-5 sm:p-6 flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              <h3 className="text-base font-bold text-text-primary">
                Curriculum Subjects ({currentSubjects.length})
              </h3>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Associate reusable subjects, configure syllabus sequence ordering, or disassociate disciplines.
            </p>
          </div>
          <Badge variant="info" className="text-xs self-start sm:self-auto font-semibold">
            {exam.code} Syllabus
          </Badge>
        </div>

        {feedback && (
          <div
            className={`p-3 rounded-lg text-xs font-medium ${
              feedback.type === "success"
                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                : "bg-error/10 text-error border border-error/20"
            }`}
          >
            {feedback.text}
          </div>
        )}

        {/* Association Form */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3.5 rounded-lg bg-surface-hover/60 border border-border">
          <div className="flex-1 min-w-0">
            <label htmlFor="associate-subject" className="block text-xs font-semibold text-text-secondary mb-1">
              Associate an Existing Subject from Platform Question Bank
            </label>
            <select
              id="associate-subject"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full text-xs rounded-lg border border-border bg-surface px-3 py-2 text-text-primary focus:outline-hidden focus:ring-1 focus:ring-primary"
              disabled={isPending || unassociatedSubjects.length === 0}
            >
              <option value="">
                {unassociatedSubjects.length === 0
                  ? "All existing subjects are already associated"
                  : "-- Select a subject to associate --"}
              </option>
              {unassociatedSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} (ID: {s.id}) • {s.totalTopics} Topics
                </option>
              ))}
            </select>
          </div>
          <Button
            type="button"
            size="sm"
            variant="primary"
            disabled={!selectedSubjectId || isPending}
            isLoading={isPending}
            onClick={handleAddSubject}
            className="self-end sm:self-auto shrink-0 h-9"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Associate Subject
          </Button>
        </div>

        {/* Associated Subjects List */}
        <div className="flex flex-col gap-2">
          {currentSubjects.length > 0 ? (
            currentSubjects.map((subject, idx) => (
              <div
                key={subject.id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg bg-surface border border-border hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="w-8 h-8 rounded-md bg-surface-hover text-text-secondary flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-text-primary truncate">
                        {subject.title}
                      </h4>
                      <Badge variant="default" className="text-[10px] py-0 font-medium">
                        {subject.totalTopics} Topics
                      </Badge>
                    </div>
                    <p className="text-[11px] text-text-secondary truncate mt-0.5">
                      ID: {subject.id}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0 || isPending}
                    onClick={() => handleMoveOrder(idx, "up")}
                    className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move Up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === currentSubjects.length - 1 || isPending}
                    onClick={() => handleMoveOrder(idx, "down")}
                    className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move Down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleRemoveSubject(subject.id, subject.title)}
                    className="text-text-secondary hover:text-error hover:bg-error/10 text-xs h-7 px-2 ml-1"
                    leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-xs text-text-secondary border border-dashed border-border rounded-lg">
              No subjects currently associated with this examination.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
