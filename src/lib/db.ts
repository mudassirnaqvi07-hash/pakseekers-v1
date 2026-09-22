/**
 * Prisma Client Singleton
 *
 * Prisma ORM v7 requires a driver adapter. This singleton is the foundation
 * module — the adapter will be wired during Phase 2 (Database + Core Domain).
 *
 * In Next.js development mode, hot-reloading can cause multiple Prisma Client
 * instances to be created, exhausting connection pools. This singleton pattern
 * prevents that by reusing the global instance across hot reloads.
 *
 * Usage (server-side only — never in Client Components):
 *   import { db } from "@/lib/db";
 *
 * PHASE 2 TODO: Wire a driver adapter (@prisma/adapter-pg or similar) when
 * database models are defined and migrations are run.
 *
 * @see docs/ARCHITECTURE.md — Database Layer
 * @see docs/ROADMAP.md — Phase 2
 */

// Re-export the PrismaClient type for use in service layer type annotations.
export type { PrismaClient } from "../generated/prisma/client";

/**
 * Placeholder db export.
 *
 * A real PrismaClient instance requires a driver adapter (Prisma v7).
 * This will be replaced in Phase 2 once the schema has models and
 * a proper adapter is configured.
 *
 * Services that need database access should import from this module so that
 * switching to the real client requires no changes in callers.
 */
export const db = null as unknown as import("../generated/prisma/client").PrismaClient;
