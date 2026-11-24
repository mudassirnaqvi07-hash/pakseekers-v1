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
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  Layers,
  Settings,
  ShieldCheck,
  Timer,
  Users,
  FileCode2,
} from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-logo";
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
        href: "/admin/dashboard",
        icon: LayoutDashboard,
        exact: true,
      },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Exams", href: "/admin/exams", icon: GraduationCap },
      { label: "Subjects", href: "/admin/subjects", icon: Layers },
      { label: "Topics", href: "/admin/topics", icon: BookOpen },
      { label: "Questions", href: "/admin/questions", icon: HelpCircle },
      { label: "Tests", href: "/admin/tests", icon: ClipboardList },
      { label: "Import Quiz", href: "/admin/tests/import", icon: FileCode2 },
      { label: "Sections", href: "/admin/sections", icon: Layers },
      { label: "Lessons", href: "/admin/lessons", icon: FileText },
      { label: "Mock Tests", href: "/admin/mock-tests", icon: Timer },
    ],
  },
  {
    label: "Users",
    items: [
      { label: "Students", href: "/admin/students", icon: Users },
      { label: "Enrollments", href: "/admin/enrollments", icon: ShieldCheck },
      { label: "Staff & Permissions", href: "/admin/staff", icon: ShieldCheck },
    ],
  },
  {
    label: "Reports",
    items: [
      { label: "Analytics", href: "/admin/analytics", icon: BarChart2 },
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
          className="fixed inset-0 z-40 bg-text-primary/40 backdrop-blur-xs lg:hidden"
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
          "fixed inset-y-0 left-0 z-50",
          // Dimensions
          "w-64 max-w-[85vw] flex flex-col",
          // Visual
          "bg-primary shadow-xl",
          // Desktop: always visible; Mobile: slide in/out
          "lg:static lg:translate-x-0 lg:w-60 lg:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "transition-transform duration-200 ease-in-out",
          // Ensure it doesn't interfere with desktop layout
          "lg:transition-none"
        )}
      >
        {/* Brand mark & Mobile Close Button */}
        <div className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-white/10">
          <BrandLogo variant="horizontal" size="xs" href="/admin/dashboard" dark subtitle="Admin Portal" />

          {/* Close button for mobile drawer */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation sidebar"
            className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-white/70 hover:text-white rounded-md cursor-pointer"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
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
                      ? pathname === item.href || (item.href === "/admin/dashboard" && pathname === "/admin")
                      : pathname === item.href ||
                        pathname.startsWith(item.href + "/");

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          aria-current={isActive ? "page" : undefined}
                          className={cn(
                            "flex items-center gap-2.5 px-2.5 py-2.5 sm:py-2 rounded-md min-h-[44px] sm:min-h-0",
                            "text-sm font-medium",
                            "transition-colors duration-150",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
                            isActive
                              ? "bg-white/15 text-white font-semibold"
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
