/**
 * Admin Layout — establishes the structural and security boundary for all /admin/* routes.
 *
 * Enforces admin authorization. Unauthenticated users or non-admin roles
 * are redirected to /admin/login.
 */

import type { Metadata } from "next";
import { AdminShell } from "@/components/shared";
import { requireAdmin } from "@/server/auth/session";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s | Admin | PakSeekers",
  },
  description: "PakSeekers administration panel.",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return <AdminShell>{children}</AdminShell>;
}
