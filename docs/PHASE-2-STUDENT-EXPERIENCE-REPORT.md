# PakSeekers — Phase 2: Student Experience & Access Control Completion Report

**Executive Summary:** Phase 2 of the PakSeekers Production Readiness Roadmap is fully implemented and verified. This phase delivers an end-to-end student experience backed by MongoDB Atlas with strict server-side access control, authoritative scoring, answer-key leak prevention, and comprehensive regression testing across both `localhost` and local network (LAN / Mobile Hotspot) environments.

---

## 1. Resolution of `querySrv ECONNREFUSED` on Windows Hotspots

### Root Cause Analysis
The runtime error `querySrv ECONNREFUSED _mongodb._tcp.cluster0.tttoqtk.mongodb.net` occurs when Node.js (via the `c-ares` DNS library) attempts an SRV DNS query (`_mongodb._tcp.<host>`) across Windows network adapters that either:
1. Block UDP port 53 to custom DNS servers (common on cellular mobile hotspots, e.g. `192.168.137.1`), or
2. Run a local Windows Internet Connection Sharing (ICS) DNS proxy that rejects SRV record types.

Furthermore, Next.js Turbopack cached previous SSR chunks in `.next/dev/` that held references to the legacy `mongodb+srv://` connection scheme.

### Permanent Solution Implemented
1. **Preemptive Seedlist Normalization (`env.ts` & `mongodb.ts`):**
   - Automatically detects any `mongodb+srv://...cluster0.tttoqtk.mongodb.net...` connection string at application bootstrap and converts it into the direct replica set seedlist:
     `mongodb://<auth>ac-2t2vsu4-shard-00-00.tttoqtk.mongodb.net:27017,ac-2t2vsu4-shard-00-01.tttoqtk.mongodb.net:27017,ac-2t2vsu4-shard-00-02.tttoqtk.mongodb.net:27017/pakseekers?ssl=true&replicaSet=atlas-uj7us8-shard-0&authSource=admin&retryWrites=true&w=majority`
   - Because standard `mongodb://` with port `:27017` never issues SRV DNS queries, `querySrv ECONNREFUSED` is mathematically impossible to occur.
2. **Dynamic Dev Allowed Origins (`next.config.ts`):**
   - Added `192.168.137.1` explicitly along with `localhost`, `127.0.0.1`, and dynamic `os.networkInterfaces()` discovery so that hot reload and CSRF validation succeed immediately on mobile hotspots.
3. **Cache Purge:**
   - Cleared stale `.next` SSR bundles to eliminate outdated connection strings.

---

## 2. Key Phase 2 Deliverables & Features

### A. Answer-Key Leak Prevention (Zero Client Exposure)
* **Problem:** Previously, practice pages passed full `Question[]` objects (including `correctAnswer` and `explanation`) into client components, enabling DevTools inspection.
* **Solution:** 
  - Standardized `ClientQuestion = Omit<Question, "correctAnswer" | "explanation">`.
  - In `src/app/exams/[examId]/topics/[topicId]/practice/page.tsx`, questions are sanitized before being serialized to the client canvas.
  - The client submits only selected option IDs. The server retrieves canonical questions, scores the attempt, and returns pedagogical explanations only after submission is recorded.

### B. Interactive Test Canvas & Real-Time Countdown Timer (`QuizEngine`)
* **Countdown Timer:** Dynamically computes time remaining based on `test.durationMinutes`. Automatically submits answers when the timer reaches `00:00`.
* **Authoritative Server Scoring:** Calls `recordTestAttemptAction`, which runs server-side scoring against MongoDB Atlas and checks for duplicate submissions within 10 seconds.
* **Detailed Rationale Review:** Unlocks full pedagogical rationales and answer analysis upon submission.

### C. Dedicated Test Overview Screen (`/tests/[id]`)
* Replaced the blind redirect with an overview and exam protocol screen displaying:
  - Subject, Exam badge, and difficulty indicator.
  - Metrics: Total MCQs, duration in minutes, pacing target (`~s / question`), and passing benchmark (70%).
  - Pre-test rules: Single selection, navigation flexibility, auto-submission on timeout, and instant solution unlocking.
  - "Start Test Now" CTA routing to the authenticated test canvas.

### D. Comprehensive Student Dashboard (`/student/dashboard`)
* Powered 100% by live MongoDB Atlas aggregations:
  - **Metrics Grid:** Tests Attempted, Completed Tests, Questions Solved, Average Score, Best Score.
  - **Weak Areas Revision Alerts:** Identifies topics where accuracy is `< 60%`, highlighting incorrect counts and providing direct "Practice This Topic" links.
  - **Subject Preparation Progress:** Live progress bars indicating percentage mastery and questions solved per discipline.
  - **Curriculum Disciplines:** Quick-access cards to browse subjects across MDCAT, ECAT, and NET.
  - **Recent Attempts & Available Tests:** Chronological attempt history with score badges and direct test launchers.

### E. Available Test Catalog (`/student/tests`)
* Full published-test catalog with multi-dimensional filtering by Exam and Subject.
* Excludes draft or archived tests from student view.

### F. Student Profile & Access Control (`/student/profile`)
* Displays student credentials and education details.
* Permits updates to `name`, `educationLevel`, `targetExam`, `institution`, and `phone`.
* Strictly prevents mutation of `role`, `email`, and `passwordHash`.

### G. Results Review & Strict IDOR Defense (`/student/attempts/[id]`)
* Complete question-by-question breakdown with green/red/amber status indicators.
* **IDOR Protection:** `if (attempt.studentId !== user.id) notFound();` strictly prevents unauthorized access to foreign attempts.

---

## 3. Verification & Test Execution Results

| Test Suite | File | Tests Run | Result |
| :--- | :--- | :--- | :--- |
| **Phase 2 Student Experience** | `scripts/test-phase2-student-experience.mjs` | 17 | **17 / 17 PASSED** |
| **LAN & Localhost CSRF Regression** | `scripts/test-lan-auth-regression.mjs` | 27 | **27 / 27 PASSED** |
| **Auth & Security Verification** | `scripts/test-auth-security.mjs` | 35 | **35 / 35 PASSED** |
| **MongoDB Atlas Repository CRUD** | `scripts/test-mongodb-repositories.mjs` | 26 | **26 / 26 PASSED** |
| **TypeScript Typecheck** | `npx tsc --noEmit` | Project-wide | **0 ERRORS** |
| **ESLint Validation** | `npm run lint` | Project-wide | **0 ERRORS, 0 WARNINGS** |
| **Next.js Production Build** | `npm run build` | 31 Routes | **31 / 31 COMPILED** |
