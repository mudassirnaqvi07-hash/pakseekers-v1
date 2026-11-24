import type { Metadata } from "next";
import Link from "next/link";
import { Download, TrendingUp, BookOpen, PieChart } from "lucide-react";
import { requireStaff } from "@/server/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getPlatformAnalytics } from "@/server/services/reports-service";
import { PageHeader } from "@/components/shared/page-header";
import { Button, Badge, Card, CardContent } from "@/components/ui";

export const metadata: Metadata = {
  title: "Test Analytics & Performance | Staff | PakSeekers",
  description: "Aggregated test performance statistics and curriculum engagement insights.",
};

export default async function StaffAnalyticsPage() {
  const user = await requireStaff(["ANALYTICS_VIEW", "TEST_PERFORMANCE_VIEW"]);
  const canExport = hasPermission(user, "ANALYTICS_VIEW");

  const report = await getPlatformAnalytics();
  const { overview, scoreDistribution, subjectBreakdown, popularTests } = report;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Aggregated Test Analytics"
        description="Anonymized test performance metrics, completion volumes, and curriculum coverage."
        actions={
          canExport ? (
            <a href="/api/staff/reports/export" download>
              <Button variant="primary" size="sm" leftIcon={<Download className="w-4 h-4 shrink-0" />}>
                Export Aggregated CSV
              </Button>
            </a>
          ) : undefined
        }
      />

      {/* Aggregated Telemetry Cards (no individual student PII) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs font-semibold text-text-secondary">Completed Test Attempts</p>
          <p className="text-2xl font-extrabold text-text-primary mt-1">{overview.totalAttempts}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-text-secondary">Overall Average Score</p>
          <p className="text-2xl font-extrabold text-primary mt-1">{overview.platformAverageScore}%</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-text-secondary">Published Tests</p>
          <p className="text-2xl font-extrabold text-text-primary mt-1">{overview.totalTests}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-text-secondary">Total Questions</p>
          <p className="text-2xl font-extrabold text-text-primary mt-1">{overview.totalQuestions}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution */}
        <Card>
          <CardContent className="p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-primary" />
              <h2 className="text-base font-bold text-text-primary">Cohort Score Distribution</h2>
            </div>

            <div className="space-y-3 text-xs">
              {[
                { label: "Distinction (80% - 100%)", count: scoreDistribution.distinction, color: "bg-emerald-600" },
                { label: "Merit (60% - 79%)", count: scoreDistribution.merit, color: "bg-primary" },
                { label: "Pass (40% - 59%)", count: scoreDistribution.passing, color: "bg-amber-500" },
                { label: "Needs Practice (< 40%)", count: scoreDistribution.needsImprovement, color: "bg-error" },
              ].map((tier) => {
                const pct =
                  overview.totalAttempts > 0
                    ? Math.round((tier.count / overview.totalAttempts) * 100)
                    : 0;
                return (
                  <div key={tier.label} className="space-y-1">
                    <div className="flex justify-between font-medium">
                      <span className="text-text-primary">{tier.label}</span>
                      <span className="text-text-secondary">
                        {tier.count} attempts ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-background overflow-hidden">
                      <div className={`h-full ${tier.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Subject Breakdown */}
        <Card>
          <CardContent className="p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <h2 className="text-base font-bold text-text-primary">Subject Question Coverage</h2>
            </div>

            <div className="space-y-2.5">
              {subjectBreakdown.slice(0, 6).map((sub) => (
                <div
                  key={sub.subjectId}
                  className="p-3 rounded-lg bg-background border border-border flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-text-primary">{sub.subjectTitle}</span>
                    <span className="text-text-secondary ml-2">({sub.examCode})</span>
                  </div>
                  <Badge variant="info">{sub.questionCount} MCQs</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Popular Tests Aggregated Performance */}
      <Card>
        <CardContent className="p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="text-base font-bold text-text-primary">Test Performance Leaderboard</h2>
          </div>

          {popularTests.length === 0 ? (
            <p className="text-xs text-text-secondary py-6 text-center">
              No completed student attempts recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-background border-b border-border text-text-secondary uppercase">
                  <tr>
                    <th className="px-4 py-2.5">Test Title</th>
                    <th className="px-4 py-2.5">Total Attempts</th>
                    <th className="px-4 py-2.5">Average Score</th>
                    <th className="px-4 py-2.5 text-right">Preview</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {popularTests.map((t) => (
                    <tr key={t.testId}>
                      <td className="px-4 py-3 font-semibold text-text-primary">{t.testTitle}</td>
                      <td className="px-4 py-3 text-text-secondary">{t.attemptCount}</td>
                      <td className="px-4 py-3">
                        <Badge variant="success">{t.averageScore}%</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/staff/tests/${t.testId}/preview`}
                          className="text-primary font-semibold hover:underline"
                        >
                          Inspect Insights →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
