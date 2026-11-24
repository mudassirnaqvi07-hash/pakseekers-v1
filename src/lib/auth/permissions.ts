/**
 * Centralized Permission Registry & Role Access Policy — PakSeekers RBAC.
 *
 * Pure TypeScript module (safe for both Server Components, Actions, APIs, and Client UI).
 * Defines all 32 granular permissions across 8 permission groups, default role mappings,
 * and deterministic permission evaluation helpers.
 */

import type { Permission, UserRole } from "@/types/auth";

export interface PermissionDefinition {
  key: Permission;
  label: string;
  description: string;
  adminOnly?: boolean;
}

export interface PermissionGroup {
  id: string;
  title: string;
  description: string;
  adminOnlyGroup?: boolean;
  permissions: PermissionDefinition[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: "exams",
    title: "Exam Management",
    description: "Create, inspect, update, and remove examination tracks.",
    permissions: [
      { key: "EXAM_VIEW", label: "View Exams", description: "Browse and inspect examination tracks." },
      { key: "EXAM_CREATE", label: "Create Exams", description: "Add new examination tracks." },
      { key: "EXAM_EDIT", label: "Edit Exams", description: "Modify exam titles, codes, and subject mappings." },
      { key: "EXAM_DELETE", label: "Delete Exams", description: "Remove examination tracks." },
    ],
  },
  {
    id: "subjects",
    title: "Subject Management",
    description: "Organize curriculum subjects across examinations.",
    permissions: [
      { key: "SUBJECT_VIEW", label: "View Subjects", description: "Browse and inspect subjects." },
      { key: "SUBJECT_CREATE", label: "Create Subjects", description: "Add new academic subjects." },
      { key: "SUBJECT_EDIT", label: "Edit Subjects", description: "Update subject details and metadata." },
      { key: "SUBJECT_DELETE", label: "Delete Subjects", description: "Remove academic subjects." },
    ],
  },
  {
    id: "topics",
    title: "Topic Management",
    description: "Manage syllabus topics, sections, and study lessons.",
    permissions: [
      { key: "TOPIC_VIEW", label: "View Topics", description: "Browse syllabus topics and sections." },
      { key: "TOPIC_CREATE", label: "Create Topics", description: "Create syllabus topics, sections, and lessons." },
      { key: "TOPIC_EDIT", label: "Edit Topics", description: "Modify topic hierarchy and lessons." },
      { key: "TOPIC_DELETE", label: "Delete Topics", description: "Remove syllabus topics and sections." },
    ],
  },
  {
    id: "questions",
    title: "Question Management",
    description: "Author, maintain, and bulk-import MCQ question banks.",
    permissions: [
      { key: "QUESTION_VIEW", label: "View Questions", description: "Inspect questions, answer keys, and explanations." },
      { key: "QUESTION_CREATE", label: "Create Questions", description: "Author new MCQ questions." },
      { key: "QUESTION_EDIT", label: "Edit Questions", description: "Update existing questions and triage reports." },
      { key: "QUESTION_DELETE", label: "Delete Questions", description: "Remove questions from the bank." },
      { key: "QUESTION_IMPORT", label: "Import Questions", description: "Bulk-import quizzes and questions from JSON." },
    ],
  },
  {
    id: "tests",
    title: "Test Management",
    description: "Build, preview, publish, and manage assessments.",
    permissions: [
      { key: "TEST_VIEW", label: "View Tests", description: "Browse tests and preview test questions." },
      { key: "TEST_CREATE", label: "Create Tests", description: "Build new draft practice tests and mocks." },
      { key: "TEST_EDIT", label: "Edit Tests", description: "Modify test structure, duration, and questions." },
      { key: "TEST_PUBLISH", label: "Publish Tests", description: "Publish or unpublish tests for students." },
      { key: "TEST_DELETE", label: "Delete Tests", description: "Permanently delete tests." },
    ],
  },
  {
    id: "analytics",
    title: "Analytics",
    description: "Inspect aggregated student engagement and test performance metrics.",
    permissions: [
      { key: "ANALYTICS_VIEW", label: "View Analytics", description: "Access platform content and engagement reports." },
      { key: "TEST_PERFORMANCE_VIEW", label: "View Test Performance", description: "View aggregated peer scores and duration insights." },
    ],
  },
  {
    id: "students",
    title: "Student Management",
    description: "View or moderate registered student accounts (disabled for Staff by default).",
    permissions: [
      { key: "STUDENT_VIEW", label: "View Students", description: "Inspect student roster and academic progress." },
      { key: "STUDENT_SUSPEND", label: "Suspend Students", description: "Suspend student accounts and revoke sessions." },
      { key: "STUDENT_REACTIVATE", label: "Reactivate Students", description: "Restore suspended student accounts." },
      { key: "STUDENT_DELETE", label: "Delete Students", description: "Permanently remove student accounts." },
    ],
  },
  {
    id: "administration",
    title: "Administration (Admin Only)",
    description: "System-wide governance, Staff roles, and security controls. Strictly reserved for Administrators.",
    adminOnlyGroup: true,
    permissions: [
      { key: "STAFF_MANAGE", label: "Manage Staff", description: "Create, edit, and activate/deactivate Staff accounts.", adminOnly: true },
      { key: "ROLE_MANAGE", label: "Manage Roles & Permissions", description: "Assign and revoke Staff permissions.", adminOnly: true },
      { key: "PLATFORM_SETTINGS_MANAGE", label: "Manage Platform Settings", description: "Modify global platform configuration.", adminOnly: true },
      { key: "SECURITY_SETTINGS_MANAGE", label: "Manage Security Settings", description: "Configure security and session policies.", adminOnly: true },
    ],
  },
];

export const ALL_PERMISSIONS: Permission[] = PERMISSION_GROUPS.flatMap((group) =>
  group.permissions.map((p) => p.key)
);

export const ADMIN_ONLY_PERMISSIONS: Permission[] = [
  "STAFF_MANAGE",
  "ROLE_MANAGE",
  "PLATFORM_SETTINGS_MANAGE",
  "SECURITY_SETTINGS_MANAGE",
];

/**
 * Permissions that an Admin can selectively grant or revoke on a Staff account.
 * Excludes Admin-only governance permissions (STAFF_MANAGE, ROLE_MANAGE, settings).
 */
export const STAFF_ASSIGNABLE_PERMISSIONS: Permission[] = ALL_PERMISSIONS.filter(
  (p) => !ADMIN_ONLY_PERMISSIONS.includes(p)
);

/**
 * Default permissions granted to newly created STAFF accounts.
 * Covers Exams, Subjects, Topics, Questions (including Import), Test creation/editing/preview, and Analytics.
 * Excludes Test Publishing, Test Deletion, Student Management, and Administration.
 */
export const DEFAULT_STAFF_PERMISSIONS: Permission[] = [
  "EXAM_VIEW",
  "EXAM_CREATE",
  "EXAM_EDIT",
  "EXAM_DELETE",
  "SUBJECT_VIEW",
  "SUBJECT_CREATE",
  "SUBJECT_EDIT",
  "SUBJECT_DELETE",
  "TOPIC_VIEW",
  "TOPIC_CREATE",
  "TOPIC_EDIT",
  "TOPIC_DELETE",
  "QUESTION_VIEW",
  "QUESTION_CREATE",
  "QUESTION_EDIT",
  "QUESTION_DELETE",
  "QUESTION_IMPORT",
  "TEST_VIEW",
  "TEST_CREATE",
  "TEST_EDIT",
  "ANALYTICS_VIEW",
  "TEST_PERFORMANCE_VIEW",
];

/**
 * Normalizes any raw role string from database or input into canonical UserRole.
 */
export function normalizeUserRole(role?: string | null): UserRole {
  const lower = (role || "").trim().toLowerCase();
  if (lower === "admin") return "admin";
  if (lower === "staff") return "staff";
  return "student";
}

/**
 * Sanitizes a raw permission array for a Staff user:
 * - Keeps only known permissions
 * - Strips strictly Admin-only governance permissions
 * - Deduplicates
 */
export function sanitizeStaffPermissions(permissions?: readonly string[] | null): Permission[] {
  if (!Array.isArray(permissions)) {
    return [...DEFAULT_STAFF_PERMISSIONS];
  }
  const assignableSet = new Set<string>(STAFF_ASSIGNABLE_PERMISSIONS);
  const unique = new Set<Permission>();
  for (const perm of permissions) {
    if (assignableSet.has(perm)) {
      unique.add(perm as Permission);
    }
  }
  return Array.from(unique);
}

/**
 * Resolves the authoritative effective permissions for a user object.
 * - ADMIN: always has ALL_PERMISSIONS.
 * - STUDENT: always has [].
 * - STAFF: uses configured permissions (sanitized) or DEFAULT_STAFF_PERMISSIONS if unset.
 */
export function getEffectivePermissions(user?: {
  role?: string | null;
  permissions?: readonly string[] | null;
} | null): Permission[] {
  if (!user) return [];
  const role = normalizeUserRole(user.role);
  if (role === "admin") return [...ALL_PERMISSIONS];
  if (role === "staff") {
    return Array.isArray(user.permissions)
      ? sanitizeStaffPermissions(user.permissions)
      : [...DEFAULT_STAFF_PERMISSIONS];
  }
  return [];
}

export function hasPermission(
  user: { role?: string | null; permissions?: readonly string[] | null } | null | undefined,
  permission: Permission
): boolean {
  if (!user) return false;
  const effective = getEffectivePermissions(user);
  return effective.includes(permission);
}

export function hasAnyPermission(
  user: { role?: string | null; permissions?: readonly string[] | null } | null | undefined,
  permissions: readonly Permission[]
): boolean {
  if (!user || permissions.length === 0) return false;
  const effective = new Set(getEffectivePermissions(user));
  return permissions.some((p) => effective.has(p));
}

export function hasAllPermissions(
  user: { role?: string | null; permissions?: readonly string[] | null } | null | undefined,
  permissions: readonly Permission[]
): boolean {
  if (!user) return false;
  const effective = new Set(getEffectivePermissions(user));
  return permissions.every((p) => effective.has(p));
}

export function getDashboardRouteForRole(role?: string | null): string {
  const normalized = normalizeUserRole(role);
  if (normalized === "admin") return "/admin/dashboard";
  if (normalized === "staff") return "/staff/dashboard";
  return "/student/dashboard";
}
