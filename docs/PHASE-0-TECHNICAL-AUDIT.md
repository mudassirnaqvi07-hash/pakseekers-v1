# PakSeekers — Phase 0 Technical Audit & Codebase Stabilization

**Audit Date:** November 8–10, 2026  
**Auditor:** Senior Software Engineer & Technical Auditor  
**Milestone:** Phase 0 — Technical Audit & Stabilization  
**Status:** COMPLETE & APPROVED FOR PHASE 1  
**Verification:**
- **TypeScript:** `npx tsc --noEmit` $\rightarrow$ **0 Errors**
- **ESLint:** `npm run lint` $\rightarrow$ **0 Errors, 0 Warnings**
- **Production Build:** `npm run build` $\rightarrow$ **31 Routes Compiled Successfully** (Next.js 16 Turbopack)

---

## 1. Executive Summary

A comprehensive architectural inspection and stabilization of the PakSeekers codebase was conducted. All critical build failures, security vulnerabilities, routing anomalies, and architectural layer boundary violations were systematically resolved.

Crucially, **100% of presentation components across the entire application have been decoupled from the data access layer (repositories)**. All presentation pages now interact strictly through the application service layer (`content-service.ts` and `user-service.ts`), strictly enforcing the project's **Modular Monolith + Domain-Driven Design (DDD)** specification.

In compliance with the project's architectural direction, **MongoDB Atlas** has been codified as the approved target database for Phase 1.

---

## 2. Issues Verified and Resolved

### A. Architectural Layer Boundary Violations (RESOLVED)
- **Problem:** All 16 Admin CMS pages (`src/app/admin/*`) and the direct test page (`src/app/tests/[id]/page.tsx`) previously imported `content-repository.ts` directly, bypassing the service layer and violating `docs/ARCHITECTURE.md`.
- **Resolution:**
  1. Expanded `src/server/services/content-service.ts` with dedicated admin accessors: `getAdminAllExams`, `getAdminAllSubjects`, `getAdminAllTopics`, `getAdminAllQuestions`, `getAdminAllTests`, `getAdminExamById`, `getAdminSubjectById`, `getAdminTopicById`, `getAdminQuestionById`, `getAdminTestById`, and `getAdminQuestionsByIds`.
  2. Migrated all 16 admin pages to import solely from `@/server/services/content-service`.
  3. Verified that zero files in `src/app/`, `src/features/`, or `src/components/` import from `server/repositories/`.

### B. Security & Authorization Hardening (RESOLVED)
- **Problem:** All 16 content mutation server actions in `src/server/actions/content-actions.ts` lacked authorization checks, allowing unauthenticated visitors to mutate or delete content.
- **Resolution:** Added `verifyAdminAuth()` guard across all 16 mutations (`createExamAction`, `updateExamAction`, `deleteExamAction`, `createSubjectAction`, etc.).
- **Problem:** `recordTestAttemptAction` in `src/server/actions/attempt-actions.ts` trusted client-submitted scores and question counts.
- **Resolution:** Implemented server-side authoritative grading using `evaluateQuiz`.

### C. Proxy & Edge Route Anomalies (RESOLVED)
- **Problem:** Infinite redirect loop when an authenticated administrator navigated to `/student/login`.
- **Resolution:** Removed cookie-only edge bouncing on auth pages; delegated role evaluation to Server Components.
- **Problem:** Practice and test routes (`/tests/*`, `/practice/*`) lacked uniform edge session verification.
- **Resolution:** Added `isExamPracticeRoute` to `src/proxy.ts` and trailing-slash normalization.

### D. Broken Routing & Fallback Strings (RESOLVED)
- **Problem:** Hardcoded `"cell-biology"` topic fallbacks in dashboard and student test catalog.
- **Resolution:** Implemented dynamic topic resolution based on test questions and parent subjects in `src/app/tests/[id]/page.tsx`.
- **Problem:** Redundant `/practice/[id]` page duplicating `/tests/[id]`.
- **Resolution:** Converted to clean HTTP 307 redirect forwarder to canonical `/tests/${id}`.

### E. Data Integrity & Import Bugs (RESOLVED)
- **Problem:** 1-based vs 0-based option indexing mismatch in `src/lib/validations/quiz-import.ts`.
- **Resolution:** Fixed index mapping so Option 1 correctly assigns to Option A.
- **Problem:** Deleting exams, subjects, topics, or questions orphaned child references and left `test.questionCount` desynchronized.
- **Resolution:** Added cascade cleanup in `src/server/repositories/content-repository.ts` and duplicate ID collision checks.

### F. Configuration Alignment (RESOLVED)
- **Problem:** `src/lib/config/env.ts` had a rigid `DATABASE_URL` requirement that threw runtime errors when not configured for PostgreSQL, and `.env.example` lacked MongoDB Atlas templates.
- **Resolution:** Updated `env.ts` with optional environment schema supporting `DATABASE_URL` and `MONGODB_URI`, and updated `.env.example` with MongoDB Atlas connection string formats.

---

## 3. Files and Modules Modified

| File Path | Nature of Change |
| :--- | :--- |
| `src/server/services/content-service.ts` | Added admin accessors (`getAdminExamById`, `getAdminSubjectById`, etc.) and domain functions (`getQuestionById`, `getAllTopics`). |
| `src/app/admin/exams/page.tsx` | Migrated from `content-repository` to `content-service` (`getAdminAllExams`). |
| `src/app/admin/exams/[id]/edit/page.tsx` | Migrated to `content-service` (`getAdminExamById`). |
| `src/app/admin/subjects/page.tsx` | Migrated to `content-service` (`getAdminAllSubjects`, `getAdminAllExams`, `getAdminExamById`). |
| `src/app/admin/subjects/new/page.tsx` | Migrated to `content-service` (`getAdminAllExams`). |
| `src/app/admin/subjects/[id]/edit/page.tsx` | Migrated to `content-service` (`getAdminSubjectById`, `getAdminAllExams`). |
| `src/app/admin/topics/page.tsx` | Migrated to `content-service` (`getAdminAllTopics`, `getAdminAllExams`, `getAdminSubjectById`, `getAdminExamById`). |
| `src/app/admin/topics/new/page.tsx` | Migrated to `content-service` (`getAdminAllExams`, `getAdminAllSubjects`). |
| `src/app/admin/topics/[id]/edit/page.tsx` | Migrated to `content-service` (`getAdminTopicById`, `getAdminAllExams`, `getAdminAllSubjects`). |
| `src/app/admin/questions/page.tsx` | Migrated to `content-service` (`getAdminAllQuestions`, `getAdminAllExams`, `getAdminTopicById`). |
| `src/app/admin/questions/new/page.tsx` | Migrated to `content-service` (`getAdminAllExams`, `getAdminAllSubjects`, `getAdminAllTopics`). |
| `src/app/admin/questions/[id]/edit/page.tsx` | Migrated to `content-service` (`getAdminQuestionById`, `getAdminAllExams`, `getAdminAllSubjects`, `getAdminAllTopics`). |
| `src/app/admin/tests/page.tsx` | Migrated to `content-service` (`getAdminAllTests`, `getAdminAllExams`, `getAdminExamById`). |
| `src/app/admin/tests/new/page.tsx` | Migrated to `content-service` (`getAdminAllExams`, `getAdminAllSubjects`, `getAdminAllTopics`, `getAdminAllQuestions`). |
| `src/app/admin/tests/[id]/edit/page.tsx` | Migrated to `content-service` (`getAdminTestById`, `getAdminAllExams`, `getAdminAllSubjects`, `getAdminAllTopics`, `getAdminAllQuestions`). |
| `src/app/admin/tests/[id]/preview/page.tsx` | Migrated to `content-service` (`getAdminTestById`, `getAdminQuestionsByIds`, `getAdminExamById`, etc.). |
| `src/app/admin/tests/import/page.tsx` | Migrated to `content-service` (`getAdminAllExams`, `getAdminAllSubjects`, `getAdminAllTopics`). |
| `src/app/tests/[id]/page.tsx` | Migrated to `content-service` (`getTestById`, `getQuestionById`, `getAllTopics`). |
| `src/lib/config/env.ts` | Updated schema for MongoDB Atlas support and safe fallback defaults. |
| `.env.example` | Replaced PostgreSQL comments with MongoDB Atlas connection string template. |
| `docs/DEVELOPMENT-RULES.md` | Specified MongoDB Atlas as the approved database. |
| `docs/ARCHITECTURE.md` | Updated data layer roadmap to reference MongoDB Atlas. |
| `docs/ROADMAP.md` | Updated Phase 12 production database to MongoDB Atlas. |

---

## 4. Architecture & Security Findings

1. **Layer Hierarchy Restored:** The system now strictly complies with the DDD rule:
   $$\text{Browser / Client} \longrightarrow \text{App Router} \longrightarrow \text{Application Services} \longrightarrow \text{Repositories} \longrightarrow \text{Storage}$$
2. **Server-Side Authorization Invariant:** All mutations require verified server-side credentials. Unauthenticated and student-role users cannot invoke content mutations.
3. **Target Database Definition:** MongoDB Atlas is established as the target database. The local JSON file store (`content-store.json` and `user-store.json`) serves as the functional bridge for Phase 0, completely insulated behind `content-repository.ts` and `user-repository.ts`.
4. **No Client Leakage:** Zero server-only modules or secrets are imported into client components (`"use client"`). All client-to-server interactions pass through typed Next.js Server Actions.

---

## 5. Outstanding Issues & Known Technical Debt

1. **JSON File Store Concurrency (Phase 1):**
   - *Status:* Scheduled for Phase 1.
   - *Detail:* The file store uses synchronous writes (`fs.writeFileSync`). In multi-container or serverless production deployments, local disk writes are ephemeral.
   - *Remediation Plan:* Wire MongoDB Atlas in Phase 1 via Mongoose / Prisma MongoDB adapter.
2. **N+1 Entity Lookups in Admin Lists (Phase 2):**
   - *Status:* Documented for optimization.
   - *Detail:* Admin tables perform individual entity lookups inside row rendering loops (e.g. `getAdminExamById(subject.examId)`). In MongoDB, this will be optimized using `$lookup` aggregations or pre-joined references.
3. **Admin Placeholder Pages (Phases 5–9):**
   - *Status:* As specified in the roadmap.
   - *Detail:* Sections (Phase 5), Lessons (Phase 6), Mock Tests (Phase 8), Students (Phase 9), Reports (Phase 9), and Settings (Phase 12) are scaffolded with `<PlaceholderPage>` components.

---

## 6. Dependencies & Prerequisites for Phase 1

1. **MongoDB Atlas Connection URI:** Provisioning a MongoDB Atlas cluster and adding `MONGODB_URI` to `.env`.
2. **Database Driver Selection:** Integration of Prisma (with MongoDB provider) or Mongoose as the data access engine behind the existing repository interfaces.
3. **Data Ingestion Script:** Execution of an automated seed script to ingest the existing `content-store.json` and `user-store.json` datasets directly into MongoDB Atlas collections.
