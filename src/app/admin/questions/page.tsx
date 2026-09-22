import type { Metadata } from "next";
import Link from "next/link";
import { PlusCircle, FileEdit, HelpCircle, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Badge, Button } from "@/components/ui";
import {
  getAllQuestions,
  getAllExams,
  getTopicById,
} from "@/server/repositories/content-repository";
import { deleteQuestionAction } from "@/server/actions/content-actions";
import { DeleteConfirmButton } from "@/features/admin/components/delete-confirm-button";
import type { QuestionDifficulty, QuestionStatus } from "@/types";

export const metadata: Metadata = {
  title: "Question Bank | PakSeekers Admin",
};

interface AdminQuestionsPageProps {
  searchParams: Promise<{
    examId?: string;
    subjectId?: string;
    topicId?: string;
    difficulty?: string;
    status?: string;
    search?: string;
  }>;
}

export default async function AdminQuestionsPage({
  searchParams,
}: AdminQuestionsPageProps) {
  const { examId, subjectId, topicId, difficulty, status, search } =
    await searchParams;

  const exams = getAllExams();
  const questions = getAllQuestions({
    examId,
    subjectId,
    topicId,
    difficulty: difficulty as QuestionDifficulty | undefined,
    status: status as QuestionStatus | undefined,
    search,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Question Bank"
          description="Create, review, search, and manage reusable questions for tests and practice modules."
        />
        <Link href="/admin/questions/new">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            Add Question
          </Button>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Exam Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-text-secondary uppercase">Exam:</span>
            <Link href="/admin/questions">
              <Button
                size="sm"
                variant={!examId ? "primary" : "outline"}
                className="text-xs h-7 px-2"
              >
                All
              </Button>
            </Link>
            {exams.map((e) => (
              <Link key={e.id} href={`/admin/questions?examId=${e.id}`}>
                <Button
                  size="sm"
                  variant={examId?.toLowerCase() === e.id.toLowerCase() ? "primary" : "outline"}
                  className="text-xs h-7 px-2"
                >
                  {e.code}
                </Button>
              </Link>
            ))}
          </div>

          <span className="h-4 w-px bg-border hidden sm:block" />

          {/* Difficulty Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-text-secondary uppercase">Difficulty:</span>
            {["easy", "medium", "hard"].map((diff) => (
              <Link
                key={diff}
                href={`/admin/questions?${examId ? `examId=${examId}&` : ""}difficulty=${diff}`}
              >
                <Button
                  size="sm"
                  variant={difficulty === diff ? "primary" : "outline"}
                  className="text-xs h-7 px-2 capitalize"
                >
                  {diff}
                </Button>
              </Link>
            ))}
          </div>
        </div>

        <div className="text-xs text-text-secondary">
          Showing <strong className="text-text-primary">{questions.length}</strong> questions in bank
        </div>
      </div>

      {/* Questions List */}
      <div className="flex flex-col gap-4">
        {questions.length > 0 ? (
          questions.map((q, idx) => {
            const topic = getTopicById(q.topicId);

            return (
              <div
                key={q.id}
                className="bg-surface border border-border rounded-xl p-6 shadow-xs flex flex-col gap-4 hover:border-slate-300 transition-colors"
              >
                {/* Header info */}
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-border">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-xs uppercase">
                      {q.examId}
                    </span>
                    <span className="text-xs font-semibold text-text-secondary">
                      {q.subjectId.toUpperCase()}
                    </span>
                    <span className="text-xs text-text-secondary">•</span>
                    <span className="text-xs font-medium text-text-primary">
                      {topic?.title || q.topicId}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        q.difficulty === "easy"
                          ? "success"
                          : q.difficulty === "medium"
                          ? "warning"
                          : "error"
                      }
                      dot
                      className="capitalize text-xs"
                    >
                      {q.difficulty}
                    </Badge>
                    <Badge
                      variant={q.status === "published" ? "success" : "draft"}
                      className="capitalize text-xs"
                    >
                      {q.status}
                    </Badge>
                  </div>
                </div>

                {/* Question Stem */}
                <div>
                  <h3 className="text-base font-semibold text-text-primary leading-relaxed">
                    <span className="text-text-secondary mr-2">{idx + 1}.</span>
                    {q.questionText}
                  </h3>
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-background p-3.5 rounded-lg border border-border">
                  {q.options.map((opt) => {
                    const isCorrect = opt.id === q.correctAnswer;
                    return (
                      <div
                        key={opt.id}
                        className={`flex items-start gap-2 p-2 rounded text-xs leading-relaxed ${
                          isCorrect
                            ? "bg-green-100/70 text-green-950 font-medium border border-green-300"
                            : "text-text-secondary"
                        }`}
                      >
                        <span className="font-bold shrink-0">{opt.label})</span>
                        <span className="flex-1">{opt.text}</span>
                        {isCorrect && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-700 shrink-0 mt-0.5" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                <div className="text-xs text-text-secondary bg-slate-50 p-3 rounded-md border border-slate-200/60 leading-relaxed">
                  <strong className="text-text-primary">Explanation:</strong>{" "}
                  {q.explanation}
                </div>

                {/* Footer / Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-[11px] text-text-secondary font-mono">
                    ID: {q.id}
                  </span>

                  <div className="flex items-center gap-2">
                    <Link href={`/admin/questions/${q.id}/edit`}>
                      <Button size="sm" variant="ghost" className="h-8 px-2 text-text-secondary">
                        <FileEdit className="w-3.5 h-3.5 mr-1" />
                        <span className="text-xs">Edit</span>
                      </Button>
                    </Link>
                    <DeleteConfirmButton
                      itemType="question"
                      onDelete={async () => {
                        "use server";
                        return deleteQuestionAction(q.id);
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-surface border border-border rounded-xl p-12 text-center text-text-secondary">
            <HelpCircle className="w-8 h-8 text-text-secondary mx-auto mb-2 opacity-50" />
            <p className="font-medium text-text-primary">No questions found</p>
            <p className="text-xs mt-1">
              Adjust your filters or click &quot;Add Question&quot; to author a new MCQ.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
