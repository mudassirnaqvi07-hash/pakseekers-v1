/**
 * About Us Page (/about) — PakSeekers Public Website.
 *
 * Dedicated institutional and pedagogical identity page:
 * 1. Page Header: Introduction & Mission Focus
 * 2. About PakSeekers (Overview, Audience, Problem Solved)
 * 3. Vision & Mission Statements & Core Pillars
 * 4. Educational Objectives (Pedagogical Framework)
 * 5. Why Choose PakSeekers (5 Comparative Advantages)
 * 6. Founding Team / Leadership (Verified Founder Syed Mudassir Hassan)
 * 7. Call to Action & Footer
 */

import type { Metadata } from "next";
import { getCurrentUser } from "@/server/auth/session";
import { getAllExams } from "@/server/services/content-service";
import type { Exam, SafeUser } from "@/types";
import {
  PublicHeader,
  AboutSection,
  EducationalObjectivesSection,
  WhyChooseSection,
  TeamSection,
  CtaSection,
  PublicFooter,
} from "@/components/marketing";
import { Badge } from "@/components/ui";
import { BrandLogo } from "@/components/shared";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About Us — Mission, Vision & Leadership",
  description:
    "Learn about PakSeekers, Pakistan's dedicated entrance test preparation platform. Discover our vision for educational equity, our core mission, verified academic standards, and engineering leadership.",
  keywords: [
    "About PakSeekers",
    "PakSeekers mission",
    "PakSeekers vision",
    "Pakistan entrance test platform",
    "educational equity Pakistan",
    "MDCAT ECAT founders",
  ],
};

export default async function AboutPage() {
  let currentUser: SafeUser | null = null;
  let exams: Exam[] = [];

  try {
    const [resolvedUser, resolvedExams] = await Promise.all([
      getCurrentUser().catch(() => null),
      getAllExams().catch(() => []),
    ]);
    currentUser = resolvedUser;
    exams = resolvedExams || [];
  } catch (err) {
    console.warn("AboutPage data fetch error:", err instanceof Error ? err.message : err);
  }

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* 1. Header & Navigation */}
      <PublicHeader currentUser={currentUser} />

      <main className="flex-1 flex flex-col">
        {/* Page Hero Header */}
        <section className="pt-12 pb-16 md:pt-16 md:pb-20 bg-gradient-to-b from-primary/5 via-background to-background border-b border-border">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
            <BrandLogo variant="icon" size="lg" className="mb-5 shadow-xs" priority />
            <Badge variant="default" className="mb-4 font-semibold">
              About PakSeekers
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-text-primary tracking-tight leading-tight">
              Democratizing University Entrance Preparation in Pakistan
            </h1>
            <p className="mt-5 text-base sm:text-lg text-text-secondary leading-relaxed max-w-2xl mx-auto">
              We are an educational technology platform built to provide intermediate and A-Level students with high-yield, curriculum-aligned preparation resources without commercial barriers.
            </p>
          </div>
        </section>

        {/* 2. About PakSeekers, Vision & Mission */}
        <AboutSection />

        {/* 3. Educational Objectives */}
        <EducationalObjectivesSection />

        {/* 4. Why Choose PakSeekers? */}
        <WhyChooseSection />

        {/* 5. Founding Team & Leadership */}
        <TeamSection />

        {/* 6. Final Call to Action */}
        <CtaSection currentUser={currentUser} />
      </main>

      {/* 7. Consistent Footer */}
      <PublicFooter exams={exams} />
    </div>
  );
}
