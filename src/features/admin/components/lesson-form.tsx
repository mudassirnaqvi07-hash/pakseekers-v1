"use client";

/**
 * Lesson Form — PakSeekers Admin.
 *
 * Full-featured lesson editor with Markdown content preview,
 * learning objectives list builder, topic selector, and draft/published workflow.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Eye,
  Edit3,
  Plus,
  Trash2,
  BookOpen,
} from "lucide-react";
import { Button, Input, Select, Card } from "@/components/ui";
import type { Lesson, Topic } from "@/types";
import {
  createLessonAction,
  updateLessonAction,
} from "@/server/actions/content-actions";

interface LessonFormProps {
  lesson?: Lesson;
  topics: Topic[];
}

export function LessonForm({ lesson, topics }: LessonFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const [content, setContent] = useState(lesson?.content || "");
  const [objectives, setObjectives] = useState<string[]>(
    lesson?.learningObjectives && lesson.learningObjectives.length > 0
      ? lesson.learningObjectives
      : [""]
  );

  function addObjective() {
    setObjectives([...objectives, ""]);
  }

  function removeObjective(index: number) {
    setObjectives(objectives.filter((_, i) => i !== index));
  }

  function updateObjective(index: number, val: string) {
    const updated = [...objectives];
    updated[index] = val;
    setObjectives(updated);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    formData.set("content", content);
    formData.set(
      "learningObjectives",
      JSON.stringify(objectives.map((o) => o.trim()).filter(Boolean))
    );

    startTransition(async () => {
      const result = lesson
        ? await updateLessonAction(lesson.id, formData)
        : await createLessonAction(formData);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/lessons");
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
          <span>Lesson saved successfully! Redirecting...</span>
        </div>
      )}

      {/* Main Details Card */}
      <Card className="p-6">
        <h3 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary shrink-0" />
          Lesson Metadata
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              name="title"
              label="Lesson Title"
              placeholder="e.g. Newton's Laws of Motion & Momentum"
              defaultValue={lesson?.title}
              required
            />
          </div>

          <div>
            <Select
              name="topicId"
              label="Parent Curriculum Topic"
              defaultValue={lesson?.topicId || (topics.length > 0 ? topics[0].id : "")}
              required
            >
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Select
              name="status"
              label="Publication Status"
              defaultValue={lesson?.status || "draft"}
              required
            >
              <option value="draft">Draft (Internal Only)</option>
              <option value="published">Published (Visible to Students)</option>
            </Select>
          </div>

          <div>
            <Input
              name="estimatedReadMinutes"
              label="Estimated Read Time (Minutes)"
              type="number"
              min="1"
              max="180"
              defaultValue={lesson?.estimatedReadMinutes || 10}
              required
            />
          </div>

          <div>
            <Input
              name="order"
              label="Display Order (Sequence)"
              type="number"
              min="1"
              max="999"
              defaultValue={lesson?.order || 1}
              required
            />
          </div>

          <div className="md:col-span-2">
            <Input
              name="summary"
              label="Short Lesson Summary (Abstract)"
              placeholder="Brief 1-2 sentence overview shown in topic lesson lists..."
              defaultValue={lesson?.summary}
              required
            />
          </div>
        </div>
      </Card>

      {/* Learning Objectives Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-text-primary">Learning Objectives</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Specify what students will master upon completing this lesson.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={addObjective}
            leftIcon={<Plus className="w-3.5 h-3.5 shrink-0" />}
          >
            Add Objective
          </Button>
        </div>

        <div className="flex flex-col gap-2.5">
          {objectives.map((obj, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-xs font-mono text-text-secondary w-6 text-right">
                {idx + 1}.
              </span>
              <Input
                value={obj}
                onChange={(e) => updateObjective(idx, e.target.value)}
                placeholder="e.g. Differentiate between elastic and inelastic collisions"
                className="flex-1"
              />
              {objectives.length > 1 && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-error hover:bg-error/10 h-10 px-2"
                  onClick={() => removeObjective(idx)}
                >
                  <Trash2 className="w-4 h-4 shrink-0" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Markdown Content Editor & Preview Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
          <div>
            <h3 className="text-base font-bold text-text-primary">Lesson Content</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Supports GitHub Flavored Markdown, code blocks, lists, and KaTeX formulas.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-background p-1 rounded-md border border-border">
            <button
              type="button"
              onClick={() => setActiveTab("write")}
              className={`px-3 py-1 rounded text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                activeTab === "write"
                  ? "bg-surface text-primary shadow-xs"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 shrink-0" />
              Write
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`px-3 py-1 rounded text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                activeTab === "preview"
                  ? "bg-surface text-primary shadow-xs"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Eye className="w-3.5 h-3.5 shrink-0" />
              Preview
            </button>
          </div>
        </div>

        {activeTab === "write" ? (
          <div>
            <textarea
              name="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={16}
              className="w-full p-4 rounded-md border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed"
              placeholder="# Introduction to Newton's Laws&#10;&#10;Write lesson explanations, definitions, key formulas, and examples here..."
              required
            />
            <p className="text-xs text-text-secondary mt-2">
              Tip: Use headers (#, ##), bullet points, bold (**text**), and blockquotes for high readability.
            </p>
          </div>
        ) : (
          <div className="p-6 rounded-md border border-border bg-background min-h-[360px] prose prose-slate max-w-none text-sm text-text-primary whitespace-pre-wrap leading-relaxed font-sans">
            {content.trim() ? (
              content
            ) : (
              <span className="text-text-secondary italic">
                No content entered yet. Switch back to &apos;Write&apos; tab to add content.
              </span>
            )}
          </div>
        )}
      </Card>

      {/* Form Action Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Link href="/admin/lessons">
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
          {lesson ? "Save Changes" : "Create Lesson"}
        </Button>
      </div>
    </form>
  );
}
