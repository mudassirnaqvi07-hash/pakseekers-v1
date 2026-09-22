# PakSeekers — Architecture Specification

## 1. Architecture Objective

PakSeekers will use a scalable **modular monolith architecture** during the initial development stages.

The architecture should provide:

* Clear separation of concerns
* Easy feature development
* Simple deployment
* Low operational complexity
* Strong database consistency
* Easy AI-assisted development
* Future migration to distributed services if genuinely required

Microservices are not part of the initial architecture.

---

## 2. Technology Stack

Frontend and application:

* Next.js
* TypeScript
* App Router
* Tailwind CSS

Backend/application services:

* Next.js server-side functionality
* Server Actions and/or Route Handlers
* Service layer for business logic

Database:

* PostgreSQL

ORM:

* Prisma

Validation:

* Zod

Forms:

* React Hook Form

Icons:

* Lucide React

Charts:

* Recharts where required

---

## 3. High-Level Architecture

```text
                    PakSeekers
                         │
                    Next.js App
                         │
            ┌────────────┴────────────┐
            │                         │
        Presentation              Application
            │                         │
        Components              Services/Actions
            │                         │
            └────────────┬────────────┘
                         │
                       Prisma
                         │
                    PostgreSQL
```

---

## 4. Architectural Principle

The fundamental principle is:

**Code defines how PakSeekers works. Database content defines what PakSeekers contains.**

For example, adding:

```text
NAT
PU Entry Test
LGAT
```

must not require changing application logic.

A new test should be created through data.

---

## 5. Repository Structure

```text
src/
├── app/
│
├── components/
│   ├── ui/
│   └── shared/
│
├── features/
│   ├── auth/
│   ├── tests/
│   ├── sections/
│   ├── topics/
│   ├── lessons/
│   ├── questions/
│   ├── mock-tests/
│   ├── students/
│   └── reports/
│
├── lib/
│   ├── validations/
│   ├── utils/
│   └── configuration/
│
├── server/
│   ├── services/
│   └── repositories/
│
└── types/

prisma/
├── schema.prisma
└── seed.ts

docs/
```

---

## 6. App Layer

`src/app/`

Contains:

* Routes
* Layouts
* Pages
* Route handlers
* Server actions where appropriate

The App Router should primarily coordinate application behavior rather than contain large amounts of business logic.

---

## 7. Components

`src/components/`

Contains reusable UI.

Examples:

```text
Button
Input
Modal
Dialog
Table
Badge
Card
FormField
Pagination
Toast
```

Shared components should not contain feature-specific business logic.

---

## 8. Feature Modules

`src/features/`

Contains business-domain functionality.

Example:

```text
features/questions/
├── components/
├── schemas/
├── services/
├── types/
└── utils/
```

The exact internal structure may evolve as the project grows.

---

## 9. Server Layer

`src/server/`

Contains server-side business logic.

Example:

```text
server/services/question-service.ts
server/services/test-service.ts
```

Services handle business operations such as:

```text
createQuestion()
updateQuestion()
publishQuestion()
archiveQuestion()
```

---

## 10. Database Layer

Prisma is responsible for database access.

Application code should not construct raw SQL unless there is a documented reason.

Database operations should be centralized where practical.

---

## 11. Core Domain Model

The initial content architecture is:

```text
Test
 │
 ├── Section
 │     │
 │     └── Topic
 │           │
 │           ├── Lesson
 │           │
 │           └── Question
 │                 │
 │                 └── QuestionOption
 │
 └── MockTest
       │
       └── MockTestQuestion
```

---

## 12. Student Data Separation

Content and student activity must remain separate.

Content:

```text
Test
Section
Topic
Lesson
Question
QuestionOption
MockTest
```

Student activity:

```text
User
Attempt
QuestionAttempt
Progress
SavedQuestion
QuestionReport
```

Do not store student-specific answers inside question-content entities.

---

## 13. Question Architecture

A question belongs to:

```text
Test
Section
Topic
```

A question contains:

```text
Question text
Options
Correct answer
Explanation
Difficulty
Status
```

Question lifecycle:

```text
DRAFT
  ↓
REVIEW
  ↓
PUBLISHED
  ↓
ARCHIVED
```

---

## 14. Test Architecture

A test is a first-class entity.

Example:

```text
Test
├── NAT
├── PU Entry Test
├── LGAT
└── Future Tests
```

Do not create test-specific code.

---

## 15. Authentication Boundary

Authentication and authorization should be centralized.

Roles may initially include:

```text
ADMIN
STUDENT
```

Future roles may include:

```text
CONTENT_EDITOR
CONTENT_REVIEWER
SUPER_ADMIN
```

Do not implement these roles until required.

---

## 16. Admin Boundary

The initial admin system manages:

```text
Tests
Sections
Topics
Lessons
Questions
Mock Tests
Students
Reports
```

The admin interface must not become tightly coupled to the future student interface.

---

## 17. Student Boundary

The future student application will consume the same underlying content.

Example:

```text
Admin creates Question
        ↓
Question stored in PostgreSQL
        ↓
Question published
        ↓
Student Practice retrieves published question
```

This allows the admin and student systems to evolve independently at the UI level.

---

## 18. API Design

Use predictable server operations.

Example:

```text
Tests
GET
POST
PATCH
DELETE

Questions
GET
POST
PATCH
DELETE
PUBLISH
ARCHIVE
```

Exact implementation may use Route Handlers or Server Actions depending on the use case.

Do not expose internal database structures unnecessarily.

---

## 19. Scalability Strategy

Initial:

```text
One Next.js application
One PostgreSQL database
One deployment
```

Future:

```text
Next.js application
        │
        ├── Admin
        ├── Student
        └── Public
              │
          Application Services
              │
          PostgreSQL
```

If traffic or organizational requirements eventually justify it, individual services can later be extracted.

Do not prematurely distribute the application.

---

## 20. Caching Strategy

Caching should be introduced only where required.

Potential future candidates:

* Published test structures
* Topic lists
* Frequently accessed questions
* Public content

Do not introduce Redis solely because the system may eventually need it.

---

## 21. File Storage

Future uploaded assets may include:

* Lesson images
* PDFs
* Question images

These should eventually use external object storage rather than storing large binary files directly inside PostgreSQL.

The specific provider can be selected later.

---

## 22. Observability

Future production deployment should include:

* Error logging
* Application monitoring
* Database monitoring
* Performance monitoring
* Audit logs

Only implement the level required by the current deployment stage.

---

## 23. Architectural Rule

The system should follow:

**Simple now, extensible later.**

Avoid both:

```text
Poor structure → difficult future changes
```

and:

```text
Premature complexity → difficult current development
```

The correct target is a clean modular monolith.
