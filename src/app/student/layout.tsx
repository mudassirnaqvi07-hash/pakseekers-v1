/**
 * Student Portal Layout — PakSeekers Phase 4.
 *
 * Provides the persistent navigation shell for student accounts.
 * Displays student navigation, target exam, and account actions.
 */

import Link from "next/link";
import { APP_NAME } from "@/lib/config/app";
import { BrandLogo } from "@/components/shared";
import { getCurrentUser } from "@/server/auth/session";
import { StudentNav } from "@/features/student/components/student-nav";

export const dynamic = "force-dynamic";

export default async function StudentPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // If user is authenticated as student, show the complete Student Shell with Nav
  if (user && user.role === "student") {
    return (
      <div className="min-h-screen flex flex-col bg-background text-text-primary">
        <StudentNav user={user} />
        <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 w-full">
          {children}
        </main>
        <footer className="border-t border-border bg-surface py-6 text-center text-xs text-text-secondary">
          <div className="max-w-6xl mx-auto px-4">
            <p>
              © {new Date().getFullYear()} {APP_NAME}. Standardized Entry Test
              Preparation Platform for Pakistan.
            </p>
          </div>
        </footer>
      </div>
    );
  }

  // Minimal clean wrapper for auth pages or unauthenticated state
  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary">
      <header className="border-b border-border bg-surface">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <BrandLogo variant="horizontal" size="sm" href="/student/login" subtitle="Student Portal" />
          <div className="flex items-center gap-4">
            <Link
              href="/explore"
              className="text-xs font-semibold text-text-secondary hover:text-primary transition-colors"
            >
              Explore Exams
            </Link>
            <Link
              href="/about"
              className="text-xs font-semibold text-text-secondary hover:text-primary transition-colors"
            >
              About
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 w-full">
        {children}
      </main>

      <footer className="border-t border-border bg-surface py-4 text-center text-xs text-text-secondary">
        <p>© {new Date().getFullYear()} {APP_NAME}. Student Portal</p>
      </footer>
    </div>
  );
}
