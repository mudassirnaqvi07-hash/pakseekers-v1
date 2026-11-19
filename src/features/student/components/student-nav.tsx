"use client";

/**
 * Student Top Navigation Bar — PakSeekers Phase 4.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileCheck2,
  History,
  User,
  LogOut,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui";
import { BrandLogo } from "@/components/shared";
import { logoutStudentAction } from "@/server/actions/auth-actions";
import type { SafeUser, User as UserType } from "@/types";

interface StudentNavProps {
  user: SafeUser | UserType;
}

export function StudentNav({ user }: StudentNavProps) {
  const pathname = usePathname();

  const navLinks = [
    {
      name: "Dashboard",
      href: "/student/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Available Tests",
      href: "/student/tests",
      icon: FileCheck2,
    },
    {
      name: "My Attempts",
      href: "/student/attempts",
      icon: History,
    },
    {
      name: "Profile",
      href: "/student/profile",
      icon: User,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-surface border-b border-border shadow-2xs">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <BrandLogo variant="horizontal" size="sm" href="/student/dashboard" subtitle="Student Portal" />

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/student/dashboard"
                  ? pathname === "/student/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href="/exams"
            className="flex items-center gap-1 text-xs text-text-secondary hover:text-primary transition-colors font-medium mr-1 sm:mr-2 p-1.5 rounded"
            title="Browse Exam Catalog"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Catalog</span>
          </Link>

          <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-border">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-text-primary truncate max-w-[130px]">
                {user.name}
              </div>
              <div className="text-[11px] text-text-secondary truncate max-w-[130px]">
                {user.profile.targetExam || "Student"}
              </div>
            </div>

            <form action={logoutStudentAction}>
              <Button
                variant="ghost"
                size="sm"
                type="submit"
                title="Log out of student account"
                className="text-text-secondary hover:text-error h-8 sm:h-9 px-2 sm:px-3 min-h-[38px] sm:min-h-0"
                leftIcon={<LogOut className="w-4 h-4" />}
              >
                <span className="hidden sm:inline text-xs">Logout</span>
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden border-t border-border px-2 py-1.5 flex items-center justify-around bg-surface text-xs font-semibold">
        {navLinks.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/student/dashboard"
              ? pathname === "/student/dashboard"
              : pathname.startsWith(item.href);

          const shortName =
            item.name === "Available Tests"
              ? "Tests"
              : item.name === "My Attempts"
              ? "Attempts"
              : item.name;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 px-1.5 xs:px-2.5 rounded-md transition-colors ${
                isActive ? "text-primary font-bold bg-primary/10" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] mt-0.5">{shortName}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
