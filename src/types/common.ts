/**
 * Common utility types shared across the application.
 *
 * Keep this file for genuinely cross-cutting types only.
 * Domain-specific types belong inside their respective feature modules.
 */

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

/** Makes a type nullable (T | null). */
export type Nullable<T> = T | null;

/** Makes a type optional (T | undefined). */
export type Optional<T> = T | undefined;

/** Deep partial — makes all nested properties optional. */
export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

// ---------------------------------------------------------------------------
// Server result types
// ---------------------------------------------------------------------------

/**
 * Standard result type for server operations (Server Actions / services).
 * Use this instead of throwing errors from server actions.
 *
 * @example
 * const result: ActionResult<Question> = await createQuestion(data);
 * if (!result.success) { showError(result.error); }
 */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Sort / Filter
// ---------------------------------------------------------------------------

export type SortOrder = "asc" | "desc";

export interface SortParams {
  field: string;
  order: SortOrder;
}
