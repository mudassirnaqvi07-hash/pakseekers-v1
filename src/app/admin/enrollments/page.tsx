import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  GraduationCap,
  Search,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { requireAdmin } from "@/server/auth/session";
import { getAdminEnrollmentRequests } from "@/server/services/enrollment-service";
import { getAllExams } from "@/server/services/content-service";
import { PageHeader } from "@/components/shared/page-header";
import { Button, Card, CardContent } from "@/components/ui";
import { EnrollmentManagementTable } from "@/features/admin/components/enrollment-management-table";
import type { EnrollmentStatus } from "@/types/content";

export const metadata: Metadata = {
  title: "Enrollment Management — PakSeekers Admin",
  description:
    "Review student exam enrollment requests, approve or reject access, and audit enrollment history.",
};

interface AdminEnrollmentsPageProps {
  searchParams: Promise<{
    status?: string;
    examId?: string;
    search?: string;
  }>;
}

const STATUS_TABS: Array<{ key: string; label: string }> = [
  { key: "ALL", label: "All Requests" },
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
  { key: "REVOKED", label: "Revoked" },
];

export default async function AdminEnrollmentsPage({
  searchParams,
}: AdminEnrollmentsPageProps) {
  await requireAdmin();
  const { status, examId, search } = await searchParams;

  const normalizedTab = (status || "ALL").toUpperCase();
  const filterStatus =
    normalizedTab === "PENDING" ||
    normalizedTab === "APPROVED" ||
    normalizedTab === "REJECTED" ||
    normalizedTab === "REVOKED"
      ? (normalizedTab as EnrollmentStatus)
      : undefined;

  const [{ items, counts }, exams] = await Promise.all([
    getAdminEnrollmentRequests({
      status: filterStatus,
      examId: examId && examId !== "ALL" ? examId : undefined,
      search: search || undefined,
    }),
    getAllExams(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Exam Enrollment Management"
        description="Review student enrollment requests, verify eligibility, and approve, reject, or revoke examination access."
      />

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-text-secondary">
                Pending Requests
              </p>
              <p className="text-2xl font-extrabold text-amber-700 mt-1">
                {counts.pending}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-text-secondary">
                Approved Enrollments
              </p>
              <p className="text-2xl font-extrabold text-emerald-700 mt-1">
                {counts.approved}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-text-secondary">
                Rejected
              </p>
              <p className="text-2xl font-extrabold text-rose-700 mt-1">
                {counts.rejected}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-700 flex items-center justify-center">
              <XCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-text-secondary">
                Revoked / History
              </p>
              <p className="text-2xl font-extrabold text-text-primary mt-1">
                {counts.revoked}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Filter Tabs + Search */}
      <Card className="p-4 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
          {STATUS_TABS.map((tab) => {
            const isActive = normalizedTab === tab.key;
            const hrefParams = new URLSearchParams();
            if (tab.key !== "ALL") hrefParams.set("status", tab.key);
            if (examId && examId !== "ALL") hrefParams.set("examId", examId);
            if (search) hrefParams.set("search", search);
            const qs = hrefParams.toString();

            return (
              <Link
                key={tab.key}
                href={`/admin/enrollments${qs ? `?${qs}` : ""}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-primary text-white"
                    : "bg-background text-text-secondary hover:text-text-primary border border-border"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        <form method="GET" className="flex flex-col sm:flex-row items-center gap-3">
          {filterStatus && (
            <input type="hidden" name="status" value={filterStatus} />
          )}

          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              name="search"
              placeholder="Search by student name, email, exam title, or code..."
              defaultValue={search || ""}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <select
            name="examId"
            defaultValue={examId || "ALL"}
            className="px-3 py-2 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-52"
          >
            <option value="ALL">All Examinations</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.code} — {exam.title}
              </option>
            ))}
          </select>

          <Button type="submit" size="sm" variant="primary" className="w-full sm:w-auto">
            Apply Filters
          </Button>
        </form>
      </Card>

      {/* Requests Table */}
      {items.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-text-primary">
              No Enrollment Requests Match These Filters
            </h3>
            <p className="text-xs text-text-secondary max-w-md">
              When students apply for examination programs from the exam catalog, their requests appear here for administrator review.
            </p>
            {normalizedTab !== "ALL" && (
              <Link href="/admin/enrollments">
                <Button size="sm" variant="outline">
                  View All Enrollments
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <EnrollmentManagementTable items={items} />
      )}
    </div>
  );
}
