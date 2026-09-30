/**
 * Public Landing Page — PakSeekers.
 *
 * The official front door of the PakSeekers platform.
 * Dynamically displays available exams, core platform capabilities,
 * clear student CTAs (Start Preparing, Student Login), and an Admin Portal entry point.
 */

import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  BarChart3,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
} from "lucide-react";
import { Badge, Button, Card, CardContent } from "@/components/ui";
import { APP_NAME } from "@/lib/config/app";
import { getAllExams } from "@/server/repositories/content-repository";
import { getCurrentUser } from "@/server/auth/session";

export default async function HomePage() {
  const [currentUser, exams] = await Promise.all([
    getCurrentUser(),
    Promise.resolve(getAllExams("active")),
  ]);

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col">
      {/* ------------------------------------------------------------------ */}
      {/* Public Header */}
      {/* ------------------------------------------------------------------ */}
      <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur-md border-b border-border shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-primary">
              {APP_NAME}
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link
              href="#exams"
              className="text-text-secondary hover:text-primary transition-colors"
            >
              Exams & Syllabus
            </Link>
            <Link
              href="#features"
              className="text-text-secondary hover:text-primary transition-colors"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-text-secondary hover:text-primary transition-colors"
            >
              How It Works
            </Link>
          </nav>

          {/* Auth Actions */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              currentUser.role === "admin" ? (
                <Link href="/admin">
                  <Button variant="outline" size="sm">
                    <Shield className="w-4 h-4 mr-1.5" />
                    Admin Panel
                  </Button>
                </Link>
              ) : (
                <Link href="/student/dashboard">
                  <Button variant="primary" size="sm">
                    Student Dashboard
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
              )
            ) : (
              <>
                <Link href="/student/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/student/register">
                  <Button variant="primary" size="sm">
                    Start Preparing
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Hero Section */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          <Badge variant="default" className="mb-4 py-1 px-3 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-accent" />
            Pakistan’s Premier Entrance Exam Preparation Platform
          </Badge>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-text-primary max-w-4xl leading-tight">
            Master University Entry Tests with{" "}
            <span className="text-primary underline decoration-accent/40 decoration-4 underline-offset-8">
              Targeted Practice
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-text-secondary max-w-2xl font-normal leading-relaxed">
            Prepare for MDCAT, ECAT, NUST NET, FAST-NU, and other competitive academic
            examinations with curriculum-aligned question banks, timed mock assessments,
            and step-by-step explanations.
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link
              href={currentUser ? "/student/dashboard" : "/student/register"}
              className="w-full sm:w-auto"
            >
              <Button size="lg" className="w-full sm:w-auto px-8 shadow-md">
                Start Preparing Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>

            <Link href="/exams" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-6">
                <BookOpen className="w-4 h-4 mr-2" />
                Browse Exam Catalog
              </Button>
            </Link>
          </div>

          {/* Feature Highlights Grid */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 w-full text-left">
            <div className="p-4 rounded-xl border border-border bg-surface shadow-2xs">
              <div className="text-2xl font-bold text-primary">100%</div>
              <div className="text-xs text-text-secondary mt-1">PMDC & University Aligned</div>
            </div>
            <div className="p-4 rounded-xl border border-border bg-surface shadow-2xs">
              <div className="text-2xl font-bold text-primary">Explanations</div>
              <div className="text-xs text-text-secondary mt-1">Pedagogical answer rationales</div>
            </div>
            <div className="p-4 rounded-xl border border-border bg-surface shadow-2xs">
              <div className="text-2xl font-bold text-primary">Timed Tests</div>
              <div className="text-xs text-text-secondary mt-1">Realistic test conditions</div>
            </div>
            <div className="p-4 rounded-xl border border-border bg-surface shadow-2xs">
              <div className="text-2xl font-bold text-primary">Progress</div>
              <div className="text-xs text-text-secondary mt-1">Persistent attempt analytics</div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Available Exams Section (Dynamic from Database) */}
      {/* ------------------------------------------------------------------ */}
      <section id="exams" className="py-16 md:py-24 bg-surface border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <Badge variant="default" className="mb-2">
                Standardized Examinations
              </Badge>
              <h2 className="text-3xl font-bold text-text-primary tracking-tight">
                Curriculum-Aligned Entrance Exams
              </h2>
              <p className="text-text-secondary mt-2 max-w-xl text-sm sm:text-base">
                Explore dedicated preparation modules for Pakistan’s leading public and
                private sector universities.
              </p>
            </div>
            <Link href="/exams">
              <Button variant="outline" size="sm">
                View Full Catalog
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => (
              <Card
                key={exam.id}
                className="flex flex-col justify-between hover:border-primary/50 transition-all hover:shadow-md"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="info" className="font-bold tracking-wider">
                      {exam.code}
                    </Badge>
                    <span className="text-xs text-text-secondary font-medium flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-text-secondary" />
                      {exam.totalSubjects} Subjects
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-text-primary leading-snug mb-2">
                    {exam.title}
                  </h3>
                  <p className="text-sm text-text-secondary line-clamp-3 leading-relaxed mb-6">
                    {exam.description}
                  </p>

                  <div className="pt-4 border-t border-border flex items-center justify-between">
                    <Link
                      href={`/exams/${exam.id}`}
                      className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      Explore Syllabus & Tests
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Platform Capabilities (Real Features) */}
      {/* ------------------------------------------------------------------ */}
      <section id="features" className="py-16 md:py-24 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="info" className="mb-2">
              Structured Methodology
            </Badge>
            <h2 className="text-3xl font-bold text-text-primary tracking-tight">
              Designed for Maximum Conceptual Retention
            </h2>
            <p className="text-text-secondary mt-2 text-sm sm:text-base">
              PakSeekers bridges the gap between rote memorization and analytical test-taking skills.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border border-border bg-surface hover:shadow-sm transition-all flex flex-col">
              <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-5">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2">
                Hierarchical Curriculum
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Break preparation down into manageable chunks: Exam $\to$ Subject $\to$ Topic $\to$ Focused MCQs.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-surface hover:shadow-sm transition-all flex flex-col">
              <div className="w-12 h-12 rounded-lg bg-accent/15 text-accent flex items-center justify-center mb-5">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2">
                Pedagogical Explanations
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Every MCQ includes detailed rationales for why the correct option is right and common pitfalls to avoid.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-surface hover:shadow-sm transition-all flex flex-col">
              <div className="w-12 h-12 rounded-lg bg-info/10 text-info flex items-center justify-center mb-5">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2">
                Attempt History & Analytics
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Track your diagnostic scores over time, review past mistakes, and see your subject-by-subject accuracy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* How It Works (3 Steps) */}
      {/* ------------------------------------------------------------------ */}
      <section id="how-it-works" className="py-16 md:py-24 bg-surface border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="info" className="mb-2">
              Simple Workflow
            </Badge>
            <h2 className="text-3xl font-bold text-text-primary tracking-tight">
              Three Steps to Entry Test Success
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="flex flex-col items-center text-center p-6">
              <div className="w-12 h-12 rounded-full bg-primary text-white font-bold text-lg flex items-center justify-center mb-4 shadow-xs">
                1
              </div>
              <h3 className="text-base font-bold text-text-primary mb-1">
                Choose Your Exam
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Pick your target test (e.g. MDCAT, FAST-NU, NTS) and explore the full syllabus.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6">
              <div className="w-12 h-12 rounded-full bg-primary text-white font-bold text-lg flex items-center justify-center mb-4 shadow-xs">
                2
              </div>
              <h3 className="text-base font-bold text-text-primary mb-1">
                Take Interactive Tests
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Solve realistic MCQs under timed conditions with instant answer evaluation.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6">
              <div className="w-12 h-12 rounded-full bg-primary text-white font-bold text-lg flex items-center justify-center mb-4 shadow-xs">
                3
              </div>
              <h3 className="text-base font-bold text-text-primary mb-1">
                Analyze & Improve
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Review verified solutions, learn from mistakes, and track your progress in your dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Bottom CTA Banner */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-16 bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Start Your University Preparation Today
          </h2>
          <p className="text-primary-foreground/90 max-w-xl mx-auto mb-8 text-sm sm:text-base">
            Create your student profile in less than a minute and begin practicing with official entrance test MCQs.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/student/register">
              <Button size="lg" variant="secondary" className="px-8 font-bold">
                Create Free Student Account
              </Button>
            </Link>
            <Link href="/student/login">
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent text-white border-white hover:bg-white/10"
              >
                Student Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Public Footer with Admin Link */}
      {/* ------------------------------------------------------------------ */}
      <footer className="border-t border-border bg-surface py-12 text-sm text-text-secondary">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary text-white flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="font-bold text-text-primary">{APP_NAME}</span>
            <span className="text-xs text-text-secondary ml-2">
              © {new Date().getFullYear()} PakSeekers. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs">
            <Link href="/exams" className="hover:text-primary transition-colors">
              Exam Catalog
            </Link>
            <Link href="/student/login" className="hover:text-primary transition-colors">
              Student Portal
            </Link>
            <span className="h-3 w-px bg-border" />
            <Link
              href="/admin/login"
              className="text-text-secondary hover:text-primary flex items-center gap-1 font-medium transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-text-secondary" />
              <span>Admin Portal</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
