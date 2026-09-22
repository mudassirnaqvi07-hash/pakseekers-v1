/**
 * Application-level constants.
 *
 * These are stable configuration values that do not change between environments.
 * Environment-specific values (database URLs, secrets) belong in env.ts.
 */

export const APP_NAME = "PakSeekers" as const;
export const APP_VERSION = "0.1.0" as const;
export const APP_DESCRIPTION =
  "Pakistan's scalable test-preparation platform for university entry tests and job assessments." as const;

/** Pagination defaults — used by all list endpoints. */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;
