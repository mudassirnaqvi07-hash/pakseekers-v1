import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  Eye,
} from "lucide-react";
import { requireAdmin } from "@/server/auth/session";
import { getAllQuestionReports } from "@/server/services/reports-service";
import { PageHeader } from "@/components/shared/page-header";
import { Button, Badge, Card, CardContent } from "@/components/ui";

export const metadata: Metadata = {
  title: "Question Reports — PakSeekers Admin",
  description: "Student-reported question issues, erroneous answer keys, and syllabus discrepancies.",
};

interface QuestionReportsPageProps {
  searchParams: Promise<{
    status?: "pending" | "under_review" | "resolved" | "rejected" | "all";
  }>;
}

export default async function QuestionReportsPage({ searchParams }: QuestionReportsPageProps) {
  await requireAdmin();
  const { status } = await searchParams;

  const normalizedStatus =
    status === "pending" ||
    status === "under_review" ||
    status === "resolved" ||
    status === "rejected"
      ? status
      : undefined;

  const reports = await getAllQuestionReports(
    normalizedStatus ? { status: normalizedStatus } : undefined
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Question Bug & Issue Reports"
        description="Review student-flagged question discrepancies, verify textbook citations, and resolve question errors."
      />

      {/* Filter Tabs */}
      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/question-reports">
            <Button
              size="sm"
              variant={!status || status === "all" ? "primary" : "ghost"}
              className="h-8 text-xs px-3"
            >
              All Reports
            </Button>
          </Link>
          <Link href="/admin/question-reports?status=pending">
            <Button
              size="sm"
              variant={status === "pending" ? "primary" : "ghost"}
              className="h-8 text-xs px-3"
            >
              Pending
            </Button>
          </Link>
          <Link href="/admin/question-reports?status=under_review">
            <Button
              size="sm"
              variant={status === "under_review" ? "primary" : "ghost"}
              className="h-8 text-xs px-3"
            >
              Under Review
            </Button>
          </Link>
          <Link href="/admin/question-reports?status=resolved">
            <Button
              size="sm"
              variant={status === "resolved" ? "primary" : "ghost"}
              className="h-8 text-xs px-3"
            >
              Resolved
            </Button>
          </Link>
          <Link href="/admin/question-reports?status=rejected">
            <Button
              size="sm"
              variant={status === "rejected" ? "primary" : "ghost"}
              className="h-8 text-xs px-3"
            >
              Rejected
            </Button>
          </Link>
        </div>
      </Card>

      {/* Reports Table */}
      {reports.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
            </div>
            <h3 className="text-base font-bold text-text-primary">No Reports Found</h3>
            <p className="text-sm text-text-secondary max-w-sm">
              {normalizedStatus
                ? `There are currently no reports with status '${normalizedStatus}'.`
                : "No question issue reports have been submitted by students."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card noPadding className="overflow-hidden min-w-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-border bg-background/50 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  <th className="py-3 px-3 sm:px-4">Date Reported</th>
                  <th className="py-3 px-3 sm:px-4">Reason Category</th>
                  <th className="py-3 px-3 sm:px-4">Student Description</th>
                  <th className="py-3 px-3 sm:px-4">Reported By</th>
                  <th className="py-3 px-3 sm:px-4">Status</th>
                  <th className="py-3 px-3 sm:px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-background/40 transition-colors group"
                  >
                    <td className="py-3 px-3 sm:px-4 whitespace-nowrap text-xs text-text-secondary">
                      {new Date(report.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                      <Badge
                        variant={
                          report.reason === "wrong_answer"
                            ? "error"
                            : report.reason === "typo"
                            ? "warning"
                            : "info"
                        }
                        className="text-[11px] capitalize"
                      >
                        {report.reason.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 max-w-md">
                      <p className="text-xs text-text-primary line-clamp-2 leading-relaxed">
                        {report.description}
                      </p>
                      {report.adminNotes && (
                        <p className="text-[11px] text-text-secondary italic mt-0.5 line-clamp-1">
                          Admin: {report.adminNotes}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-xs text-text-secondary">
                      {report.studentEmail || report.userEmail || "Anonymous Student"}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge
                        variant={
                          report.status === "resolved"
                            ? "success"
                            : report.status === "under_review"
                            ? "warning"
                            : report.status === "rejected"
                            ? "neutral"
                            : "error"
                        }
                        className="text-xs uppercase font-bold"
                      >
                        {report.status.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Link href={`/admin/question-reports/${report.id}`}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-text-secondary hover:text-primary"
                          leftIcon={<Eye className="w-3.5 h-3.5 shrink-0" />}
                        >
                          Review & Resolve
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
