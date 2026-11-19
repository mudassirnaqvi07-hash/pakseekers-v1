/**
 * Home Page (/) — PakSeekers Public Website.
 *
 * Concise front-door introduction to PakSeekers:
 * 1. Hero Section with Strong Headline, Value Proposition & Live Test Canvas Preview
 * 2. Brief Introduction to PakSeekers Platform
 * 3. Key Platform Features Overview (Exams, Subjects, Topics, Mocks, Tracking)
 * 4. How PakSeekers Works (4-Step Student Workflow)
 * 5. Final Registration Call to Action
 *
 * Detailed company background, mission, and team are separated into /about.
 * Deep-dive feature catalog, exam directory, and inquiries are separated into /explore.
 */

import type { Metadata } from "next";
import { getAllExams } from "@/server/services/content-service";
import { getCurrentUser } from "@/server/auth/session";
import type { Exam, SafeUser } from "@/types";
import {
  PublicHeader,
  HeroSection,
  HomeIntroSection,
  HomeFeaturesSection,
  HowItWorksSection,
  CtaSection,
  PublicFooter,
} from "@/components/marketing";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "PakSeekers — Pakistan's Premier Entrance Exam Preparation Platform",
  description:
    "Prepare smarter for MDCAT, ECAT, NUST NET, and competitive entrance examinations with curriculum-aligned question banks, step-by-step explanations, and timed diagnostic tests.",
  keywords: [
    "PakSeekers",
    "MDCAT preparation",
    "ECAT practice tests",
    "NUST NET MCQs",
    "entry test Pakistan",
    "PMDC medical test",
    "FAST entry test",
    "university admissions Pakistan",
  ],
};

export default async function HomePage() {
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
    console.warn("HomePage data fetch error:", err instanceof Error ? err.message : err);
  }

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* 1. Header & Navigation */}
      <PublicHeader currentUser={currentUser} />

      <main className="flex-1 flex flex-col">
        {/* 2. Hero Section */}
        <HeroSection currentUser={currentUser} />

        {/* 3. Brief Introduction */}
        <HomeIntroSection />

        {/* 4. Key Platform Features Overview */}
        <HomeFeaturesSection />

        {/* 5. How PakSeekers Works (4-Step Workflow) */}
        <HowItWorksSection />

        {/* 6. Final Call to Action */}
        <CtaSection currentUser={currentUser} />
      </main>

      {/* 7. Consistent Footer */}
      <PublicFooter exams={exams} />
    </div>
  );
}
