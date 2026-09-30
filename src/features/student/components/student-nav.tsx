"use client";

/**
 * Student Top Navigation Bar — PakSeekers Phase 4.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  FileCheck2,
  History,
  User,
  LogOut,
  BookOpen,
} from "lucide-react";
import { APP_NAME } from "@/lib/config/app";
import { Badge, Button } from "@/components/ui";
import { logoutStudentAction } from "@/server/actions/auth-actions";
import type { User as UserType } from "@/types";

interface StudentNavProps {
  user: UserType;
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/student/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-primary">
              {APP_NAME}
            </span>
            <Badge variant="info" className="hidden sm:inline-flex text-[10px] py-0.5">
              Student
            </Badge>
          </Link>

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
        <div className="flex items-center gap-3">
          <Link
            href="/exams"
            className="hidden sm:flex items-center gap-1 text-xs text-text-secondary hover:text-primary transition-colors font-medium mr-2"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Catalog</span>
          </Link>

          <div className="flex items-center gap-2 pl-3 border-l border-border">
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
                className="text-text-secondary hover:text-error"
              >
                <LogOut className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline text-xs">Logout</span>
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden border-t border-border px-4 py-2 flex items-center justify-around bg-surface text-xs font-semibold">
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
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-md ${
                isActive ? "text-primary" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px]">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
