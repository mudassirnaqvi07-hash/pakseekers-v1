import type { Metadata } from "next";
import Link from "next/link";
import {
  Download,
  TrendingUp,
  BookOpen,
  PieChart,
} from "lucide-react";
import { requireAdmin } from "@/server/auth/session";
import { getPlatformAnalytics } from "@/server/services/reports-service";
import type {
  SubjectContentDistribution,
  PopularTestStat,
} from "@/server/repositories/report-repository";
import { PageHeader } from "@/components/shared/page-header";
import { Button, Badge, Card } from "@/components/ui";

export const metadata: Metadata = {
  title: "Reports & Analytics — PakSeekers Admin",
  description: "Real-time platform usage metrics, test performance distribution, and content breakdown.",
};

export default async function ReportsPage() {
  await requireAdmin();

  const report = await getPlatformAnalytics();
  const { overview, scoreDistribution, subjectBreakdown, popularTests } = report;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reports & Analytics"
        description="Comprehensive diagnostic metrics and platform telemetry derived directly from MongoDB Atlas."
        actions={
          <a href="/api/admin/reports/export" download>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Download className="w-4 h-4 shrink-0" />}
            >
              Export CSV Report
            </Button>
          </a>
        }
      />

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        <Card className="p-3 sm:p-4 text-center">
          <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
            Total Students
          </p>
          <p className="text-xl sm:text-2xl font-extrabold text-primary mt-1">
            {overview.totalStudents}
          </p>
          <span className="text-[10px] text-success font-medium">
            {overview.activeStudents} active
          </span>
        </Card>

        <Card className="p-3 sm:p-4 text-center">
          <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
            Total Exams
          </p>
          <p className="text-xl sm:text-2xl font-extrabold text-text-primary mt-1">
            {overview.totalExams}
          </p>
          <span className="text-[10px] text-text-secondary font-medium">
            Standardized
          </span>
        </Card>

        <Card className="p-3 sm:p-4 text-center">
          <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
            Curriculum MCQs
          </p>
          <p className="text-xl sm:text-2xl font-extrabold text-secondary mt-1">
            {overview.totalQuestions}
          </p>
          <span className="text-[10px] text-text-secondary font-medium">
            Across {overview.totalSubjects} subjects
          </span>
        </Card>

        <Card className="p-3 sm:p-4 text-center">
          <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
            Tests Created
          </p>
          <p className="text-xl sm:text-2xl font-extrabold text-text-primary mt-1">
            {overview.totalTests}
          </p>
          <span className="text-[10px] text-text-secondary font-medium">
            Practice & Mocks
          </span>
        </Card>

        <Card className="p-3 sm:p-4 text-center">
          <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
            Tests Attempted
          </p>
          <p className="text-xl sm:text-2xl font-extrabold text-text-primary mt-1">
            {overview.totalAttempts}
          </p>
          <span className="text-[10px] text-text-secondary font-medium">
            Recorded attempts
          </span>
        </Card>

        <Card className="p-3 sm:p-4 text-center">
          <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
            Avg Score
          </p>
          <p className="text-xl sm:text-2xl font-extrabold text-accent mt-1">
            {overview.averagePercentage !== null ? `${overview.averagePercentage}%` : "—"}
          </p>
          <span className="text-[10px] text-text-secondary font-medium">
            Platform-wide
          </span>
        </Card>
      </div>

      {/* Main Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <PieChart className="w-4 h-4 text-primary shrink-0" />
              Student Score Performance Bands
            </h3>
            <Badge variant="neutral" className="text-xs">
              {overview.totalAttempts} Attempts
            </Badge>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-success">Distinction (90% – 100%)</span>
                <span>{scoreDistribution.distinction} attempts</span>
              </div>
              <div className="h-2.5 w-full bg-background rounded-full overflow-hidden border border-border">
                <div
                  className="h-full bg-success"
                  style={{
                    width: `${
                      overview.totalAttempts > 0
                        ? (scoreDistribution.distinction / overview.totalAttempts) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-primary">Merit (75% – 89%)</span>
                <span>{scoreDistribution.merit} attempts</span>
              </div>
              <div className="h-2.5 w-full bg-background rounded-full overflow-hidden border border-border">
                <div
                  className="h-full bg-primary"
                  style={{
                    width: `${
                      overview.totalAttempts > 0
                        ? (scoreDistribution.merit / overview.totalAttempts) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-accent">Passing / Average (60% – 74%)</span>
                <span>{scoreDistribution.passing} attempts</span>
              </div>
              <div className="h-2.5 w-full bg-background rounded-full overflow-hidden border border-border">
                <div
                  className="h-full bg-accent"
                  style={{
                    width: `${
                      overview.totalAttempts > 0
                        ? (scoreDistribution.passing / overview.totalAttempts) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-error">Needs Improvement (&lt; 60%)</span>
                <span>{scoreDistribution.needsImprovement} attempts</span>
              </div>
              <div className="h-2.5 w-full bg-background rounded-full overflow-hidden border border-border">
                <div
                  className="h-full bg-error"
                  style={{
                    width: `${
                      overview.totalAttempts > 0
                        ? (scoreDistribution.needsImprovement / overview.totalAttempts) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Subject Content Distribution */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary shrink-0" />
              Subject Question Bank Depth
            </h3>
            <Badge variant="neutral" className="text-xs">
              {subjectBreakdown.length} Subjects
            </Badge>
          </div>

          <div className="divide-y divide-border max-h-72 overflow-y-auto">
            {subjectBreakdown.map((sub: SubjectContentDistribution) => (
              <div key={sub.subjectId} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-text-primary">{sub.subjectTitle}</span>
                  <span className="ml-2 text-[10px] text-text-secondary uppercase">
                    ({sub.examCode})
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-text-secondary">{sub.topicsCount} topics</span>
                  <Badge variant="info" className="text-xs font-mono font-bold">
                    {sub.questionsCount} MCQs
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Most Popular Tests Leaderboard */}
      <Card noPadding className="overflow-hidden">
        <div className="p-4 border-b border-border bg-background/50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary shrink-0" />
            Most Attempted Tests Leaderboard
          </h3>
        </div>

        {popularTests.length === 0 ? (
          <div className="p-8 text-center text-xs text-text-secondary">
            No tests have been completed yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[600px]">
              <thead>
                <tr className="border-b border-border text-text-secondary uppercase tracking-wider bg-background/30">
                  <th className="py-2.5 px-3 sm:px-4">Test Title</th>
                  <th className="py-2.5 px-3 sm:px-4">Type</th>
                  <th className="py-2.5 px-3 sm:px-4 text-center">Attempts</th>
                  <th className="py-2.5 px-3 sm:px-4 text-center">Average Score</th>
                  <th className="py-2.5 px-3 sm:px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {popularTests.map((t: PopularTestStat) => (
                  <tr key={t.testId} className="hover:bg-background/40">
                    <td className="py-3 px-3 sm:px-4 font-semibold text-text-primary">
                      {t.title}
                    </td>
                    <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                      <Badge variant="neutral" className="text-[10px] uppercase">
                        {t.testType}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center font-bold text-primary">
                      {t.attemptsCount}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center">
                      <Badge
                        variant={t.averageScore >= 60 ? "success" : "warning"}
                        className="text-[10px] font-bold"
                      >
                        {t.averageScore}%
                      </Badge>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-right">
                      <Link href={`/admin/tests/${t.testId}/preview`}>
                        <Button size="sm" variant="ghost" className="h-7 text-xs px-2">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
