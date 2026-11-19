/**
 * Shared Components — barrel export.
 *
 * Shared components are cross-feature UI elements that are not generic
 * primitives (those live in components/ui) but are used across multiple
 * feature modules.
 *
 * Admin shell components are canonically located at features/admin/components/.
 * These re-exports preserve backward compatibility.
 */

// ---------------------------------------------------------------------------
// Admin layout shell — canonical: features/admin/components/
// ---------------------------------------------------------------------------

export { AdminShell } from "@/features/admin/components/admin-shell";
export { AdminHeader } from "@/features/admin/components/admin-header";
export type { AdminHeaderProps } from "@/features/admin/components/admin-header";
export { AdminSidebar } from "@/features/admin/components/admin-sidebar";
export type { AdminSidebarProps } from "@/features/admin/components/admin-sidebar";

// ---------------------------------------------------------------------------
// Page-level shared components
// ---------------------------------------------------------------------------

export { PageHeader } from "./page-header";
export type { PageHeaderProps } from "./page-header";

export { EmptyState } from "./empty-state";
export type { EmptyStateProps } from "./empty-state";

export { BrandLogo } from "./brand-logo";
export type { BrandLogoProps } from "./brand-logo";

