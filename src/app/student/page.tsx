/**
 * Student Portal Root (/student)
 *
 * Enforces student authentication and forwards to /student/dashboard.
 */

import { redirect } from "next/navigation";
import { requireStudent } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function StudentRootPage() {
  await requireStudent("/student/dashboard");
  redirect("/student/dashboard");
}
