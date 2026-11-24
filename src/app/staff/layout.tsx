/**
 * Staff Portal Layout — Security boundary for all /staff/* protected routes.
 *
 * Enforces Staff role and active account status via requireStaff().
 * Unauthenticated visitors -> /staff/login.
 * Authenticated Students or Admins -> /access-denied?role=staff-required.
 */

import type { Metadata } from "next";
import { requireStaff } from "@/server/auth/session";
import { StaffShell } from "@/features/staff/components/staff-shell";

export const metadata: Metadata = {
  title: {
    default: "Staff Portal",
    template: "%s | Staff | PakSeekers",
  },
  description: "PakSeekers academic staff curriculum & test authoring portal.",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireStaff();

  return <StaffShell user={user}>{children}</StaffShell>;
}
