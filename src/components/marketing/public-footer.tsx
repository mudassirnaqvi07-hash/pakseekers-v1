import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import { BrandLogo } from "@/components/shared";
import { SITE_CONFIG } from "@/lib/config/site";
import type { Exam } from "@/types";

interface PublicFooterProps {
  exams?: Exam[];
}

export function PublicFooter({ exams = [] }: PublicFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface text-text-secondary text-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          {/* Column 1: Brand & Overview (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <BrandLogo variant="horizontal" size="md" href="/" subtitle="Prepare • Achieve • Lead" />

            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-sm">
              Pakistan’s premier entrance test preparation platform. Equipping intermediate
              and A-Level students with curriculum-aligned question banks, step-by-step
              rationales, and timed diagnostic assessments.
            </p>

            <div className="flex flex-col gap-1 text-xs text-text-secondary pt-2">
              <span className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-text-secondary" />
                {SITE_CONFIG.contact.officeLocation}
              </span>
              <a
                href={`mailto:${SITE_CONFIG.contact.supportEmail}`}
                className="flex items-center gap-2 hover:text-primary transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-text-secondary" />
                {SITE_CONFIG.contact.supportEmail}
              </a>
            </div>
          </div>

          {/* Column 2: Platform Navigation (3 cols) */}
          <div className="lg:col-span-3">
            <p className="text-xs font-bold text-text-primary uppercase tracking-wider mb-4">
              Platform Navigation
            </p>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  Home Overview
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">
                  About PakSeekers
                </Link>
              </li>
              <li>
                <Link href="/about#vision" className="hover:text-primary transition-colors">
                  Vision & Mission
                </Link>
              </li>
              <li>
                <Link href="/about#why-us" className="hover:text-primary transition-colors">
                  Why Choose Us
                </Link>
              </li>
              <li>
                <Link href="/about#team" className="hover:text-primary transition-colors">
                  Founding Team
                </Link>
              </li>
              <li>
                <Link href="/explore" className="hover:text-primary transition-colors">
                  Explore Platform
                </Link>
              </li>
              <li>
                <Link href="/explore#features" className="hover:text-primary transition-colors">
                  Platform Capabilities
                </Link>
              </li>
              <li>
                <Link href="/explore#contact" className="hover:text-primary transition-colors">
                  Contact & Inquiries
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Examination Modules (3 cols) */}
          <div className="lg:col-span-3">
            <p className="text-xs font-bold text-text-primary uppercase tracking-wider mb-4">
              Entrance Examinations
            </p>
            <ul className="space-y-2.5 text-xs">
              {exams.length > 0 ? (
                exams.map((exam) => (
                  <li key={exam.id}>
                    <Link
                      href={`/exams/${exam.id}`}
                      className="hover:text-primary transition-colors"
                    >
                      {exam.code} — {exam.title}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li>
                    <Link href="/exams" className="hover:text-primary transition-colors">
                      MDCAT (Medical & Dental)
                    </Link>
                  </li>
                  <li>
                    <Link href="/exams" className="hover:text-primary transition-colors">
                      ECAT (UET Engineering)
                    </Link>
                  </li>
                  <li>
                    <Link href="/exams" className="hover:text-primary transition-colors">
                      NUST NET (Engineering & CS)
                    </Link>
                  </li>
                </>
              )}
              <li className="pt-2">
                <Link
                  href="/exams"
                  className="font-semibold text-primary hover:underline block"
                >
                  View Complete Exam Catalog →
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Student Portal (2 cols) */}
          <div className="lg:col-span-2">
            <p className="text-xs font-bold text-text-primary uppercase tracking-wider mb-4">
              Student Portal
            </p>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link
                  href="/student/login"
                  className="hover:text-primary transition-colors"
                >
                  Student Sign In
                </Link>
              </li>
              <li>
                <Link
                  href="/student/register"
                  className="hover:text-primary transition-colors"
                >
                  Student Registration
                </Link>
              </li>
              <li>
                <Link
                  href="/student/dashboard"
                  className="hover:text-primary transition-colors"
                >
                  Student Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Sub-Footer */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-secondary text-center sm:text-left">
          <p>
            © {currentYear} {SITE_CONFIG.name}. All rights reserved. Standardized Academic Preparation Platform for Pakistan.
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2">
            <Link href="/about" className="hover:text-primary transition-colors">
              About Us
            </Link>
            <span className="h-3 w-px bg-border hidden xs:inline" aria-hidden="true" />
            <Link href="/explore" className="hover:text-primary transition-colors">
              Explore Platform
            </Link>
            <span className="h-3 w-px bg-border hidden xs:inline" aria-hidden="true" />
            <Link href="/exams" className="hover:text-primary transition-colors">
              Exam Directory
            </Link>
            <span className="h-3 w-px bg-border hidden xs:inline" aria-hidden="true" />
            <Link href="/explore#contact" className="hover:text-primary transition-colors">
              Inquiries
            </Link>
            <span className="h-3 w-px bg-border hidden xs:inline" aria-hidden="true" />
            <Link href="/student/login" className="hover:text-primary transition-colors">
              Student Sign In
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
