/**
 * Staff Root Page (/staff)
 *
 * Enforces staff authorization and forwards to /staff/dashboard.
 */

import { redirect } from "next/navigation";
import { requireStaff } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function StaffRootPage() {
  await requireStaff();
  redirect("/staff/dashboard");
}
