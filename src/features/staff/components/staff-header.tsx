"use client";

/**
 * StaffHeader — PakSeekers Staff Portal top bar (mobile/tablet + user bar).
 */

import { Menu, X, LogOut } from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { cn } from "@/lib/utils/cn";
import { logoutStaffAction } from "@/server/actions/auth-actions";

export interface StaffHeaderProps {
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
  userName: string;
}

export function StaffHeader({ sidebarOpen, onSidebarToggle, userName }: StaffHeaderProps) {
  return (
    <header
      className={cn(
        "h-14 shrink-0 bg-surface border-b border-border",
        "flex items-center px-4 gap-3 relative z-30"
      )}
    >
      <button
        type="button"
        aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={sidebarOpen}
        aria-controls="staff-sidebar"
        onClick={onSidebarToggle}
        className={cn(
          "lg:hidden min-h-[44px] min-w-[44px] w-11 h-11 flex items-center justify-center rounded-md shrink-0",
          "text-text-secondary hover:text-text-primary hover:bg-background",
          "transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer"
        )}
      >
        {sidebarOpen ? (
          <X className="w-5 h-5" aria-hidden="true" />
        ) : (
          <Menu className="w-5 h-5" aria-hidden="true" />
        )}
      </button>

      <BrandLogo variant="horizontal" size="xs" href="/staff/dashboard" subtitle="Staff Portal" />

      <div className="ml-auto flex items-center gap-3">
        <span className="hidden sm:inline text-xs font-medium text-text-secondary">
          {userName}
        </span>
        <form action={logoutStaffAction}>
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
