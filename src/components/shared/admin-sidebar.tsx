"use client";

/**
 * AdminSidebar — PakSeekers admin panel navigation.
 *
 * Grouped navigation with Lucide icons, active-route highlighting,
 * and responsive behaviour:
 *   - Desktop (lg+): persistent, always visible
 *   - Mobile/Tablet: off-canvas panel, controlled by parent via isOpen/onClose
 *
 * Active route is detected via usePathname() and exact/prefix matching.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart2,
  BookOpen,
  ClipboardList,
  FileText,
  Flag,
  HelpCircle,
  LayoutDashboard,
  Layers,
  Settings,
  Timer,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

// ---------------------------------------------------------------------------
// Navigation structure
// ---------------------------------------------------------------------------

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  /** Use exact match for the root dashboard route */
  exact?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
        exact: true,
      },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Tests", href: "/admin/tests", icon: ClipboardList },
      { label: "Sections", href: "/admin/sections", icon: Layers },
      { label: "Topics", href: "/admin/topics", icon: BookOpen },
      { label: "Lessons", href: "/admin/lessons", icon: FileText },
      { label: "Questions", href: "/admin/questions", icon: HelpCircle },
      { label: "Mock Tests", href: "/admin/mock-tests", icon: Timer },
    ],
  },
  {
    label: "Users",
    items: [
      { label: "Students", href: "/admin/students", icon: Users },
    ],
  },
  {
    label: "Reports",
    items: [
      { label: "Reports", href: "/admin/reports", icon: BarChart2 },
      {
        label: "Question Reports",
        href: "/admin/question-reports",
        icon: Flag,
      },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdminSidebarProps {
  /** Whether the sidebar is open (mobile only). */
  isOpen: boolean;
  /** Called when the sidebar should close (mobile only). */
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* --------------- Mobile overlay backdrop --------------- */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-text-primary/20 lg:hidden"
          aria-hidden="true"
          onClick={onClose}
        />
      )}

      {/* --------------- Sidebar panel --------------- */}
      <aside
        id="admin-sidebar"
        aria-label="Admin navigation"
        className={cn(
          // Positioning
          "fixed inset-y-0 left-0 z-40",
          // Dimensions
          "w-60 flex flex-col",
          // Visual
          "bg-primary",
          // Desktop: always visible; Mobile: slide in/out
          "lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "transition-transform duration-200 ease-in-out",
          // Ensure it doesn't interfere with desktop layout
          "lg:transition-none"
        )}
      >
        {/* Brand mark — desktop only (mobile shows in header) */}
        <div className="h-14 shrink-0 hidden lg:flex items-center px-4 gap-2.5 border-b border-white/10">
          <div
            className="w-7 h-7 bg-white/15 rounded-md flex items-center justify-center shrink-0"
            aria-hidden="true"
          >
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <span className="font-semibold text-white text-sm tracking-tight">
            PakSeekers
            <span className="ml-1.5 text-xs font-normal text-white/60">
              Admin
            </span>
          </span>
        </div>

        {/* Navigation */}
        <nav
          className="flex-1 overflow-y-auto py-4 px-3"
          aria-label="Primary navigation"
        >
          <ul role="list" className="flex flex-col gap-5">
            {NAV_GROUPS.map((group) => (
              <li key={group.label}>
                <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/40 select-none">
                  {group.label}
                </p>
                <ul role="list" className="flex flex-col gap-0.5">
                  {group.items.map((item) => {
                    const isActive = item.exact
                      ? pathname === item.href
                      : pathname === item.href ||
                        pathname.startsWith(item.href + "/");

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          aria-current={isActive ? "page" : undefined}
                          className={cn(
                            "flex items-center gap-2.5 px-2.5 py-2 rounded-md",
                            "text-sm font-medium",
                            "transition-colors duration-150",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
                            isActive
                              ? "bg-white/15 text-white"
                              : "text-white/70 hover:bg-white/10 hover:text-white"
                          )}
                        >
                          <item.icon
                            className="w-4 h-4 shrink-0"
                            aria-hidden
                          />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
