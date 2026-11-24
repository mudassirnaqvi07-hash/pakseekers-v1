/**
 * Staff Dashboard — /staff/dashboard
 *
 * Permission-aware workspace showing:
 *   1. Staff profile & assigned permissions breakdown
 *   2. Quick access shortcuts ONLY for permitted modules
 *   3. Content statistics
 *   4. Recent questions and tests (when permitted)
 */

import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  ClipboardList,
  FileCode2,
  FileEdit,
  GraduationCap,
  HelpCircle,
  Layers,
  PlusCircle,
  ShieldCheck,
  BarChart2,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { requireStaff } from "@/server/auth/session";
import {
  getAdminDashboardStats,
  getAdminAllQuestions,
  getAdminAllTests,
} from "@/server/services/content-service";
import {
  PERMISSION_GROUPS,
  getEffectivePermissions,
  hasPermission,
  hasAnyPermission,
} from "@/lib/auth/permissions";
import { PageHeader } from "@/components/shared";
import { Badge, Button, Card, CardHeader, CardContent } from "@/components/ui";

export const metadata: Metadata = {
  title: "Dashboard | Staff | PakSeekers",
};

export default async function StaffDashboardPage() {
  const user = await requireStaff();
  const effectivePermissions = new Set(getEffectivePermissions(user));

  const canViewQuestions = hasPermission(user, "QUESTION_VIEW");
  const canViewTests = hasPermission(user, "TEST_VIEW");

  const [stats, allQuestions, allTests] = await Promise.all([
    getAdminDashboardStats(),
    canViewQuestions ? getAdminAllQuestions() : Promise.resolve([]),
    canViewTests ? getAdminAllTests() : Promise.resolve([]),
  ]);

  const recentQuestions = allQuestions.slice(-5).reverse();
  const recentTests = allTests.slice(-5).reverse();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Welcome, ${user.name}`}
        description={`${user.staffTitle || "Academic Staff"} • ${user.department || "Curriculum & Authoring"}. Your navigation and actions reflect your live assigned permissions.`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info" className="text-xs font-bold uppercase">
              Role: STAFF
            </Badge>
            <Badge variant="success" className="text-xs">
              {effectivePermissions.size} Active Permissions
            </Badge>
          </div>
        }
      />

      {/* Content Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {[
          {
            label: "Exams",
            value: stats.totalExams,
            icon: GraduationCap,
            href: hasPermission(user, "EXAM_VIEW") ? "/staff/exams" : null,
          },
          {
            label: "Subjects",
            value: stats.totalSubjects,
            icon: Layers,
            href: hasPermission(user, "SUBJECT_VIEW") ? "/staff/subjects" : null,
          },
          {
            label: "Topics",
            value: stats.totalTopics,
            icon: BookOpen,
            href: hasPermission(user, "TOPIC_VIEW") ? "/staff/topics" : null,
          },
          {
            label: "Questions",
            value: stats.totalQuestions,
            icon: HelpCircle,
            href: canViewQuestions ? "/staff/questions" : null,
          },
          {
            label: "Tests",
            value: stats.totalTests,
            icon: ClipboardList,
            href: canViewTests ? "/staff/tests" : null,
          },
        ].map((metric) => {
          const Icon = metric.icon;
          const cardBody = (
            <Card className="p-4 hover:border-primary/40 transition-colors h-full">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-text-secondary">{metric.label}</p>
                  <p className="text-2xl font-extrabold text-text-primary mt-1">{metric.value}</p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
            </Card>
          );

          return metric.href ? (
            <Link key={metric.label} href={metric.href}>
              {cardBody}
            </Link>
          ) : (
            <div key={metric.label}>{cardBody}</div>
          );
        })}
      </div>

      {/* Quick Actions — Permitted Modules Only */}
      <Card>
        <CardHeader
          title="Quick Actions"
          description="Shortcuts available based on your current role permissions."
        />
        <CardContent className="p-5 pt-0 flex flex-wrap gap-2.5">
          {hasPermission(user, "EXAM_CREATE") && (
            <Link href="/staff/exams/new">
              <Button size="sm" variant="outline" leftIcon={<PlusCircle className="w-4 h-4" />}>
                New Exam
              </Button>
            </Link>
          )}
          {hasPermission(user, "SUBJECT_CREATE") && (
            <Link href="/staff/subjects/new">
              <Button size="sm" variant="outline" leftIcon={<PlusCircle className="w-4 h-4" />}>
                New Subject
              </Button>
            </Link>
          )}
          {hasPermission(user, "TOPIC_CREATE") && (
            <Link href="/staff/topics/new">
              <Button size="sm" variant="outline" leftIcon={<PlusCircle className="w-4 h-4" />}>
                New Topic
              </Button>
            </Link>
          )}
          {hasPermission(user, "QUESTION_CREATE") && (
            <Link href="/staff/questions/new">
              <Button size="sm" variant="outline" leftIcon={<PlusCircle className="w-4 h-4" />}>
                Add Question
              </Button>
            </Link>
          )}
          {hasPermission(user, "QUESTION_IMPORT") && (
            <Link href="/staff/tests/import">
              <Button size="sm" variant="primary" leftIcon={<FileCode2 className="w-4 h-4" />}>
                Import Quiz JSON
              </Button>
            </Link>
          )}
          {hasPermission(user, "TEST_CREATE") && (
            <Link href="/staff/tests/new">
              <Button size="sm" variant="primary" leftIcon={<PlusCircle className="w-4 h-4" />}>
                Create Test
              </Button>
            </Link>
          )}
          {hasAnyPermission(user, ["ANALYTICS_VIEW", "TEST_PERFORMANCE_VIEW"]) && (
            <Link href="/staff/analytics">
              <Button size="sm" variant="outline" leftIcon={<BarChart2 className="w-4 h-4" />}>
                View Analytics
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>

      {/* Assigned Permissions Overview */}
      <Card>
        <CardHeader
          title="Your Assigned Permissions"
          description="Live server-verified permissions configured by your Administrator."
          actions={
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Enforced Server-Side</span>
            </div>
          }
        />
        <CardContent className="p-5 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {PERMISSION_GROUPS.map((group) => {
            const granted = group.permissions.filter((p) => effectivePermissions.has(p.key));
            return (
              <div
                key={group.id}
                className="p-3.5 rounded-xl bg-background border border-border flex flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-text-primary">{group.title}</span>
                  <Badge variant={granted.length > 0 ? "success" : "default"} className="text-[10px] py-0">
                    {granted.length}/{group.permissions.length}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {group.permissions.map((perm) => {
                    const isGranted = effectivePermissions.has(perm.key);
                    return (
                      <span
                        key={perm.key}
                        className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${
                          isGranted
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-surface text-text-secondary/70 border-border/60"
                        }`}
                      >
                        {isGranted ? (
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700" />
                        ) : (
                          <Lock className="w-2.5 h-2.5" />
                        )}
                        {perm.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Recent Content Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {canViewQuestions && (
          <Card>
            <CardHeader
              title="Recent Questions"
              actions={
                <Link href="/staff/questions" className="text-xs font-semibold text-primary hover:underline">
                  View All →
                </Link>
              }
            />
            <CardContent className="p-5 pt-0 flex flex-col gap-2.5">
              {recentQuestions.length === 0 ? (
                <p className="text-xs text-text-secondary py-4 text-center">No questions created yet.</p>
              ) : (
                recentQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="p-3 rounded-lg bg-background border border-border flex items-center justify-between gap-3"
                  >
                    <p className="text-xs font-medium text-text-primary line-clamp-1">{q.questionText}</p>
                    {hasPermission(user, "QUESTION_EDIT") && (
                      <Link href={`/staff/questions/${q.id}/edit`} className="shrink-0">
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" leftIcon={<FileEdit className="w-3 h-3" />}>
                          Edit
                        </Button>
                      </Link>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {canViewTests && (
          <Card>
            <CardHeader
              title="Recent Tests"
              actions={
                <Link href="/staff/tests" className="text-xs font-semibold text-primary hover:underline">
                  View All →
                </Link>
              }
            />
            <CardContent className="p-5 pt-0 flex flex-col gap-2.5">
              {recentTests.length === 0 ? (
                <p className="text-xs text-text-secondary py-4 text-center">No tests created yet.</p>
              ) : (
                recentTests.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-lg bg-background border border-border flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-text-primary truncate">{t.title}</p>
                      <p className="text-[11px] text-text-secondary capitalize">
                        {t.questionCount} MCQs • {t.status}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Link href={`/staff/tests/${t.id}/preview`}>
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                          Preview
                        </Button>
                      </Link>
                      {hasPermission(user, "TEST_EDIT") && (
                        <Link href={`/staff/tests/${t.id}/edit`}>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                            Edit
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
