# PakSeekers — Development Roadmap

## Phase 0 — Engineering Foundation

Establish:

* Repository
* Development rules
* Architecture
* Design system
* Documentation
* AI-agent workflow

No major business features.

---

## Phase 1 — Database Foundation & MongoDB Atlas Integration (Completed)

Build:

* Next.js App Router & TypeScript
* Official MongoDB Node.js Driver (`mongodb`) centralized connection manager
* Connection pooling with dev-mode HMR singleton caching
* Document schemas, TypeScript interfaces, and automated index creation (`ensureMongoIndexes`)
* Zero Prisma architecture (decommissioned & uninstalled)
* Idempotent data migration from file-based JSON to live MongoDB Atlas cluster
* Native MongoDB repository implementations (`content-repository.ts`, `user-repository.ts`)
* Full async application service layer (`content-service.ts`, `user-service.ts`)
* Automated 26-test repository integration test suite (`scripts/test-mongodb-repositories.mjs`)
* Zero TypeScript errors, zero ESLint warnings, successful production build

---

## Phase 2 — Authentication, Authorization & Session Management (Completed)

Implement:

* Secure student registration with email normalization and unique database constraints
* Strong password policy enforcement (min 8 chars, letter + number)
* Scrypt password hashing with constant-time verification
* Cryptographically secure 256-bit session token generator (`generateSessionToken`)
* SHA-256 hashed session persistence in MongoDB Atlas (`sessions` collection)
* Brute-force login rate limiting (sliding window with 15-minute lockout)
* Generic authentication errors eliminating account enumeration
* Role-based access control (RBAC): student vs admin separation
* Session fixation defense & automatic session regeneration
* IDOR prevention across attempts, results, and student profiles
* `SafeUser` sanitization guaranteeing zero exposure of `passwordHash`
* 35-assertion automated security test suite (`scripts/test-auth-security.mjs`)
* Zero TypeScript errors, zero ESLint warnings, successful production build

---

## Phase 3 — Homepage Content & UI Redesign (Completed)

Transform the public-facing homepage into a modern, professional, high-converting gateway:

* Modular homepage architecture (<PublicHeader />, <HeroSection />, <AboutSection />, <ExamsSection />, <FeaturesSection />, <WhyChooseSection />, <TeamSection />, <ContactSection />, <CtaSection />, <PublicFooter />)
* Value proposition: "Prepare Smarter. Achieve Further."
* Standardized Pakistani entry test taxonomy (MDCAT, ECAT, NUST NET)
* Real-world contact channel & inquiry form
* Responsive mobile navigation drawer
* 18-assertion automated test suite (`scripts/test-phase3-homepage.mjs`)
* Zero TypeScript errors, zero ESLint warnings, successful production build

---

## Phase 4 — UX & Performance Optimization (Completed)

Optimize performance, accessibility, authentication UX, and button responsiveness:

* Windows Hotspot / LAN DNS query refusal resolution (`querySrv ECONNREFUSED` eliminated via direct replica set seedlist)
* Bulletproof UI Button primitive (`src/components/ui/button.tsx`) enforcing horizontal flex-row layout and eliminating icon wrapping
* Cleaned up marketing CTA buttons and form submit buttons for maximum visual clarity
* Self-hosted Google Font `Inter` (`next/font/google`), removing render-blocking `@import`
* Dynamic query caching using Next.js `unstable_cache` with tag-based revalidation (`exams`, `tests`, `subjects`)
* Next.js App Router metadata, OpenGraph, Canonical, and SEO indexing metadata (`robots: { index: true, follow: true }`)
* Lighthouse Mobile Benchmarks: **SEO: 100/100**, **Best Practices: 100/100**, **Accessibility: 92-100/100**
* Loading skeletons (`loading.tsx`) and error boundaries (`error.tsx`) across student and catalog routes
* Test-taking UX upgrades: selected option checkmarks, "Flag for Review" toggle, and Submission Confirmation Modal
* Full regression pass: 18/18 Phase 3, 17/17 Phase 2, 27/27 LAN auth, 35/35 Auth security, 26/26 DB tests, and 31/31 routes production build

---

## Phase 5 — Admin Shell + Dashboard

Implement:

* Sidebar
* Header
* Navigation
* Dashboard
* Statistics
* Recent activity
* Basic charts

---

## Phase 5 — Test Structure Management

Implement:

```text
Test
 ↓
Section
 ↓
Topic
```

Features:

* Create
* Edit
* Delete
* Search
* Filter
* Reorder
* Publish/unpublish

---

## Phase 6 — Lesson Management

Implement:

* Lesson creation
* Lesson editing
* Topic assignment
* Content management
* Publishing workflow

---

## Phase 7 — Question Bank

Implement:

* Question creation
* Four options
* Correct answer
* Explanation
* Difficulty
* Status
* Search
* Filtering
* Preview
* Publishing
* Archiving

---

## Phase 8 — Mock Tests

Implement:

* Mock test creation
* Question selection
* Ordering
* Duration
* Publishing

---

## Phase 9 — Students + Reports

Implement:

* Student list
* Student details
* Question reports
* Basic analytics
* Content statistics

---

## Phase 10 — Bulk Content Import

Implement:

* CSV upload
* Validation
* Preview
* Error reporting
* Bulk insertion

---

## Phase 11 — Quality & Security


Perform:

* Unit testing
* Integration testing
* Security review
* Performance review
* Accessibility review
* Database optimization
* Error handling review

---

## Phase 12 — Deployment

Prepare:

* Production environment
* MongoDB Atlas production database
* Environment variables
* Database migrations
* Monitoring
* Error tracking
* Backup strategy
* Deployment documentation

---

## Future Platform Development

After the Admin MVP:

```text
Student Authentication
        ↓
Student Dashboard
        ↓
Test Selection
        ↓
Diagnostic Test
        ↓
Learning
        ↓
Topic Practice
        ↓
Mock Tests
        ↓
Results
        ↓
Weak-Area Analysis
        ↓
Progress Tracking
```

Later:

```text
Personalized Learning
AI Explanations
AI Tutor
Advanced Analytics
Premium Features
University Discovery
Application Tracking
Career Preparation
```

These features should be developed only after validating the core platform.

---

## Development Strategy

The development strategy is:

**Build → Verify → Commit → Review → Extend**

Each phase must be stable before the next phase begins.

Do not allow AI agents to implement multiple unrelated phases in one task.
