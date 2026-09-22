/**
 * AdminHeader — PakSeekers admin panel top bar.
 *
 * Displays the PakSeekers brand, application name, and a mobile
 * sidebar toggle button. Kept intentionally simple — no decorative
 * elements, information-focused design per docs/DESIGN-SYSTEM.md.
 */

import { BookOpen, Menu, X } from "lucide-react";
import { APP_NAME } from "@/lib/config/app";
import { cn } from "@/lib/utils/cn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdminHeaderProps {
  /** Whether the mobile sidebar is currently open. */
  sidebarOpen: boolean;
  /** Callback to toggle the mobile sidebar. */
  onSidebarToggle: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AdminHeader({ sidebarOpen, onSidebarToggle }: AdminHeaderProps) {
  return (
    <header
      className={cn(
        "h-14 shrink-0 bg-surface border-b border-border",
        "flex items-center px-4 gap-3",
        // Ensure header sits above sidebar overlay on mobile
        "relative z-30"
      )}
    >
      {/* Mobile sidebar toggle */}
      <button
        type="button"
        aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={sidebarOpen}
        aria-controls="admin-sidebar"
        onClick={onSidebarToggle}
        className={cn(
          "lg:hidden",
          "w-9 h-9 flex items-center justify-center rounded-md",
          "text-text-secondary hover:text-text-primary hover:bg-background",
          "transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        )}
      >
        {sidebarOpen ? (
          <X className="w-5 h-5" aria-hidden="true" />
        ) : (
          <Menu className="w-5 h-5" aria-hidden="true" />
        )}
      </button>

      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 bg-primary rounded-md flex items-center justify-center shrink-0"
          aria-hidden="true"
        >
          <BookOpen className="w-4 h-4 text-white" aria-hidden="true" />
        </div>
        <span className="font-semibold text-text-primary text-sm tracking-tight">
          {APP_NAME}
          <span className="ml-1.5 text-xs font-normal text-text-secondary hidden sm:inline">
            Admin
          </span>
        </span>
      </div>
    </header>
  );
}
