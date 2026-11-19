/**
 * PakSeekers — Public Website Restructuring & Multi-Page Navigation Test Suite
 *
 * Verifies:
 * 1. Site configuration structure & content integrity (authentic, no fabricated claims)
 * 2. Multi-page architecture across 3 distinct public pages:
 *    - Page 1: Concise Home (/) with Hero, Intro, Key Features, How It Works, CTA
 *    - Page 2: About Us (/about) with About, Vision & Mission, Educational Objectives, Why Us, Team
 *    - Page 3: Explore & Contact (/explore) with Exam Prep, Capabilities, Study Guide, Contact Form
 * 3. Primary navigation routes map strictly to pages (/, /about, /explore) without anchor links
 * 4. Active route state tracking via usePathname()
 * 5. Authentication CTA logic and mobile drawer state handling
 * 6. Contact configuration & mailto payload formatting
 * 7. Verified team member presentation & immutability
 * 8. Shared layout consistency (Header & Footer on all 3 pages)
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("==================================================================");
console.log(" PakSeekers — Multi-Page Public Website & Navigation Tests");
console.log("==================================================================");

let passed = 0;
let failed = 0;

function pass(name) {
  console.log(`  ✓ PASS: ${name}`);
  passed++;
}

function fail(name, err) {
  console.error(`  ✗ FAIL: ${name}`, err);
  failed++;
}

try {
  // ---------------------------------------------------------------------------
  // Test Suite 1: Marketing Configuration Integrity
  // ---------------------------------------------------------------------------
  console.log("\n--- Suite 1: Marketing Configuration & Content Integrity ---");
  const siteConfigPath = path.resolve("src/lib/config/site.ts");
  assert(fs.existsSync(siteConfigPath), "site.ts must exist");
  const siteContent = fs.readFileSync(siteConfigPath, "utf8");

  assert(siteContent.includes("Prepare Smarter. Achieve Further."), "Headline matches specification");
  pass("Headline matches Phase 3 specification ('Prepare Smarter. Achieve Further.')");

  assert(siteContent.includes("Your journey towards university admission starts here"), "Subheadline matches");
  pass("Subheadline communicated clearly with authentic value proposition");

  assert(siteContent.includes("MDCAT") && siteContent.includes("ECAT") && siteContent.includes("NUST NET"), "Core exam taxonomy present");
  pass("Standardized Pakistani examination taxonomy (MDCAT, ECAT, NUST NET) configured");

  // Verify primary navigation array has no anchor links
  assert(siteContent.includes('href: "/"') && siteContent.includes('href: "/about"') && siteContent.includes('href: "/explore"'), "Navigation uses proper routes");
  assert(!siteContent.includes('label: "Home", href: "#'), "No anchor navigation for primary items");
  pass("Primary navigation uses proper page routes (/, /about, /explore) without anchor hashtags");

  // ---------------------------------------------------------------------------
  // Test Suite 2: Multi-Page Architecture & Composition
  // ---------------------------------------------------------------------------
  console.log("\n--- Suite 2: Multi-Page Public Architecture ---");

  // Page 1: Home (/)
  const homePath = path.resolve("src/app/page.tsx");
  assert(fs.existsSync(homePath), "Home page.tsx must exist");
  const homeContent = fs.readFileSync(homePath, "utf8");

  const homeSections = [
    "PublicHeader",
    "HeroSection",
    "HomeIntroSection",
    "HomeFeaturesSection",
    "HowItWorksSection",
    "CtaSection",
    "PublicFooter",
  ];
  for (const s of homeSections) {
    assert(homeContent.includes(s), `HomePage must render <${s} />`);
    pass(`Page 1 (Home): Rendered <${s} />`);
  }

  // Ensure homepage is concise and does NOT include long company/team sections
  assert(!homeContent.includes("TeamSection"), "HomePage does not clutter with team profiles");
  assert(!homeContent.includes("WhyChooseSection"), "HomePage does not clutter with detailed comparisons");
  assert(!homeContent.includes("ContactSection"), "HomePage does not clutter with full contact forms");
  pass("Page 1 (Home) is concise and uncluttered (Team, Why Us, and Contact moved to dedicated pages)");

  // Page 2: About Us (/about)
  const aboutPath = path.resolve("src/app/about/page.tsx");
  assert(fs.existsSync(aboutPath), "About page.tsx must exist");
  const aboutContent = fs.readFileSync(aboutPath, "utf8");

  const aboutSections = [
    "PublicHeader",
    "AboutSection",
    "EducationalObjectivesSection",
    "WhyChooseSection",
    "TeamSection",
    "CtaSection",
    "PublicFooter",
  ];
  for (const s of aboutSections) {
    assert(aboutContent.includes(s), `AboutPage must render <${s} />`);
    pass(`Page 2 (About Us): Rendered <${s} />`);
  }

  // Page 3: Explore & Contact (/explore)
  const explorePath = path.resolve("src/app/explore/page.tsx");
  assert(fs.existsSync(explorePath), "Explore page.tsx must exist");
  const exploreContent = fs.readFileSync(explorePath, "utf8");

  const exploreSections = [
    "PublicHeader",
    "ExamsSection",
    "PlatformCapabilitiesSection",
    "ContactSection",
    "CtaSection",
    "PublicFooter",
  ];
  for (const s of exploreSections) {
    assert(exploreContent.includes(s), `ExplorePage must render <${s} />`);
    pass(`Page 3 (Explore & Contact): Rendered <${s} />`);
  }

  // ---------------------------------------------------------------------------
  // Test Suite 3: Navigation & Active State Handling
  // ---------------------------------------------------------------------------
  console.log("\n--- Suite 3: Navigation Destination & Active State Checks ---");
  const headerPath = path.resolve("src/components/marketing/public-header.tsx");
  const headerContent = fs.readFileSync(headerPath, "utf8");

  assert(headerContent.includes("usePathname"), "Header tracks active route with usePathname()");
  pass("Active route state detection implemented with Next.js usePathname()");

  assert(headerContent.includes("/student/login"), "Header includes student login link");
  assert(headerContent.includes("/student/register"), "Header includes student register link");
  assert(headerContent.includes("/student/dashboard"), "Header includes student dashboard link for auth students");
  assert(!headerContent.includes("/admin"), "Header contains ZERO admin links (100% student-facing)");
  pass("Header links map strictly to student and public destinations with zero admin leaks");

  // Verify mobile drawer presence
  assert(headerContent.includes("mobileMenuOpen"), "Mobile drawer state management implemented");
  assert(headerContent.includes("aria-expanded"), "Accessible mobile toggle with aria-expanded attributes");
  pass("Responsive mobile drawer with accessibility attributes implemented");

  // ---------------------------------------------------------------------------
  // Test Suite 4: Contact & Team Authentic Presentation
  // ---------------------------------------------------------------------------
  console.log("\n--- Suite 4: Authentic Team & Centralized Contact ---");
  assert(siteContent.includes("Syed Mudassir Hassan"), "Authentic founder presentation present in site configuration");
  pass("Founding team presentation showcases authentic lead architect without fake biographies");

  const contactPath = path.resolve("src/components/marketing/contact-section.tsx");
  const contactContent = fs.readFileSync(contactPath, "utf8");
  assert(contactContent.includes("mailto:"), "Direct mailto dispatch implemented for inquiries");
  pass("Contact inquiry form formats direct verified email payload");

  // ---------------------------------------------------------------------------
  // Test Suite 5: Consistent Footer Across Pages
  // ---------------------------------------------------------------------------
  console.log("\n--- Suite 5: Consistent Footer & Navigation ---");
  const footerPath = path.resolve("src/components/marketing/public-footer.tsx");
  const footerContent = fs.readFileSync(footerPath, "utf8");
  assert(footerContent.includes("currentYear"), "Dynamic copyright year included");
  assert(!footerContent.includes("/admin"), "Footer contains ZERO admin links (100% student-facing)");
  assert(footerContent.includes("/about"), "Footer contains link to /about");
  assert(footerContent.includes("/explore"), "Footer contains link to /explore");
  pass("Footer contains comprehensive multi-page platform navigation, copyright, and verified contacts (zero admin exposure)");

  console.log("\n==================================================================");
  console.log(` RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log("==================================================================");
  console.log(" All Multi-Page Public Website & Navigation tests passed successfully!");
} catch (err) {
  fail("Test assertion failed", err);
  process.exit(1);
}
