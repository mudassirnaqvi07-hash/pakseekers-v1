"use client";

/**
 * StaffSidebar — PakSeekers Permission-Aware Staff Portal Navigation.
 *
 * Dynamically filters navigation items according to the Staff member's
 * live server-resolved permissions.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart2,
  BookOpen,
  ClipboardList,
  FileCode2,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  Layers,
  LogOut,
  X,
} from "lucide-react";
import type { Permission, SafeUser } from "@/types";
import { hasAnyPermission } from "@/lib/auth/permissions";
import { BrandLogo } from "@/components/shared/brand-logo";
import { cn } from "@/lib/utils/cn";
import { logoutStaffAction } from "@/server/actions/auth-actions";

interface StaffNavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  exact?: boolean;
  requiredPermissions?: Permission[];
}

interface StaffNavGroup {
  label: string;
  items: StaffNavItem[];
}

const STAFF_NAV_GROUPS: StaffNavGroup[] = [
  {
    label: "Workspace",
    items: [
      {
        label: "Dashboard",
        href: "/staff/dashboard",
        icon: LayoutDashboard,
        exact: true,
      },
    ],
  },
  {
    label: "Curriculum & Content",
    items: [
      {
        label: "Exams",
        href: "/staff/exams",
        icon: GraduationCap,
        requiredPermissions: ["EXAM_VIEW", "EXAM_CREATE", "EXAM_EDIT"],
      },
      {
        label: "Subjects",
        href: "/staff/subjects",
        icon: Layers,
        requiredPermissions: ["SUBJECT_VIEW", "SUBJECT_CREATE", "SUBJECT_EDIT"],
      },
      {
        label: "Topics",
        href: "/staff/topics",
        icon: BookOpen,
        requiredPermissions: ["TOPIC_VIEW", "TOPIC_CREATE", "TOPIC_EDIT"],
      },
      {
        label: "Questions",
        href: "/staff/questions",
        icon: HelpCircle,
        requiredPermissions: ["QUESTION_VIEW", "QUESTION_CREATE", "QUESTION_EDIT"],
      },
      {
        label: "Tests",
        href: "/staff/tests",
        icon: ClipboardList,
        requiredPermissions: ["TEST_VIEW", "TEST_CREATE", "TEST_EDIT"],
      },
      {
        label: "Import Quiz",
        href: "/staff/tests/import",
        icon: FileCode2,
        requiredPermissions: ["QUESTION_IMPORT"],
      },
    ],
  },
  {
    label: "Insights",
    items: [
      {
        label: "Analytics",
        href: "/staff/analytics",
        icon: BarChart2,
        requiredPermissions: ["ANALYTICS_VIEW", "TEST_PERFORMANCE_VIEW"],
      },
    ],
  },
];

export interface StaffSidebarProps {
  user: SafeUser;
  isOpen: boolean;
  onClose: () => void;
}

export function StaffSidebar({ user, isOpen, onClose }: StaffSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-text-primary/40 backdrop-blur-xs lg:hidden"
          aria-hidden="true"
          onClick={onClose}
        />
      )}

      <aside
        id="staff-sidebar"
        aria-label="Staff navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 max-w-[85vw] flex flex-col bg-primary shadow-xl",
          "lg:static lg:translate-x-0 lg:w-60 lg:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "transition-transform duration-200 ease-in-out lg:transition-none"
        )}
      >
        <div className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-white/10">
          <BrandLogo variant="horizontal" size="xs" href="/staff/dashboard" dark subtitle="Staff Portal" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation sidebar"
            className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-white/70 hover:text-white rounded-md cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3" aria-label="Staff modules">
          <ul role="list" className="flex flex-col gap-5">
            {STAFF_NAV_GROUPS.map((group) => {
              const visibleItems = group.items.filter(
                (item) =>
                  !item.requiredPermissions ||
                  hasAnyPermission(user, item.requiredPermissions)
              );

              if (visibleItems.length === 0) return null;

              return (
                <li key={group.label}>
                  <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/45 select-none">
                    {group.label}
                  </p>
                  <ul role="list" className="flex flex-col gap-0.5">
                    {visibleItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = item.exact
                        ? pathname === item.href || (item.href === "/staff/dashboard" && pathname === "/staff")
                        : pathname === item.href || pathname.startsWith(item.href + "/");

                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={onClose}
                            aria-current={isActive ? "page" : undefined}
                            className={cn(
                              "flex items-center gap-2.5 px-2.5 py-2.5 sm:py-2 rounded-md min-h-[44px] sm:min-h-0",
                              "text-sm font-medium transition-colors duration-150",
                              isActive
                                ? "bg-white/15 text-white font-semibold"
                                : "text-white/75 hover:text-white hover:bg-white/10"
                            )}
                          >
                            <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span className="truncate">{item.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom User Profile & Sign Out */}
        <div className="p-3 border-t border-white/10 bg-black/10">
          <div className="px-2 mb-2">
            <p className="text-xs font-semibold text-white truncate">{user.name}</p>
            <p className="text-[11px] text-white/60 truncate">
              {user.staffTitle || "Academic Staff"}
            </p>
          </div>
          <form action={logoutStaffAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
