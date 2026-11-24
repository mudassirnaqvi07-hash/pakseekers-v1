/**
 * Student Results Alias (/student/results)
 *
 * Enforces student authentication and forwards to /student/attempts.
 */

import { redirect } from "next/navigation";
import { requireStudent } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function StudentResultsPage() {
  await requireStudent("/student/results");
  redirect("/student/attempts");
}
