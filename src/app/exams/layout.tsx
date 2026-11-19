import Link from "next/link";
import { BookOpen, LogIn, LayoutDashboard } from "lucide-react";
import { APP_NAME } from "@/lib/config/app";
import { BrandLogo } from "@/components/shared";
import { getCurrentUser } from "@/server/auth/session";

export default async function ExamsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary">
      {/* Public Exam Catalog Navigation Bar */}
      <header className="sticky top-0 z-40 bg-surface border-b border-border shadow-2xs">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand Logo with Official Crest */}
          <BrandLogo variant="horizontal" size="sm" href="/exams" subtitle="Curriculum Catalog" />

          {/* Nav Links */}
          <nav className="flex items-center gap-1.5 sm:gap-3 text-sm shrink-0">
            <Link
              href="/exams"
              className="font-medium text-text-secondary hover:text-primary transition-colors flex items-center gap-1.5 text-xs sm:text-sm p-1.5 sm:p-0"
              title="Exam Catalog"
            >
              <BookOpen className="w-4 h-4 text-text-secondary shrink-0" />
              <span className="hidden sm:inline">Exam Catalog</span>
            </Link>

            <span className="h-4 w-px bg-border" aria-hidden="true" />

            {/* Contextual Auth Button */}
            {user && user.role === "student" ? (
              <Link
                href="/student/dashboard"
                className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs"
              >
                <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
                <span><span className="hidden xs:inline">My </span>Dashboard</span>
              </Link>
            ) : (
              <Link
                href="/student/login"
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md border border-primary/40 bg-primary/5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 shrink-0" />
                <span>Login<span className="hidden sm:inline"> to Start Tests</span></span>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 w-full">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-6 text-center text-xs text-text-secondary">
        <div className="max-w-6xl mx-auto px-4">
          <p>© {new Date().getFullYear()} {APP_NAME}. Standardized Entry Test Preparation Platform for Pakistan.</p>
        </div>
      </footer>
    </div>
  );
}
