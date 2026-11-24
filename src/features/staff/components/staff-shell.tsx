"use client";

/**
 * StaffShell — Responsive layout shell for all /staff/* protected routes.
 */

import { useState } from "react";
import type { SafeUser } from "@/types";
import { StaffHeader } from "./staff-header";
import { StaffSidebar } from "./staff-sidebar";

interface StaffShellProps {
  user: SafeUser;
  children: React.ReactNode;
}

export function StaffShell({ user, children }: StaffShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="lg:hidden sticky top-0 z-30">
        <StaffHeader
          userName={user.name}
          sidebarOpen={sidebarOpen}
          onSidebarToggle={() => setSidebarOpen((prev) => !prev)}
        />
      </div>

      <div className="flex flex-1">
        <StaffSidebar
          user={user}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main id="main-content" className="flex-1 min-w-0" tabIndex={-1}>
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
