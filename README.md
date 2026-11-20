# PakSeekers

PakSeekers is an entrance examination and competitive test preparation platform tailored for students across Pakistan. Built with Next.js App Router, React 19, TypeScript, Tailwind CSS, and MongoDB Atlas using the official MongoDB Node.js Driver.

## Architecture

PakSeekers follows a **Modular Monolith + Domain-Driven Design (DDD)** layered architecture:
`Presentation (app/)` → `Application Services (server/services/)` → `Data Access Layer (server/repositories/)` → `Database Connection Pool (server/db/)` → `MongoDB Atlas`.

## Deployment Workflow

- **Local Development**: Runs with `.env.local` connected to the development database (`pakseekers_dev`).
- **GitHub CI**: Runs automated validation (`npm ci`, `npm run lint`, `npx tsc --noEmit`, `npm run build`) on every push and pull request to `develop` or `main`.
- **Production**: Merges into `main` automatically trigger a production deployment on Vercel, connected to the production database (`pakseekers`).

## Development

Requirements: Node.js 20+ and access to MongoDB Atlas cluster.

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables in `.env.local` (refer to `.env.example`):
   ```bash
   MONGODB_URI="mongodb+srv://<user>:<password>@cluster0.tttoqtk.mongodb.net/?retryWrites=true&w=majority"
   MONGODB_DB="pakseekers_dev"
   ADMIN_ENTRY_PATH="/admin-gate"
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="465"
   SMTP_SECURE="true"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASSWORD="your-app-password"
   SMTP_FROM="PakSeekers <your-email@gmail.com>"
   APP_URL="http://localhost:3000"
   ```
3. Seed development database (if fresh):
   ```bash
   npm run db:migrate
   ```
4. Verify database connectivity:
   ```bash
   npm run db:verify
   ```
5. Run automated repository integration tests:
   ```bash
   npm run test:db
   ```
6. Start development server:
   ```bash
   npm run dev
   ```

## Quality Assurance & Verification

- `npm run lint` — Runs ESLint across the codebase.
- `npx tsc --noEmit` — Type-checks TypeScript without emitting files.
- `npm run test:db` — Automated 26-test MongoDB repository integration suite.
- `npm run test:auth` — Automated 35-test authentication & security suite.
- `npm run test:verify` — Automated 20-test student email verification & SMTP suite.
- `npm run test:lan` — Automated 49-test LAN/Localhost portal isolation suite.
- `npm run build` — Compiles optimized production bundle with Turbopack.

## Project Documentation

- [Architecture Reference](docs/ARCHITECTURE.md)
- [Development Rules](docs/DEVELOPMENT-RULES.md)
- [Design System](docs/DESIGN-SYSTEM.md)
- [Roadmap](docs/ROADMAP.md)
- [Phase 1 Completion Report](docs/PHASE-1-COMPLETION-REPORT.md)
