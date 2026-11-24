/**
 * Main Public Entry Point (/) — PakSeekers Portal Router.
 *
 * - Authenticated ADMIN   -> /admin/dashboard
 * - Authenticated STAFF   -> /staff/dashboard
 * - Authenticated STUDENT -> /student/dashboard
 * - Unauthenticated users -> Student Portal entry experience (/student/login)
 *
 * Public informational pages (/about, /explore, /exams) remain directly accessible.
 */

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { getDashboardRouteForRole } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(getDashboardRouteForRole(user.role));
  }

  redirect("/student/login");
}
