/**
 * AdminHeader — PakSeekers admin panel top bar.
 *
 * Displays the PakSeekers brand, application name, and a mobile
 * sidebar toggle button. Kept intentionally simple — no decorative
 * elements, information-focused design per docs/DESIGN-SYSTEM.md.
 */

import { Menu, X, LogOut } from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { cn } from "@/lib/utils/cn";
import { logoutAdminAction } from "@/server/actions/auth-actions";

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
          "min-h-[44px] min-w-[44px] w-11 h-11 flex items-center justify-center rounded-md shrink-0",
          "text-text-secondary hover:text-text-primary hover:bg-background",
          "transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer"
        )}
      >
        {sidebarOpen ? (
          <X className="w-5 h-5" aria-hidden="true" />
        ) : (
          <Menu className="w-5 h-5" aria-hidden="true" />
        )}
      </button>

      {/* Brand Logo with Official Crest */}
      <BrandLogo variant="horizontal" size="xs" href="/admin/dashboard" subtitle="Admin Console" />

      {/* Right-side actions */}
      <div className="ml-auto flex items-center gap-3">
        <form action={logoutAdminAction}>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-error transition-colors px-2.5 py-1.5 rounded-md hover:bg-background whitespace-nowrap cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </form>
      </div>
    </header>
  );
}
