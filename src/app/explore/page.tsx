/**
 * Explore & Contact Page (/explore) — PakSeekers Public Website.
 *
 * Comprehensive platform exploration and inquiries page:
 * 1. Page Hero: Platform Capabilities Overview
 * 2. Examination Preparation (MDCAT, ECAT, NUST NET Catalog)
 * 3. Deep Dive: Subjects, Topics & Curriculum Taxonomy
 * 4. Deep Dive: Question Bank & Pedagogical Step-by-Step Rationales
 * 5. Deep Dive: Timed Practice Tests & Mock Exam Engine
 * 6. Deep Dive: Performance Tracking & Diagnostic Analytics
 * 7. Student Preparation Guide: 4-Step Methodology
 * 8. Contact & Inquiry Channels (Verified Emails, HQ, Operating Hours, Form)
 * 9. Final Call to Action & Footer
 */

import type { Metadata } from "next";
import { getCurrentUser } from "@/server/auth/session";
import { getAllExams } from "@/server/services/content-service";
import type { Exam, SafeUser } from "@/types";
import {
  PublicHeader,
  ExamsSection,
  PlatformCapabilitiesSection,
  ContactSection,
  CtaSection,
  PublicFooter,
} from "@/components/marketing";
import { Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Explore Platform & Contact — Capabilities, Examinations & Inquiries",
  description:
    "Explore PakSeekers features: standardized Pakistani entrance exams (MDCAT, ECAT, NET), topic-level question banks, timed mock assessments, diagnostic analytics, and verified contact channels.",
  keywords: [
    "Explore PakSeekers",
    "PakSeekers exams",
    "MDCAT question bank",
    "ECAT mock tests",
    "NUST NET preparation",
    "contact PakSeekers",
  ],
};

export default async function ExplorePage() {
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
    console.warn("ExplorePage data fetch error:", err instanceof Error ? err.message : err);
  }

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* 1. Header & Navigation */}
      <PublicHeader currentUser={currentUser} />

      <main className="flex-1 flex flex-col">
        {/* Page Hero Header */}
        <section className="pt-12 pb-16 md:pt-16 md:pb-20 bg-gradient-to-b from-primary/5 via-background to-background border-b border-border">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Badge variant="info" className="mb-4 font-semibold">
              Platform Exploration & Contact
            </Badge>
            <h1 className="text-3xl xs:text-4xl sm:text-5xl font-extrabold text-text-primary tracking-tight leading-tight">
              A Complete Academic Engine Built for Test Day Mastery
            </h1>
            <p className="mt-5 text-base sm:text-lg text-text-secondary leading-relaxed max-w-2xl mx-auto">
              Review our standardized entrance examination catalog, syllabus taxonomy, timed testing engine, and reach out directly to our academic team.
            </p>
          </div>
        </section>

        {/* 2. Examination Preparation (Standardized Exam Catalog from MongoDB) */}
        <ExamsSection exams={exams} />

        {/* 3–7. Detailed Platform Capabilities, Subjects/Topics, Question Bank, Mocks, Tracking & Study Guide */}
        <PlatformCapabilitiesSection />

        {/* 8. Verified Contact Details & Direct Inquiry Form */}
        <ContactSection />

        {/* 9. Final Call to Action */}
        <CtaSection currentUser={currentUser} />
      </main>

      {/* 10. Consistent Footer */}
      <PublicFooter exams={exams} />
    </div>
  );
}
