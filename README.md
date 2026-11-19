# PakSeekers

PakSeekers is an entrance examination and competitive test preparation platform tailored for students across Pakistan. Built with Next.js App Router, React 19, TypeScript, Tailwind CSS, and MongoDB Atlas using the official MongoDB Node.js Driver.

## Architecture

PakSeekers follows a **Modular Monolith + Domain-Driven Design (DDD)** layered architecture:
`Presentation (app/)` → `Application Services (server/services/)` → `Data Access Layer (server/repositories/)` → `Database Connection Pool (server/db/)` → `MongoDB Atlas`.

## Development

Requirements: Node.js 20+ and access to MongoDB Atlas cluster (`pakseekers` database).

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables in `.env` (refer to `.env.example`):
   ```bash
   MONGODB_URI="mongodb+srv://<user>:<password>@cluster0.tttoqtk.mongodb.net/?retryWrites=true&w=majority"
   MONGODB_DB="pakseekers"
   SESSION_SECRET="your-32-character-secret"
   ```
3. Verify database connectivity:
   ```bash
   npm run db:verify
   ```
4. Run automated repository integration tests:
   ```bash
   npm run test:db
   ```
5. Start development server:
   ```bash
   npm run dev
   ```

## Quality Assurance & Verification

- `npm run lint` — Runs ESLint across the codebase.
- `npx tsc --noEmit` — Type-checks TypeScript without emitting files.
- `npm run test:db` — Automated 26-test MongoDB repository integration suite.
- `npm run build` — Compiles optimized production bundle with Turbopack.
CI/CD pipeline verification test.
## Project Documentation

- [Architecture Reference](docs/ARCHITECTURE.md)
- [Development Rules](docs/DEVELOPMENT-RULES.md)
- [Design System](docs/DESIGN-SYSTEM.md)
- [Roadmap](docs/ROADMAP.md)
- [Phase 1 Completion Report](docs/PHASE-1-COMPLETION-REPORT.md)

