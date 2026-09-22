/**
 * Admin Dashboard — /admin
 *
 * Real, dynamic content management metrics and shortcuts.
 * Connected to the central persistent content repository.
 */

import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  HelpCircle,
  Layers,
  PlusCircle,
  ArrowRight,
  FileEdit,
} from "lucide-react";
import { Card, CardHeader, Badge, Button } from "@/components/ui";
import { PageHeader } from "@/components/shared";
import {
  getDashboardStats,
  getAllQuestions,
  getAllTests,
} from "@/server/repositories/content-repository";

export const metadata: Metadata = {
  title: "Dashboard | PakSeekers Admin",
};

export default async function AdminDashboardPage() {
  const stats = getDashboardStats();
  const recentQuestions = getAllQuestions().slice(-5).reverse();
  const recentTests = getAllTests().slice(-5).reverse();

  const SUMMARY_CARDS = [
    {
      label: "Total Exams",
      displayValue: stats.totalExams.toString(),
      icon: GraduationCap,
      href: "/admin/exams",
      note: "National entrance exams",
    },
    {
      label: "Total Subjects",
      displayValue: stats.totalSubjects.toString(),
      icon: Layers,
      href: "/admin/subjects",
      note: "Curriculum disciplines",
    },
    {
      label: "Total Topics",
      displayValue: stats.totalTopics.toString(),
      icon: BookOpen,
      href: "/admin/topics",
      note: "High-yield topics",
    },
    {
      label: "Question Bank",
      displayValue: stats.totalQuestions.toString(),
      icon: HelpCircle,
      href: "/admin/questions",
      note: "MCQs across all topics",
    },
    {
      label: "Total Tests",
      displayValue: stats.totalTests.toString(),
      icon: ClipboardList,
      href: "/admin/tests",
      note: `${stats.publishedTests} published, ${stats.draftTests} draft`,
    },
  ];

  const QUICK_ACTIONS = [
    { label: "Create New Exam", href: "/admin/exams/new", icon: GraduationCap },
    { label: "Create Subject", href: "/admin/subjects/new", icon: Layers },
    { label: "Create Topic", href: "/admin/topics/new", icon: BookOpen },
    { label: "Add Question to Bank", href: "/admin/questions/new", icon: HelpCircle },
    { label: "Create Practice Test", href: "/admin/tests/new", icon: ClipboardList },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Content Management Dashboard"
          description="Manage academic entrance exams, curriculum subjects, topic question banks, and student practice tests."
        />
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/admin/tests/new">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Create Test
            </Button>
          </Link>
          <Link href="/admin/questions/new">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Add Question
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <section aria-labelledby="summary-heading">
        <h2
          id="summary-heading"
          className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3"
        >
          Academic Content Metrics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {SUMMARY_CARDS.map((card) => (
            <Link key={card.label} href={card.href} className="group">
              <div className="bg-surface border border-border rounded-lg p-5 flex flex-col gap-3 group-hover:border-primary/40 group-hover:shadow-xs transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-secondary group-hover:text-primary transition-colors">
                    {card.label}
                  </span>
                  <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                    <card.icon className="w-4 h-4" aria-hidden="true" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">
                    {card.displayValue}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">{card.note}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick Actions & Recent Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions Column */}
        <div className="lg:col-span-1">
          <Card noPadding>
            <CardHeader
              title="Content Creation Shortcuts"
              description="Quickly author curriculum resources."
            />
            <div className="px-6 pb-6 flex flex-col gap-2">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center justify-between p-3 rounded-md hover:bg-background border border-transparent hover:border-border transition-colors group"
                >
                  <div className="flex items-center gap-2.5 text-sm font-medium text-text-primary group-hover:text-primary">
                    <action.icon className="w-4 h-4 text-text-secondary group-hover:text-primary shrink-0" />
                    <span>{action.label}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-text-secondary group-hover:translate-x-0.5 group-hover:text-primary transition-all" />
                </Link>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Tests & Questions Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Recent Tests */}
          <Card noPadding>
            <CardHeader
              title="Recent Practice Tests"
              description="Tests created or published for student practice."
              actions={
                <Link href="/admin/tests" className="text-xs font-semibold text-primary hover:underline">
                  View All Tests
                </Link>
              }
            />
            <div className="px-6 pb-6">
              {recentTests.length > 0 ? (
                <div className="flex flex-col divide-y divide-border">
                  {recentTests.map((t) => (
                    <div
                      key={t.id}
                      className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <Link
                          href={`/admin/tests/${t.id}/edit`}
                          className="text-sm font-semibold text-text-primary hover:text-primary truncate block"
                        >
                          {t.title}
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-text-secondary mt-1">
                          <span className="uppercase font-semibold text-primary">
                            {t.examId}
                          </span>
                          <span>•</span>
                          <span>{t.questionCount} Questions</span>
                          <span>•</span>
                          <span>{t.durationMinutes} min</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant={t.status === "published" ? "success" : "draft"}
                          dot
                          className="capitalize text-xs"
                        >
                          {t.status}
                        </Badge>
                        <Link href={`/admin/tests/${t.id}/preview`}>
                          <Button size="sm" variant="ghost" className="h-7 text-xs px-2">
                            Preview
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-secondary py-4 text-center">
                  No tests created yet.
                </p>
              )}
            </div>
          </Card>

          {/* Recent Questions in Bank */}
          <Card noPadding>
            <CardHeader
              title="Recent Questions in Bank"
              description="Latest multiple choice questions added to the repository."
              actions={
                <Link href="/admin/questions" className="text-xs font-semibold text-primary hover:underline">
                  View Question Bank
                </Link>
              }
            />
            <div className="px-6 pb-6">
              {recentQuestions.length > 0 ? (
                <div className="flex flex-col divide-y divide-border">
                  {recentQuestions.map((q) => (
                    <div
                      key={q.id}
                      className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {q.questionText}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-text-secondary mt-1">
                          <span className="uppercase font-semibold text-primary">
                            {q.examId}
                          </span>
                          <span>•</span>
                          <span className="capitalize">{q.subjectId}</span>
                          <span>•</span>
                          <Badge
                            variant={
                              q.difficulty === "easy"
                                ? "success"
                                : q.difficulty === "medium"
                                ? "warning"
                                : "error"
                            }
                            className="text-[10px] px-1.5 py-0 capitalize"
                          >
                            {q.difficulty}
                          </Badge>
                        </div>
                      </div>
                      <Link href={`/admin/questions/${q.id}/edit`}>
                        <Button size="sm" variant="ghost" className="h-7 text-xs px-2" leftIcon={<FileEdit className="w-3.5 h-3.5" />}>
                          Edit
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-secondary py-4 text-center">
                  No questions added yet.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
