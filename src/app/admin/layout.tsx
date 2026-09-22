/**
 * Admin Layout — establishes the structural boundary for all /admin/* routes.
 *
 * This layout wraps every admin page with the AdminShell (header + sidebar +
 * content area). It is the single source of layout truth for the admin panel.
 *
 * Authentication and authorization will be enforced here in Phase 3.
 * For now, the layout only establishes the structural/routing boundary.
 */

import type { Metadata } from "next";
import { AdminShell } from "@/components/shared";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s | Admin | PakSeekers",
  },
  description: "PakSeekers administration panel.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
