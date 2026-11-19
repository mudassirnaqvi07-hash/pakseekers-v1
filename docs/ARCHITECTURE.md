# PakSeekers — Architecture Reference

> Last updated: 2026-10-12
> Pattern: Modular Monolith + Domain-Driven Feature Organization

---

## Guiding Principle

```text
"Modular enough to scale.
Simple enough to maintain.
Structured enough for AI agents.
Separated enough to evolve."
```

---

## Layer Stack

```text
Browser / Client Components
        ↓
app/  (Routes, Pages, Layouts — Next.js App Router)
        ↓
server/services/  (Application / Service Layer)
        ↓
server/repositories/  (Data Access Layer)
        ↓
server/db/  (Centralized MongoDB Driver Singleton & Connection Pool)
        ↓
MongoDB Atlas Cluster  (Database: pakseekers)
```

**Rule:** Each layer only imports from the layer directly below it. Pages never import repositories directly.

---

## Directory Map

```text
src/
├── app/                          ← Routes, pages, layouts ONLY
│   ├── page.tsx                  ← Landing page
│   ├── admin/                    ← Admin CMS routes
│   │   └── tests/
│   │       ├── import/           ← Quiz Importer route (JSON MCQ import)
│   ├── exams/                    ← Public exam catalog routes
│   ├── student/                  ← Student portal routes
│   └── tests/[id]/               ← Test entry bridge (auth redirect)
│
├── components/
│   ├── ui/                       ← Generic primitives: Button, Card, Badge, Input, etc.
│   └── shared/                   ← Cross-feature app components: PageHeader, EmptyState
│
├── features/                     ← Business functionality by domain
│   ├── admin/
│   │   └── components/           ← Admin CMS form components, QuizImporter, layout shell
│   ├── auth/
│   │   └── schemas/              ← Auth Zod schemas (canonical)
│   ├── content/
│   │   └── schemas/              ← Content Zod schemas + Quiz Import schemas
│   ├── exams/
│   │   ├── components/           ← ExamCard, SubjectCard, TopicCard
│   │   └── services/             ← Re-exports → server/services/content-service
│   ├── practice/
│   │   ├── components/           ← QuizEngine, QuizProgress, QuizNavigation, etc.
│   │   └── utils/evaluator.ts    ← Re-exports evaluateQuiz from server/services/content-service
│   └── student/
│       └── components/           ← StudentNav, login/register/profile forms
│
├── server/
│   ├── actions/
│   │   ├── auth-actions.ts       ← Student/Admin login, register, logout, profile update
│   │   ├── attempt-actions.ts    ← Test attempt persistence (recordTestAttemptAction)
│   │   └── content-actions.ts    ← Admin content CRUD + importQuizAction
│   ├── auth/
│   │   ├── password.ts           ← Scrypt password hashing & constant-time verification
│   │   ├── tokens.ts             ← 256-bit session token generator & SHA-256 token hashing
│   │   ├── rate-limiter.ts       ← Sliding-window brute-force login rate limiter
│   │   └── session.ts            ← Cookie management & route guards (requireStudent, requireAdmin)
│   ├── db/                       ← Database Connection & Schema Management
│   │   ├── mongodb.ts            ← Centralized MongoClient singleton, pooling, SRV resilience
│   │   ├── schema.ts             ← Collections, Document types, Index manager, DTO mappers
│   │   └── index.ts              ← Barrel export
│   ├── services/                 ← Application/service layer (business rules)
│   │   ├── auth-service.ts       ← User authentication, registration, session management, RBAC
│   │   ├── content-service.ts    ← Canonical content API + evaluateQuiz (SINGLE SOURCE OF TRUTH)
│   │   └── user-service.ts       ← Student data API (dashboard stats, attempts)
│   └── repositories/             ← Data access layer (native MongoDB operations)
│       ├── content-repository.ts ← MongoDB collections: exams, subjects, topics, questions, tests
│       └── user-repository.ts    ← MongoDB collections: users, sessions, test_attempts
│
├── lib/
│   ├── config/
│   │   ├── app.ts                ← App constants (APP_NAME, PAGINATION, etc.)
│   │   └── env.ts                ← Env variable validation (Zod)
│   ├── utils/cn.ts               ← className helper
│   └── validations/              ← Source schemas
│       ├── auth.ts               ← Auth schemas
│       ├── question.ts           ← Content schemas
│       └── quiz-import.ts        ← Quiz JSON import schemas & normalizer
│
├── types/
│   ├── common.ts                 ← Shared utility types: ActionResult, Pagination, etc.
│   ├── content.ts                ← Academic content models: Exam, Subject, Topic, Question, Test
│   ├── auth.ts                   ← User, UserSession, TestAttempt, StudentProfile
│   └── index.ts                  ← Barrel export
│
├── data/
│   └── backups/                  ← Verified immutable backups of JSON stores
│
├── scripts/
│   ├── verify-mongodb.mjs        ← Standalone Atlas health check and ping test
│   ├── migrate-json-to-mongodb.mjs ← Idempotent JSON-to-Atlas migration runner
│   └── test-mongodb-repositories.mjs ← 26-test automated integration test suite
│
└── proxy.ts                      ← Route authorization (edge-level auth guard)
```

---

## Layer Rules

### app/ Pages
- Call `server/services/*` for data
- Call `server/actions/*` for mutations
- **Never** import from `server/repositories/*` or `server/db/*`
- **Never** contain business logic

### server/services/
- Contain domain rules, defaults, and evaluation logic
- Call `server/repositories/*` for persistence
- **Never** import React or Next.js presentation APIs

### server/repositories/
- Handle all storage I/O with native MongoDB collections
- Return plain domain objects (not HTTP responses)
- **Never** import from services (no upward coupling)

### features/*/components/
- UI components for a specific domain
- Call server actions via form actions / `useTransition`
- **Never** import from other feature's internal implementation

---

## Authentication & Authorization (Phase 2 Architecture)

| Layer | Component | Mechanism / Security Control |
|---|---|---|
| **Edge Proxy** | `src/proxy.ts` | Optimistic cookie-presence check (`pakseekers_session`) — redirects unauthenticated requests before page execution |
| **Server Components** | `requireStudent()`, `requireAdmin()`, `getCurrentUser()` | Resolves session token from cookie, hashes token via SHA-256, validates active session in MongoDB, verifies role |
| **Server Actions** | `auth-actions.ts`, `content-actions.ts`, `attempt-actions.ts` | Authoritative session re-verification; student mutations use verified `user.id` (IDOR defense); admin mutations require verified `admin` role |
| **Application Service** | `src/server/services/auth-service.ts` | Centralizes authentication workflows, rate-limiting enforcement, and session issuance |
| **Password Security** | `src/server/auth/password.ts` | Scrypt password hashing with 16-byte random salt and 64-byte key; constant-time verification |
| **Token Security** | `src/server/auth/tokens.ts` | 256-bit cryptographically secure session tokens; SHA-256 token hashing for database persistence |
| **Rate Limiter** | `src/server/auth/rate-limiter.ts` | Brute-force lockout: 5 failed attempts per 15-minute window per normalized identity |

### Session Security Model

1. **Hashed Sessions in MongoDB:** Raw 256-bit session tokens are stored ONLY in the client's HTTP-only cookie. MongoDB stores exclusively the SHA-256 hash of the token (`tokenHash`). In the event of a database compromise, session tokens cannot be stolen or replayed.
2. **Session Fixation Prevention:** Any pre-existing session associated with the client cookie is invalidated in MongoDB upon new authentication before issuing a fresh session.
3. **Cookie Attributes:**
   - `HttpOnly: true` (inaccessible to client JavaScript / XSS protection)
   - `Secure: process.env.NODE_ENV === "production"` (TLS transmission only)
   - `SameSite: "lax"` (defense against CSRF)
   - `Path: "/"`
   - `MaxAge: 7 * 24 * 60 * 60` (7 days)
4. **Data Sanitization (`SafeUser`):** The `passwordHash` field is never included in sanitized user entities returned to presentation components.

---

## Persistence Architecture (Phase 1 Finalized)

PakSeekers uses **MongoDB Atlas + the Official MongoDB Node.js Driver (`mongodb`)** as its sole persistence engine.

1. **Zero Prisma**: Prisma dependencies (`@prisma/client`, `prisma`), `prisma/` schema, `prisma7.config.ts`, and `src/generated/` have been completely removed.
2. **Centralized Connection**: Single `MongoClient` instance managed by `src/server/db/mongodb.ts` with connection pooling (`minPoolSize: 2`, `maxPoolSize: 10`) and HMR global caching.
3. **Automated Indexes**: 17 indexes across 8 collections created and verified automatically via `ensureMongoIndexes()`.
4. **Idempotent Migration**: JSON data safely migrated into Atlas and preserved under `src/data/backups/`.

---

## Schema Locations

| Domain | Canonical Schema Path |
|---|---|
| Auth (login, register, profile) | `features/auth/schemas/auth-schemas.ts` |
| Content (Exam/Subject/Topic/Question/Test) | `features/content/schemas/content-schemas.ts` |
| Quiz JSON Importer | `lib/validations/quiz-import.ts` (re-exported via `features/content/schemas/content-schemas.ts`) |
| Source schemas | `lib/validations/auth.ts` and `lib/validations/question.ts` |

---

## Decision Log

| Decision | Reason |
|---|---|
| File-backed JSON store (Phase 1) | Allows full app development without DB setup. Repository layer isolates the change. |
| proxy.ts not middleware.ts | Next.js 16+ renamed middleware to proxy. Cookie-presence check only — actual validation in DAL. |
| evaluateQuiz in content-service | Business domain logic belongs in the service layer, not in UI utilities. `features/practice/utils/evaluator.ts` re-exports for backward compat. |
| recordTestAttemptAction extracted | Single responsibility — `auth-actions` handles auth, `attempt-actions` handles activity persistence. |
| Admin shell in features/admin | Admin-specific layout components are not shared UI primitives. `components/shared` re-exports for backward compat. |
| Quiz Importer native integration | Reuses existing question/test models and atomic repository writes without creating a parallel quiz system. |

---

## Quiz Importer Specification

The **Quiz Importer** (`/admin/tests/import`) allows administrators to paste JSON-formatted MCQs and automatically generate structured, playable quizzes while populating the reusable question bank.

### Supported JSON Schema

```json
{
  "title": "Introduction to Programming & Web Basics",
  "description": "Essential diagnostic quiz covering foundational computing and web technologies.",
  "durationMinutes": 15,
  "difficulty": "medium",
  "questions": [
    {
      "question": "Which language is commonly used for interactive front-end web development?",
      "options": [
        "JavaScript",
        "HTML",
        "CSS",
        "SQL"
      ],
      "correctAnswer": "JavaScript",
      "explanation": "JavaScript is the primary scripting language used to provide dynamic and interactive behavior in web browsers.",
      "difficulty": "medium"
    },
    {
      "question": "What does CPU stand for in computer architecture?",
      "options": [
        "Central Processing Unit",
        "Computer Personal Unit",
        "Central Program Utility",
        "Control Processing User"
      ],
      "correctAnswer": "Central Processing Unit",
      "explanation": "The Central Processing Unit (CPU) is the primary component of a computer that executes program instructions."
    }
  ]
}
```

### Schema Rules & Normalization

1. **Top-Level Attributes**:
   * `title` *(string, min 3 chars)*: Quiz title (pre-fills the test builder; overridable in preview).
   * `description` *(string, optional)*: Quiz summary.
   * `durationMinutes` *(number, optional)*: Estimated test duration in minutes (defaults to ~1.5 min per MCQ, min 5).
   * `difficulty` *(string, optional)*: `"easy"` | `"medium"` | `"hard"` | `"mixed"` (defaults to `"medium"`).
   * `questions` *(array, 1 to 100 questions)*: Collection of multiple choice questions.
2. **Question Attributes**:
   * `question` *(string, min 5 chars)*: Question stem.
   * `options` *(array of strings or `{ text, label }` objects, 2 to 8 items)*: All options must be unique (case-insensitive check).
   * `correctAnswer` *(string or number)*: Resolves by:
     - Exact or case-insensitive option text (e.g. `"JavaScript"`)
     - Option presentation label (e.g. `"A"`, `"B"`, `"C"`, `"D"`)
     - 0-based or 1-based index (e.g. `0`, `1`, `2`)
     - Option ID (e.g. `"opt-1"`)
   * `explanation` *(string, min 5 chars)*: Pedagogical explanation displayed in results.
   * `difficulty` *(string, optional)*: `"easy"` | `"medium"` | `"hard"` (inherits quiz difficulty if omitted).
3. **Atomicity & Persistence**:
   * Parsed questions are persisted as standalone `Question` entities in `store.questions`.
   * A parent `Test` entity is created with `questionIds: [...]` referencing the newly created questions.
   * All questions and the test are committed atomically via `importQuizWithQuestions` in `content-repository.ts`.
4. **Student Playability**:
   * Stored quizzes appear immediately in topic pages and are attempted through `/exams/[examId]/topics/[topicId]/practice?testId=[id]` and `/tests/[id]`.
   * Standard student authentication, attempt tracking, scoring, and results tracking remain identical.
