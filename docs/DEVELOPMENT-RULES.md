# PakSeekers — Development Rules

## 1. Purpose

These rules define how PakSeekers is developed and maintained.

They apply to all developers and AI coding agents, including Codex, GitHub Copilot, and future development tools.

The primary goals are:

* Maintainability
* Scalability
* Security
* Consistency
* Testability
* Easy future upgrades
* Controlled AI-assisted development

---

## 2. Read Before Modifying

Before making any changes, an AI agent must inspect:

1. `docs/ARCHITECTURE.md`
2. `docs/DEVELOPMENT-RULES.md`
3. `docs/DESIGN-SYSTEM.md`
4. `docs/ROADMAP.md`
5. Relevant existing feature code

An agent must understand the existing implementation before modifying it.

---

## 3. Scope Control

Agents must work only on the requested task.

Do not:

* Rewrite unrelated modules
* Refactor unrelated code
* Change the database architecture unnecessarily
* Introduce new frameworks without approval
* Add future features prematurely
* Modify working functionality without a clear reason

If an architectural change is necessary, explain the reason before implementing it.

---

## 4. Technology Rules

Primary stack:

* Next.js
* TypeScript
* App Router
* Tailwind CSS
* PostgreSQL
* Prisma
* Zod
* React Hook Form
* Lucide React

Use the existing stack whenever possible.

Do not introduce another library simply because it is convenient.

Before adding a dependency, determine whether the existing stack can solve the requirement.

---

## 5. TypeScript Rules

Use TypeScript throughout the application.

Avoid `any`.

Prefer:

* Explicit types
* Interfaces where appropriate
* Type inference where safe
* Shared domain types
* Zod schemas for runtime validation

Do not disable TypeScript safety to make an implementation easier.

---

## 6. Component Rules

Components should have clear responsibilities.

Prefer:

```text
Presentation
    ↓
Feature logic
    ↓
Server/service layer
    ↓
Database
```

Do not place large amounts of business logic inside UI components.

Create reusable components when the same behavior or UI is used in multiple places.

Do not create unnecessary abstractions for one-time code.

---

## 7. Feature Organization

Business functionality should be organized by domain.

Examples:

```text
features/
├── auth/
├── tests/
├── sections/
├── topics/
├── lessons/
├── questions/
├── mock-tests/
├── students/
└── reports/
```

A feature should contain its own related logic where practical.

Avoid creating one enormous global folder containing unrelated business logic.

---

## 8. Database Rules

PostgreSQL is the primary database.

Prisma is the ORM.

Database access must not be performed directly from presentation components.

Use proper:

* Primary keys
* Foreign keys
* Relationships
* Constraints
* Indexes
* Timestamps

Do not use names as primary identifiers.

Do not duplicate relational data unnecessarily.

Do not store derived data unless there is a clear performance or reporting reason.

---

## 9. Data Integrity

Validate data at multiple levels where appropriate:

```text
Client validation
        ↓
Server validation
        ↓
Database constraints
```

Never trust client-side validation alone.

Important business rules must be enforced on the server.

---

## 10. Business Logic

Business rules must be centralized.

For example, question publishing should not be implemented differently on five different pages.

Use reusable server-side logic.

Example:

```text
QuestionService
    ├── createQuestion()
    ├── updateQuestion()
    ├── publishQuestion()
    ├── archiveQuestion()
    └── validateQuestion()
```

---

## 11. No Hard-Coded Business Data

Do not hard-code:

* Tests
* Subjects
* Topics
* Questions
* Students
* Dashboard statistics
* Mock tests

Business data belongs in the database.

For example, do not write:

```text
const tests = ["NAT", "PU Entry Test"];
```

when the information belongs in the database.

---

## 12. Configuration

Configuration must use environment variables.

Never hard-code:

* Database credentials
* Authentication secrets
* API keys
* Private tokens

Maintain:

```text
.env
.env.example
```

Never commit `.env`.

---

## 13. API / Server Rules

Server-side operations must:

* Validate input
* Authenticate users where required
* Authorize actions
* Handle errors
* Return predictable results

Do not trust IDs, roles, permissions, or other sensitive values supplied by the client.

---

## 14. Authentication and Authorization

Authentication and authorization are separate concepts.

Authentication determines:

> Who is the user?

Authorization determines:

> What is the user allowed to do?

Every protected server operation must verify authorization.

Do not rely only on hiding buttons in the UI.

---

## 15. Error Handling

Errors must be handled intentionally.

Do not silently swallow errors.

Provide:

* User-friendly UI errors
* Useful server logs
* Appropriate HTTP/status handling
* Validation feedback

Never expose sensitive server information to users.

---

## 16. Loading and Empty States

Every data-driven interface should handle:

* Loading
* Empty
* Error
* Success

Example:

```text
Loading questions...

No questions found.

Unable to load questions.

25 questions loaded.
```

Do not leave users staring at blank screens.

---

## 17. UI Rules

All UI must follow the PakSeekers Design System.

Do not randomly select colors, spacing, typography, or component styles.

Use reusable UI components and design tokens.

Avoid:

* Excessive gradients
* Excessive shadows
* Neon colors
* Unnecessary animations
* Inconsistent border radii
* Random colors
* Gaming-style interfaces

---

## 18. Accessibility

Use semantic HTML.

All important controls must be keyboard accessible.

Forms must have proper labels.

Interactive elements must have understandable names.

Do not communicate important information through color alone.

Maintain sufficient contrast.

---

## 19. Security

Follow secure development practices.

Never:

* Store plaintext passwords
* Expose secrets
* Trust client authorization
* Construct unsafe database queries
* Log sensitive credentials
* Return sensitive information unnecessarily

Validate and sanitize external input where appropriate.

---

## 20. Performance

Prefer simple, efficient implementations.

Avoid:

* Unnecessary database queries
* Fetching large datasets unnecessarily
* Excessive client-side rendering
* Unnecessary dependencies
* Repeated expensive calculations

Use pagination for large datasets.

Use indexes for frequently queried database fields when appropriate.

---

## 21. Testing

New business-critical functionality should include appropriate tests.

At minimum, verify:

* Valid input
* Invalid input
* Authorization
* Main success path
* Important edge cases

Before completing a task, run:

```bash
npm run lint
npx tsc --noEmit
```

Run the relevant tests when available.

---

## 22. Git Rules

Use meaningful commits.

Examples:

```text
feat: add test management
feat: add question publishing
fix: prevent duplicate question options
refactor: extract question service
docs: update architecture
```

Do not commit:

* `.env`
* Secrets
* Temporary files
* Debug output
* Build artifacts

Agents should not rewrite Git history unless explicitly instructed.

---

## 23. Migration Rules

Database schema changes must be deliberate.

Never modify production database structure manually without documenting the change.

Use Prisma migrations.

Before changing the schema:

1. Understand existing relationships.
2. Check dependent features.
3. Make the smallest appropriate change.
4. Create a migration.
5. Test the migration.

---

## 24. Backward Compatibility

When modifying existing functionality, preserve existing behavior unless the task explicitly requires a breaking change.

Do not rename or remove database fields, APIs, or components casually.

If a breaking change is necessary, document it.

---

## 25. AI Agent Rules

AI agents must:

1. Inspect existing code first.
2. Understand the relevant architecture.
3. Make the smallest reasonable change.
4. Avoid unrelated modifications.
5. Reuse existing components.
6. Reuse existing utilities.
7. Follow existing naming conventions.
8. Follow the design system.
9. Validate their implementation.
10. Report files changed.
11. Report dependencies added.
12. Report tests/checks performed.
13. Identify remaining issues.

AI agents must not assume that generated code is automatically correct.

---

## 26. No Fake Functionality

Do not create buttons that appear functional but do nothing.

Do not use fake API responses for implemented features.

Do not hard-code fake statistics into production UI.

If a feature is not implemented, clearly mark it as unavailable rather than pretending it works.

---

## 27. Documentation Rules

Architectural decisions must be documented.

Update documentation when:

* Architecture changes
* Database architecture changes
* New major domain is introduced
* New technology is introduced
* Major design-system changes occur

Documentation should remain concise and current.

---

## 28. Future-Proofing

Build for future expansion without over-engineering.

The system should eventually support:

* Multiple tests
* Multiple educational domains
* Large question banks
* Student accounts
* Progress tracking
* Personalized learning
* AI features
* Mobile applications
* Premium features

However, do not implement future features before they are required.

The rule is:

**Design for expansion, implement only what is currently needed.**

---

## 29. Definition of Done

A feature is not complete merely because the code compiles.

A feature is complete when:

* Required functionality works
* Validation works
* Authorization works
* UI follows the design system
* Loading/error/empty states exist where required
* TypeScript passes
* Lint passes
* Relevant tests pass
* No unrelated functionality is broken
* Documentation is updated when necessary
