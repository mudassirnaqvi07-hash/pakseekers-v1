/**
 * Shared Components — barrel export.
 *
 * Shared components are cross-feature UI elements that are not generic
 * primitives (those live in components/ui) but are used across multiple
 * feature modules.
 */

// ---------------------------------------------------------------------------
// Layout shell (Phase 1)
// ---------------------------------------------------------------------------

export { AdminShell } from "./admin-shell";
export { AdminHeader } from "./admin-header";
export type { AdminHeaderProps } from "./admin-header";
export { AdminSidebar } from "./admin-sidebar";
export type { AdminSidebarProps } from "./admin-sidebar";

// ---------------------------------------------------------------------------
// Page-level shared components (Phase 1)
// ---------------------------------------------------------------------------

export { PageHeader } from "./page-header";
export type { PageHeaderProps } from "./page-header";

export { EmptyState } from "./empty-state";
export type { EmptyStateProps } from "./empty-state";
