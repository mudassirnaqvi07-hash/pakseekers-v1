import Link from "next/link";
import { BookOpen, GraduationCap, Shield } from "lucide-react";
import { APP_NAME } from "@/lib/config/app";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary">
      {/* Student Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-surface border-b border-border shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link
            href="/exams"
            className="flex items-center gap-2.5 text-primary hover:opacity-95 transition-opacity"
          >
            <div className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-primary">
              {APP_NAME}
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/exams"
              className="font-medium text-text-secondary hover:text-primary transition-colors flex items-center gap-1.5"
            >
              <BookOpen className="w-4 h-4 text-text-secondary" />
              <span>Exam Catalog</span>
            </Link>

            <span className="h-4 w-px bg-border" aria-hidden="true" />

            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-background text-xs font-semibold text-text-secondary hover:text-primary hover:border-primary/40 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-text-secondary" />
              <span>Admin Portal</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 w-full">
        {children}
      </main>

      {/* Student Footer */}
      <footer className="border-t border-border bg-surface py-6 text-center text-xs text-text-secondary">
        <div className="max-w-6xl mx-auto px-4">
          <p>© {new Date().getFullYear()} {APP_NAME}. Standardized Entry Test Preparation Platform for Pakistan.</p>
        </div>
      </footer>
    </div>
  );
}
