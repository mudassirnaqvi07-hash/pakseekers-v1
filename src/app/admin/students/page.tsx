import type { Metadata } from "next";
import Link from "next/link";
import { Users, Search, Mail, Eye } from "lucide-react";
import { requireAdmin } from "@/server/auth/session";
import { getStudentsList } from "@/server/services/user-service";
import { PageHeader } from "@/components/shared/page-header";
import { Button, Badge, Card, CardContent } from "@/components/ui";
import { StudentStatusToggle } from "@/features/admin/components/student-status-toggle";
import type { SafeUser } from "@/types";

export const metadata: Metadata = {
  title: "Student Management — PakSeekers Admin",
  description: "Registered student accounts, performance histories, and account status controls.",
};

interface StudentsPageProps {
  searchParams: Promise<{
    search?: string;
    status?: "active" | "suspended" | "all";
    page?: string;
  }>;
}

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  await requireAdmin();
  const { search, status, page } = await searchParams;

  const currentPage = Math.max(1, parseInt(page || "1", 10) || 1);
  const normalizedStatus = status === "active" || status === "suspended" ? status : undefined;

  const result = await getStudentsList({
    search: search || "",
    status: normalizedStatus,
    page: currentPage,
    limit: 15,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Student Management"
        description="Monitor registered student accounts, inspect diagnostic performance, and manage account statuses."
      />

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <form method="GET" className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
            <input
              type="text"
              name="search"
              placeholder="Search by student name or email..."
              defaultValue={search || ""}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              name="status"
              defaultValue={status || "all"}
              className="px-3 py-2 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-auto"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Accounts</option>
              <option value="suspended">Suspended Accounts</option>
            </select>

            <Button size="sm" variant="primary" type="submit" className="h-9 px-4 text-xs font-semibold">
              Filter
            </Button>
          </div>
        </form>
      </Card>

      {/* Students Table */}
      {result.students.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Users className="w-6 h-6 shrink-0" />
            </div>
            <h3 className="text-base font-bold text-text-primary">No Students Found</h3>
            <p className="text-sm text-text-secondary max-w-sm">
              {search
                ? `No student accounts match the query "${search}".`
                : "No student accounts are currently registered on the platform."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card noPadding className="overflow-hidden min-w-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-border bg-background/50 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  <th className="py-3 px-3 sm:px-4">Student</th>
                  <th className="py-3 px-3 sm:px-4">Target Exam</th>
                  <th className="py-3 px-3 sm:px-4">Education Level</th>
                  <th className="py-3 px-3 sm:px-4">City</th>
                  <th className="py-3 px-3 sm:px-4">Status</th>
                  <th className="py-3 px-3 sm:px-4">Registered</th>
                  <th className="py-3 px-3 sm:px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.students.map((student: SafeUser) => {
                  const studentStatus = student.status || "active";

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-background/40 transition-colors group"
                    >
                      <td className="py-3 px-3 sm:px-4">
                        <div className="font-semibold text-text-primary">
                          {student.name}
                        </div>
                        <div className="text-xs text-text-secondary flex items-center gap-1.5 mt-0.5">
                          <Mail className="w-3 h-3 shrink-0 text-text-secondary" />
                          <span className="truncate max-w-[140px] sm:max-w-none">{student.email}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                        {student.targetExam ? (
                          <Badge variant="info" className="text-xs font-bold">
                            {student.targetExam}
                          </Badge>
                        ) : (
                          <span className="text-xs text-text-secondary">Unspecified</span>
                        )}
                      </td>
                      <td className="py-3 px-3 sm:px-4 whitespace-nowrap text-xs text-text-secondary">
                        {student.educationLevel || "—"}
                      </td>
                      <td className="py-3 px-3 sm:px-4 whitespace-nowrap text-xs text-text-secondary">
                        {student.city || "—"}
                      </td>
                      <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          <Badge
                            variant={studentStatus === "active" ? "success" : "error"}
                            className="text-xs capitalize font-semibold"
                          >
                            {studentStatus}
                          </Badge>
                          <span className="text-[10px] text-text-secondary">
                            Max {student.maxDevices ?? 2} dev
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 sm:px-4 whitespace-nowrap text-xs text-text-secondary">
                        {new Date(student.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 justify-end">
                          <StudentStatusToggle
                            studentId={student.id}
                            studentName={student.name}
                            studentEmail={student.email}
                            currentStatus={studentStatus}
                          />
                          <Link href={`/admin/students/${student.id}`}>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-text-secondary hover:text-primary"
                              leftIcon={<Eye className="w-3.5 h-3.5 shrink-0" />}
                            >
                              Details
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {result.totalPages > 1 && (
            <div className="p-3 sm:p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-secondary text-center sm:text-left">
              <span>
                Showing page {result.page} of {result.totalPages} ({result.total} total students)
              </span>
              <div className="flex items-center gap-1.5">
                {result.page > 1 && (
                  <Link
                    href={`/admin/students?page=${result.page - 1}${search ? `&search=${search}` : ""}${
                      status ? `&status=${status}` : ""
                    }`}
                  >
                    <Button size="sm" variant="outline" className="h-7 text-xs px-2.5">
                      Previous
                    </Button>
                  </Link>
                )}
                {result.page < result.totalPages && (
                  <Link
                    href={`/admin/students?page=${result.page + 1}${search ? `&search=${search}` : ""}${
                      status ? `&status=${status}` : ""
                    }`}
                  >
                    <Button size="sm" variant="outline" className="h-7 text-xs px-2.5">
                      Next
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
