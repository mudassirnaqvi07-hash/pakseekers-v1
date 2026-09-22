"use client";

/**
 * AdminShell — PakSeekers admin application shell.
 *
 * Assembles the AdminHeader, AdminSidebar, and main content area
 * into a complete, responsive admin layout.
 *
 * This is the single component that all admin pages use as their shell.
 * Future pages simply render their content as `children` — they never
 * duplicate layout code.
 *
 * Layout structure:
 *   ┌──────────────────────────────────────┐
 *   │  AdminHeader (top bar, full-width)   │  ← mobile only
 *   ├──────────┬───────────────────────────┤
 *   │          │                           │
 *   │  Sidebar │     Main content area     │
 *   │          │     (scrollable)          │
 *   │          │                           │
 *   └──────────┴───────────────────────────┘
 *
 * Desktop (lg+):
 *   - Sidebar is always visible (no toggle)
 *   - Header is hidden (brand shown inside sidebar)
 *
 * Mobile/tablet:
 *   - Header shows brand + hamburger button
 *   - Sidebar slides in as an off-canvas overlay
 */

import { useState } from "react";
import { AdminHeader } from "./admin-header";
import { AdminSidebar } from "./admin-sidebar";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AdminShellProps {
  children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AdminShell({ children }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Top bar — visible on mobile/tablet; hidden on desktop */}
      <div className="lg:hidden">
        <AdminHeader
          sidebarOpen={sidebarOpen}
          onSidebarToggle={() => setSidebarOpen((prev) => !prev)}
        />
      </div>

      {/* Body: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main content — scrollable independently */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto"
          // Skip navigation landmark for keyboard users
          tabIndex={-1}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
