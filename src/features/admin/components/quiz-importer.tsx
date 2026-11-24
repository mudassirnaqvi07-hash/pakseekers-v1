"use client";

/**
 * QuizImporter — PakSeekers Admin.
 *
 * Interactive Quiz Importer allowing administrators to paste MCQs in JSON format,
 * validate syntax and question structure, review a rich pedagogical preview, and
 * atomically persist playable quizzes and question bank items.
 */

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  FileCode2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit3,
  Sparkles,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import type {
  Exam,
  Subject,
  Topic,
  Test,
  TestDifficulty,
  TestStatus,
  ActionResult,
} from "@/types";
import {
  parseAndValidateQuizJson,
  type QuizImportValidationResult,
  type NormalizedImportQuiz,
} from "@/lib/validations/quiz-import";
import { Button, Input, Textarea, Select, Badge } from "@/components/ui";

const SAMPLE_QUIZ_JSON = `{
  "title": "Introduction to Programming & Web Basics",
  "description": "Essential diagnostic quiz covering foundational computing and web technologies.",
  "durationMinutes": 15,
  "difficulty": "medium",
  "questions": [
    {
      "question": "Which language is commonly used for interactive front-end web development?",
      "options": [
        "JavaScript",
        "HTML",
        "CSS",
        "SQL"
      ],
      "correctAnswer": "JavaScript",
      "explanation": "JavaScript is the primary scripting language used to provide dynamic and interactive behavior in web browsers."
    },
    {
      "question": "What does CPU stand for in computer architecture?",
      "options": [
        "Central Processing Unit",
        "Computer Personal Unit",
        "Central Program Utility",
        "Control Processing User"
      ],
      "correctAnswer": "Central Processing Unit",
      "explanation": "The Central Processing Unit (CPU) is the primary component of a computer that executes program instructions."
    },
    {
      "question": "Which of the following is an example of an open-source relational database management system?",
      "options": [
        "PostgreSQL",
        "MongoDB",
        "Redis",
        "Neo4j"
      ],
      "correctAnswer": "PostgreSQL",
      "explanation": "PostgreSQL is a powerful, open-source object-relational database management system with strong ACID compliance."
    }
  ]
}`;

interface QuizImporterProps {
  exams: Exam[];
  subjects: Subject[];
  topics: Topic[];
  defaultExamId?: string;
  defaultSubjectId?: string;
  defaultTopicId?: string;
  basePath?: string;
  canPublish?: boolean;
  onSubmit: (input: {
    examId: string;
    subjectId: string;
    topicId: string;
    jsonContent: string;
    title?: string;
    description?: string;
    durationMinutes?: number;
    difficulty?: TestDifficulty;
    status?: TestStatus;
  }) => Promise<ActionResult<Test>>;
}

export function QuizImporter({
  exams,
  subjects,
  topics,
  defaultExamId,
  defaultSubjectId,
  defaultTopicId,
  basePath = "/admin",
  canPublish = true,
  onSubmit,
}: QuizImporterProps) {
  // -------------------------------------------------------------------------
  // 1. Content Hierarchy Selection
  // -------------------------------------------------------------------------
  const initialExam =
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
    defaultSubjectId ||
    (availableSubjects.length > 0 ? availableSubjects[0].id : "");

  const [subjectId, setSubjectId] = useState(initialSubject);

  const availableTopics = useMemo(() => {
    return topics.filter(
      (t) => t.subjectId.toLowerCase() === subjectId.toLowerCase()
    );
  }, [topics, subjectId]);

  const initialTopic =
    defaultTopicId || (availableTopics.length > 0 ? availableTopics[0].id : "");

  const [topicId, setTopicId] = useState(initialTopic);

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

  // -------------------------------------------------------------------------
  // 2. Editor & Preview State
  // -------------------------------------------------------------------------
  const [jsonText, setJsonText] = useState(SAMPLE_QUIZ_JSON);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [validationResult, setValidationResult] =
    useState<QuizImportValidationResult | null>(null);

  // Editable test parameters (prefilled once validated)
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customDuration, setCustomDuration] = useState<number>(15);
  const [customDifficulty, setCustomDifficulty] =
    useState<TestDifficulty>("medium");
  const [targetStatus, setTargetStatus] = useState<TestStatus>(canPublish ? "published" : "draft");

  // Mutation state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [createdTest, setCreatedTest] = useState<Test | null>(null);
  const [, startTransition] = useTransition();

  // -------------------------------------------------------------------------
  // 3. Validation Logic
  // -------------------------------------------------------------------------
  const handleValidateAndPreview = () => {
    setServerError(null);

    const res = parseAndValidateQuizJson(jsonText, {
      examId,
      subjectId,
      topicId,
      defaultDifficulty: customDifficulty,
      status: targetStatus,
    });

    setValidationResult(res);

    if (res.success && res.parsedQuiz) {
      setCustomTitle(res.parsedQuiz.title);
      setCustomDescription(res.parsedQuiz.description);
      setCustomDuration(res.parsedQuiz.durationMinutes);
      setCustomDifficulty(res.parsedQuiz.difficulty);
      setActiveTab("preview");
    } else {
      // Stay on edit tab to highlight errors
      setActiveTab("edit");
    }
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setServerError(null);
    } catch (err) {
      setServerError(
        `Unable to format: ${err instanceof Error ? err.message : "Invalid JSON syntax"}`
      );
    }
  };

  const handleResetSample = () => {
    setJsonText(SAMPLE_QUIZ_JSON);
    setValidationResult(null);
    setServerError(null);
  };

  const handleClear = () => {
    setJsonText("");
    setValidationResult(null);
    setServerError(null);
  };

  // -------------------------------------------------------------------------
  // 4. Submission Handler
  // -------------------------------------------------------------------------
  const handleConfirmImport = async () => {
    if (!examId || !subjectId || !topicId) {
      setServerError("Please select an Exam, Subject, and Topic before importing.");
      return;
    }

    if (!validationResult?.success || !validationResult.parsedQuiz) {
      handleValidateAndPreview();
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    startTransition(async () => {
      try {
        const res = await onSubmit({
          examId,
          subjectId,
          topicId,
          jsonContent: jsonText,
          title: customTitle.trim() || undefined,
          description: customDescription.trim() || undefined,
          durationMinutes: Number(customDuration) || undefined,
          difficulty: customDifficulty,
          status: targetStatus,
        });

        if (res.success) {
          setCreatedTest(res.data);
        } else {
          setServerError(res.error);
        }
      } catch (err) {
        setServerError(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred during quiz import."
        );
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  // Selected topic details
  const selectedTopic = topics.find((t) => t.id === topicId);
  const selectedSubject = subjects.find((s) => s.id === subjectId);
  const selectedExam = exams.find((e) => e.id === examId);

  // -------------------------------------------------------------------------
  // Success Screen
  // -------------------------------------------------------------------------
  if (createdTest) {
    return (
      <div className="bg-surface border border-green-200 rounded-2xl p-8 sm:p-10 shadow-sm max-w-3xl mx-auto flex flex-col items-center text-center gap-6 animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-green-700">
            Import Completed Successfully
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary">
            {createdTest.title}
          </h2>
          <p className="text-sm text-text-secondary max-w-xl mx-auto">
            {createdTest.description}
          </p>
        </div>

        {/* Stats card */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg py-2">
          <div className="p-3 bg-background border border-border rounded-lg">
            <span className="text-[11px] font-semibold text-text-secondary uppercase">Questions</span>
            <p className="text-lg font-bold text-text-primary mt-0.5">{createdTest.questionCount} MCQs</p>
          </div>
          <div className="p-3 bg-background border border-border rounded-lg">
            <span className="text-[11px] font-semibold text-text-secondary uppercase">Duration</span>
            <p className="text-lg font-bold text-text-primary mt-0.5">{createdTest.durationMinutes} Mins</p>
          </div>
          <div className="p-3 bg-background border border-border rounded-lg">
            <span className="text-[11px] font-semibold text-text-secondary uppercase">Difficulty</span>
            <p className="text-lg font-bold text-text-primary mt-0.5 capitalize">{createdTest.difficulty}</p>
          </div>
          <div className="p-3 bg-background border border-border rounded-lg">
            <span className="text-[11px] font-semibold text-text-secondary uppercase">Status</span>
            <p className="text-lg font-bold text-green-600 mt-0.5 capitalize">{createdTest.status}</p>
          </div>
        </div>

        {/* Target curriculum pill */}
        <div className="flex items-center gap-2 text-xs text-text-secondary bg-slate-50 px-4 py-2 rounded-full border border-slate-200">
          <span className="font-bold text-primary uppercase">{selectedExam?.code || createdTest.examId}</span>
          <span>•</span>
          <span className="font-medium capitalize">{selectedSubject?.title || createdTest.subjectId}</span>
          <span>•</span>
          <span className="font-semibold text-text-primary">{selectedTopic?.title || createdTest.topicId}</span>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 w-full sm:w-auto">
          {createdTest.topicId && (
            <Link
              href={`/exams/${createdTest.examId}/topics/${createdTest.topicId}/practice?testId=${createdTest.id}`}
              target="_blank"
              className="w-full sm:w-auto"
            >
              <Button variant="primary" leftIcon={<ExternalLink className="w-4 h-4" />} className="w-full sm:w-auto">
                Take Test as Student
              </Button>
            </Link>
          )}

          <Link href={`${basePath}/tests/${createdTest.id}/preview`} className="w-full sm:w-auto">
            <Button variant="outline" leftIcon={<Eye className="w-4 h-4" />} className="w-full sm:w-auto">
              Preview Test
            </Button>
          </Link>

          <Button
            variant="ghost"
            onClick={() => {
              setCreatedTest(null);
              setValidationResult(null);
              setActiveTab("edit");
            }}
            leftIcon={<RotateCcw className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Import Another Quiz
          </Button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Main Importer View
  // -------------------------------------------------------------------------
  const parsedQuiz: NormalizedImportQuiz | undefined = validationResult?.parsedQuiz;

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      {/* Server Error Alert */}
      {serverError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-error flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="font-semibold">Import Failed: </strong>
            <span>{serverError}</span>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* Step 1: Content Hierarchy Placement */}
      {/* ------------------------------------------------------------------- */}
      <div className="bg-surface border border-border rounded-xl p-6 sm:p-7 shadow-xs flex flex-col gap-5">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                1
              </span>
              Target Academic Placement
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Select which exam, curriculum subject, and granular topic will house this quiz.
            </p>
          </div>
          {selectedTopic && (
            <Badge variant="info" className="hidden sm:inline-flex">
              {selectedTopic.questionCount} existing questions
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Select
              label="Exam"
              value={examId}
              onChange={(e) => handleExamChange(e.target.value)}
              required
            >
              <option value="" disabled>
                Select Exam
              </option>
              {exams.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.code} — {e.title}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Select
              label="Subject"
              value={subjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
              disabled={availableSubjects.length === 0}
              required
            >
              <option value="" disabled>
                {availableSubjects.length === 0
                  ? "No subjects available"
                  : "Select Subject"}
              </option>
              {availableSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Select
              label="Topic"
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              disabled={availableTopics.length === 0}
              required
            >
              <option value="" disabled>
                {availableTopics.length === 0
                  ? "No topics available"
                  : "Select Topic"}
              </option>
              {availableTopics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Step 2: JSON Editor & Preview Tabs */}
      {/* ------------------------------------------------------------------- */}
      <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden flex flex-col">
        {/* Header toolbar */}
        <div className="p-5 sm:px-7 border-b border-border bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                2
              </span>
              MCQ Payload & Verification
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Paste your JSON structure, validate format, and preview parsed questions.
            </p>
          </div>

          {/* Tab buttons */}
          <div className="flex items-center gap-1 bg-surface border border-border rounded-lg p-1">
            <button
              type="button"
              onClick={() => setActiveTab("edit")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === "edit"
                  ? "bg-primary text-white shadow-xs"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>JSON Editor</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (validationResult?.success) {
                  setActiveTab("preview");
                } else {
                  handleValidateAndPreview();
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === "preview"
                  ? "bg-primary text-white shadow-xs"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>
                Preview
                {parsedQuiz ? ` (${parsedQuiz.questions.length})` : ""}
              </span>
            </button>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* TAB 1: JSON Editor */}
        {/* ----------------------------------------------------------------- */}
        {activeTab === "edit" && (
          <div className="p-6 sm:p-7 flex flex-col gap-4">
            {/* Editor Utilities */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-text-secondary font-mono">
                {jsonText.length.toLocaleString()} characters
              </span>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleFormatJson}
                  className="h-7 text-xs px-2.5"
                  title="Format JSON code"
                >
                  Format JSON
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleResetSample}
                  className="h-7 text-xs px-2.5"
                >
                  Load Template
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleClear}
                  className="h-7 text-xs px-2.5 text-text-secondary"
                >
                  Clear
                </Button>
              </div>
            </div>

            {/* Code Textarea */}
            <div className="relative">
              <textarea
                id="json-quiz-editor"
                rows={16}
                value={jsonText}
                onChange={(e) => {
                  setJsonText(e.target.value);
                  if (validationResult) setValidationResult(null);
                }}
                placeholder="Paste your JSON quiz payload here..."
                className="w-full font-mono text-xs leading-relaxed p-4 rounded-xl border border-border bg-slate-900 text-emerald-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-y shadow-inner selection:bg-emerald-800 selection:text-white"
                spellCheck={false}
              />
            </div>

            {/* Validation Feedback Banner */}
            {validationResult && !validationResult.success && (
              <div className="p-4 rounded-xl bg-red-50/90 border border-red-200 text-xs text-red-950 flex flex-col gap-2">
                <div className="flex items-center gap-2 font-bold text-error">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Validation Issues Detected:</span>
                </div>

                {validationResult.syntaxError && (
                  <p className="font-mono bg-white/70 p-2 rounded border border-red-200">
                    {validationResult.syntaxError}
                  </p>
                )}

                {validationResult.globalErrors && (
                  <ul className="list-disc list-inside space-y-1">
                    {validationResult.globalErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}

                {validationResult.questionErrors && (
                  <div className="flex flex-col gap-1.5 mt-1 max-h-48 overflow-y-auto pr-1">
                    {validationResult.questionErrors.map((qe) => (
                      <div
                        key={qe.index}
                        className="bg-white/90 p-2 rounded border border-red-200/80 flex flex-col gap-0.5"
                      >
                        <div className="font-semibold text-text-primary">
                          Question #{qe.index}
                          {qe.questionText ? `: "${qe.questionText.slice(0, 50)}..."` : ""}
                        </div>
                        <ul className="list-disc list-inside text-error space-y-0.5">
                          {qe.errors.map((e, idx) => (
                            <li key={idx}>{e}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Validate & Preview Action Bar */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-text-secondary">
                Supported formats: MCQ with options array and verified correct answer.
              </span>

              <Button
                variant="primary"
                onClick={handleValidateAndPreview}
                leftIcon={<Eye className="w-4 h-4" />}
              >
                Validate & Preview
              </Button>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* TAB 2: Readable Pedagogical Preview */}
        {/* ----------------------------------------------------------------- */}
        {activeTab === "preview" && (
          <div className="p-6 sm:p-7 flex flex-col gap-6">
            {parsedQuiz ? (
              <>
                {/* Preview Metadata Card */}
                <div className="p-5 bg-background rounded-xl border border-border flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                    <div>
                      <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                        Validated Quiz Metadata
                      </span>
                      <h3 className="text-lg font-bold text-text-primary mt-0.5">
                        {customTitle || parsedQuiz.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="success" dot>
                        {parsedQuiz.questions.length} MCQs Validated
                      </Badge>
                      <Badge variant="info">
                        ~{customDuration} Minutes
                      </Badge>
                    </div>
                  </div>

                  {/* Overridable Parameters */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Quiz Title"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      required
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Duration (minutes)"
                        type="number"
                        min={1}
                        value={customDuration}
                        onChange={(e) => setCustomDuration(Number(e.target.value))}
                        required
                      />

                      <Select
                        label="Difficulty"
                        value={customDifficulty}
                        onChange={(e) =>
                          setCustomDifficulty(e.target.value as TestDifficulty)
                        }
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                        <option value="mixed">Mixed</option>
                      </Select>
                    </div>
                  </div>

                  <Textarea
                    label="Description"
                    rows={2}
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder="Short summary of what this quiz covers..."
                  />

                  <div className="flex items-center gap-4 text-xs text-text-secondary pt-1">
                    {canPublish && (
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-text-primary">
                        <input
                          type="radio"
                          name="quizStatus"
                          value="published"
                          checked={targetStatus === "published"}
                          onChange={() => setTargetStatus("published")}
                          className="text-primary focus:ring-primary"
                        />
                        <span>Publish Immediately (Available to Students)</span>
                      </label>
                    )}

                    <label className="flex items-center gap-2 cursor-pointer font-medium text-text-primary">
                      <input
                        type="radio"
                        name="quizStatus"
                        value="draft"
                        checked={targetStatus === "draft"}
                        onChange={() => setTargetStatus("draft")}
                        className="text-primary focus:ring-primary"
                      />
                      <span>Save as Draft{!canPublish ? " (Publish requires TEST_PUBLISH)" : ""}</span>
                    </label>
                  </div>
                </div>

                {/* Parsed Questions List */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-text-primary uppercase tracking-wide">
                      Parsed Questions Breakdown ({parsedQuiz.questions.length})
                    </h4>
                    <span className="text-xs text-text-secondary">
                      Correct answer highlighted in green
                    </span>
                  </div>

                  <div className="flex flex-col gap-4">
                    {parsedQuiz.questions.map((q, idx) => (
                      <div
                        key={idx}
                        className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col gap-3 hover:border-slate-300 transition-colors"
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                          <h5 className="text-sm font-semibold text-text-primary leading-relaxed">
                            <span className="text-text-secondary mr-2">{idx + 1}.</span>
                            {q.questionText}
                          </h5>
                          <Badge
                            variant={
                              q.difficulty === "easy"
                                ? "success"
                                : q.difficulty === "medium"
                                ? "warning"
                                : "error"
                            }
                            className="capitalize text-[11px] shrink-0"
                          >
                            {q.difficulty}
                          </Badge>
                        </div>

                        {/* Options Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-background p-3 rounded-lg border border-border">
                          {q.options.map((opt) => {
                            const isCorrect = opt.id === q.correctAnswer;
                            return (
                              <div
                                key={opt.id}
                                className={`flex items-start gap-2 p-2 rounded text-xs leading-relaxed transition-all ${
                                  isCorrect
                                    ? "bg-green-100/80 text-green-950 font-semibold border border-green-300 shadow-xs"
                                    : "text-text-secondary hover:text-text-primary"
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

                        {/* Explanation Box */}
                        <div className="text-xs text-text-secondary bg-slate-50 p-3 rounded-md border border-slate-200/60 leading-relaxed">
                          <strong className="text-text-primary">Pedagogical Explanation: </strong>
                          {q.explanation}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Import Confirmation Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("edit")}
                    leftIcon={<Edit3 className="w-4 h-4" />}
                  >
                    Back to JSON Editor
                  </Button>

                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleConfirmImport}
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                    leftIcon={<Sparkles className="w-4 h-4" />}
                  >
                    {isSubmitting
                      ? "Importing Quiz..."
                      : `Confirm & Import ${parsedQuiz.questions.length} MCQs`}
                  </Button>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-text-secondary flex flex-col items-center gap-2">
                <FileCode2 className="w-8 h-8 opacity-40 text-text-secondary" />
                <p className="font-semibold text-text-primary">No validated preview available</p>
                <p className="text-xs">
                  Switch to the JSON Editor and click &quot;Validate & Preview&quot; to review parsed questions.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab("edit")}
                  className="mt-2"
                >
                  Open JSON Editor
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
