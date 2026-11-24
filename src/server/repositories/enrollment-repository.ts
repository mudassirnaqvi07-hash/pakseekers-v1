import "server-only";

/**
 * MongoDB Student Enrollment Repository — PakSeekers.
 *
 * Implements indexed MongoDB Atlas persistence for student exam enrollment
 * requests, Admin approval workflows, and historical auditability.
 *
 * Enforces unique index `{ studentId: 1, examinationId: 1 }` (one record per
 * student per exam) and safe concurrency handling.
 */

import {
  getMongoDb,
  COLLECTIONS,
  toDomainEntity,
  toDomainEntities,
  type StudentEnrollmentDoc,
} from "@/server/db";
import type { StudentEnrollment, EnrollmentStatus, EnrollmentSource } from "@/types";

export const APPROVED_ENROLLMENT_STATUSES: EnrollmentStatus[] = ["APPROVED", "ACTIVE"];
export const REVOKED_ENROLLMENT_STATUSES: EnrollmentStatus[] = ["REVOKED", "REMOVED"];

export function isApprovedEnrollmentStatus(status?: string | null): boolean {
  return status === "APPROVED" || status === "ACTIVE";
}

export interface EnrollmentFilters {
  status?: EnrollmentStatus;
  examinationId?: string;
  studentId?: string;
}

export type EnrollmentRequestResult =
  | { created: true; enrollment: StudentEnrollment }
  | {
      created: false;
      conflict: "ALREADY_PENDING" | "ALREADY_APPROVED" | "ALREADY_REJECTED" | "REVOKED";
      enrollment: StudentEnrollment;
    };

/**
 * Submits a new PENDING enrollment request for a student and examination.
 * Strictly prevents duplicate requests for the same exam and handles concurrent inserts safely.
 */
export async function requestEnrollment(
  studentId: string,
  examinationId: string,
  source: EnrollmentSource = "STUDENT_REQUEST"
): Promise<EnrollmentRequestResult> {
  const db = await getMongoDb();
  const normalizedExamId = examinationId.trim();

  // Check existing record first (case-insensitive on examinationId for safety)
  const existing = await findEnrollment(studentId, normalizedExamId);
  if (existing) {
    if (existing.status === "PENDING") {
      return { created: false, conflict: "ALREADY_PENDING", enrollment: existing };
    }
    if (isApprovedEnrollmentStatus(existing.status)) {
      return { created: false, conflict: "ALREADY_APPROVED", enrollment: existing };
    }
    if (existing.status === "REJECTED") {
      return { created: false, conflict: "ALREADY_REJECTED", enrollment: existing };
    }
    if (existing.status === "REVOKED") {
      return { created: false, conflict: "REVOKED", enrollment: existing };
    }

    // Legacy self-REMOVED record can transition back into PENDING review
    const now = new Date().toISOString();
    const updated = await db
      .collection<StudentEnrollmentDoc>(COLLECTIONS.ENROLLMENTS)
      .findOneAndUpdate(
        { id: existing.id, status: "REMOVED" },
        {
          $set: {
            status: "PENDING",
            enrollmentSource: source,
            requestedAt: now,
            decisionAt: null,
            approvedBy: null,
            decisionNotes: null,
            removedAt: null,
            updatedAt: now,
          },
        },
        { returnDocument: "after" }
      );

    if (updated) {
      return { created: true, enrollment: toDomainEntity<StudentEnrollment>(updated) };
    }
    return { created: false, conflict: "ALREADY_PENDING", enrollment: existing };
  }

  const now = new Date().toISOString();
  const newDoc: StudentEnrollmentDoc = {
    id: `enr_${studentId}_${normalizedExamId}`,
    studentId,
    examinationId: normalizedExamId,
    status: "PENDING",
    enrollmentSource: source,
    requestedAt: now,
    decisionAt: null,
    approvedBy: null,
    decisionNotes: null,
    enrolledAt: now,
    removedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await db.collection<StudentEnrollmentDoc>(COLLECTIONS.ENROLLMENTS).insertOne(newDoc);
    return { created: true, enrollment: toDomainEntity<StudentEnrollment>(newDoc) };
  } catch (err: unknown) {
    // Handle concurrent race condition on unique index { studentId: 1, examinationId: 1 }
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: number }).code === 11000) {
      const concurrent = await findEnrollment(studentId, normalizedExamId);
      if (concurrent) {
        const conflict = isApprovedEnrollmentStatus(concurrent.status)
          ? "ALREADY_APPROVED"
          : concurrent.status === "REJECTED"
          ? "ALREADY_REJECTED"
          : concurrent.status === "REVOKED"
          ? "REVOKED"
          : "ALREADY_PENDING";
        return { created: false, conflict, enrollment: concurrent };
      }
    }
    throw err;
  }
}

/**
 * Admin decision mutation: APPROVE, REJECT, or REVOKE an enrollment.
 * Records decisionAt, approving Admin ID, and optional notes.
 */
export async function decideEnrollment(
  studentId: string,
  examinationId: string,
  decision: "APPROVED" | "REJECTED" | "REVOKED",
  adminId: string,
  notes?: string
): Promise<StudentEnrollment | null> {
  const db = await getMongoDb();
  const now = new Date().toISOString();
  const normalizedExamId = examinationId.trim();
  const cleanNotes = notes?.trim() || null;

  const existing = await findEnrollment(studentId, normalizedExamId);

  if (decision === "APPROVED") {
    const id = existing?.id || `enr_${studentId}_${normalizedExamId}`;
    const result = await db
      .collection<StudentEnrollmentDoc>(COLLECTIONS.ENROLLMENTS)
      .findOneAndUpdate(
        existing
          ? { id: existing.id }
          : { studentId, examinationId: normalizedExamId },
        {
          $set: {
            status: "APPROVED",
            decisionAt: now,
            enrolledAt: now,
            approvedBy: adminId,
            decisionNotes: cleanNotes,
            removedAt: null,
            updatedAt: now,
          },
          $setOnInsert: {
            id,
            studentId,
            examinationId: normalizedExamId,
            enrollmentSource: "ADMIN_GRANTED",
            requestedAt: now,
            createdAt: now,
          },
        },
        { upsert: true, returnDocument: "after" }
      );

    return result ? toDomainEntity<StudentEnrollment>(result) : null;
  }

  if (!existing) {
    return null;
  }

  const updateFields: Record<string, unknown> = {
    status: decision,
    decisionAt: now,
    approvedBy: adminId,
    decisionNotes: cleanNotes,
    updatedAt: now,
  };

  if (decision === "REVOKED") {
    updateFields.removedAt = now;
  }

  const result = await db
    .collection<StudentEnrollmentDoc>(COLLECTIONS.ENROLLMENTS)
    .findOneAndUpdate(
      { id: existing.id },
      { $set: updateFields },
      { returnDocument: "after" }
    );

  return result ? toDomainEntity<StudentEnrollment>(result) : null;
}

/**
 * Direct approval / creation (used for Admin-granted enrollments or future paid subscriptions).
 */
export async function createOrReactivateEnrollment(
  studentId: string,
  examinationId: string,
  source: EnrollmentSource = "ADMIN_GRANTED",
  adminId?: string
): Promise<StudentEnrollment> {
  const db = await getMongoDb();
  const now = new Date().toISOString();
  const normalizedExamId = examinationId.trim();
  const existing = await findEnrollment(studentId, normalizedExamId);
  const id = existing?.id || `enr_${studentId}_${normalizedExamId}`;

  const result = await db
    .collection<StudentEnrollmentDoc>(COLLECTIONS.ENROLLMENTS)
    .findOneAndUpdate(
      existing ? { id: existing.id } : { studentId, examinationId: normalizedExamId },
      {
        $set: {
          status: "APPROVED",
          enrollmentSource: source,
          decisionAt: now,
          approvedBy: adminId || null,
          enrolledAt: now,
          removedAt: null,
          updatedAt: now,
        },
        $setOnInsert: {
          id,
          studentId,
          examinationId: normalizedExamId,
          requestedAt: now,
          createdAt: now,
        },
      },
      { upsert: true, returnDocument: "after" }
    );

  if (!result) {
    throw new Error(
      `Failed to create or approve enrollment for student ${studentId} in exam ${normalizedExamId}`
    );
  }

  return toDomainEntity<StudentEnrollment>(result);
}

/**
 * Soft-removes or revokes an examination enrollment.
 */
export async function removeEnrollment(
  studentId: string,
  examinationId: string,
  status: "REVOKED" | "REMOVED" = "REVOKED",
  adminId?: string
): Promise<boolean> {
  const db = await getMongoDb();
  const now = new Date().toISOString();
  const normalizedExamId = examinationId.trim();

  const result = await db
    .collection<StudentEnrollmentDoc>(COLLECTIONS.ENROLLMENTS)
    .updateOne(
      {
        studentId,
        examinationId: { $in: [normalizedExamId, normalizedExamId.toLowerCase()] },
        status: { $in: APPROVED_ENROLLMENT_STATUSES },
      },
      {
        $set: {
          status,
          removedAt: now,
          decisionAt: now,
          ...(adminId ? { approvedBy: adminId } : {}),
          updatedAt: now,
        },
      }
    );

  return result.modifiedCount > 0;
}

/**
 * Fetches an APPROVED (or legacy ACTIVE) enrollment for a student and examination.
 * Strictly returns null for PENDING, REJECTED, REVOKED, or REMOVED enrollments.
 */
export async function findActiveEnrollment(
  studentId: string,
  examinationId: string
): Promise<StudentEnrollment | null> {
  if (!studentId || !examinationId) return null;
  const db = await getMongoDb();
  const normalizedExamId = examinationId.trim();

  const doc = await db.collection<StudentEnrollmentDoc>(COLLECTIONS.ENROLLMENTS).findOne({
    studentId,
    examinationId: { $in: [normalizedExamId, normalizedExamId.toLowerCase()] },
    status: { $in: APPROVED_ENROLLMENT_STATUSES },
  });

  return doc ? toDomainEntity<StudentEnrollment>(doc) : null;
}

/**
 * Fetches the enrollment record regardless of status.
 */
export async function findEnrollment(
  studentId: string,
  examinationId: string
): Promise<StudentEnrollment | null> {
  if (!studentId || !examinationId) return null;
  const db = await getMongoDb();
  const normalizedExamId = examinationId.trim();

  const doc = await db.collection<StudentEnrollmentDoc>(COLLECTIONS.ENROLLMENTS).findOne({
    studentId,
    examinationId: { $in: [normalizedExamId, normalizedExamId.toLowerCase()] },
  });

  return doc ? toDomainEntity<StudentEnrollment>(doc) : null;
}

/**
 * Returns all enrollments for a student, optionally filtered by status.
 */
export async function getStudentEnrollments(
  studentId: string,
  status?: EnrollmentStatus
): Promise<StudentEnrollment[]> {
  if (!studentId) return [];
  const db = await getMongoDb();
  const filter: Record<string, unknown> = { studentId };

  if (status) {
    if (status === "APPROVED" || status === "ACTIVE") {
      filter.status = { $in: APPROVED_ENROLLMENT_STATUSES };
    } else if (status === "REVOKED" || status === "REMOVED") {
      filter.status = { $in: REVOKED_ENROLLMENT_STATUSES };
    } else {
      filter.status = status;
    }
  }

  const docs = await db
    .collection<StudentEnrollmentDoc>(COLLECTIONS.ENROLLMENTS)
    .find(filter)
    .sort({ updatedAt: -1 })
    .toArray();

  return toDomainEntities<StudentEnrollment>(docs);
}

/**
 * Returns all enrollments for a specific examination.
 */
export async function getExamEnrollments(
  examinationId: string,
  status?: EnrollmentStatus
): Promise<StudentEnrollment[]> {
  if (!examinationId) return [];
  const db = await getMongoDb();
  const normalizedExamId = examinationId.trim();
  const filter: Record<string, unknown> = {
    examinationId: { $in: [normalizedExamId, normalizedExamId.toLowerCase()] },
  };
  if (status) {
    if (status === "APPROVED" || status === "ACTIVE") {
      filter.status = { $in: APPROVED_ENROLLMENT_STATUSES };
    } else if (status === "REVOKED" || status === "REMOVED") {
      filter.status = { $in: REVOKED_ENROLLMENT_STATUSES };
    } else {
      filter.status = status;
    }
  }

  const docs = await db
    .collection<StudentEnrollmentDoc>(COLLECTIONS.ENROLLMENTS)
    .find(filter)
    .sort({ updatedAt: -1 })
    .toArray();

  return toDomainEntities<StudentEnrollment>(docs);
}

/**
 * Returns all enrollments across the platform for administrative management.
 */
export async function getAllEnrollments(
  filters?: EnrollmentFilters
): Promise<StudentEnrollment[]> {
  const db = await getMongoDb();
  const filter: Record<string, unknown> = {};

  if (filters?.status) {
    if (filters.status === "APPROVED" || filters.status === "ACTIVE") {
      filter.status = { $in: APPROVED_ENROLLMENT_STATUSES };
    } else if (filters.status === "REVOKED" || filters.status === "REMOVED") {
      filter.status = { $in: REVOKED_ENROLLMENT_STATUSES };
    } else {
      filter.status = filters.status;
    }
  }
  if (filters?.examinationId) {
    const examId = filters.examinationId.trim();
    filter.examinationId = { $in: [examId, examId.toLowerCase()] };
  }
  if (filters?.studentId) {
    filter.studentId = filters.studentId;
  }

  const docs = await db
    .collection<StudentEnrollmentDoc>(COLLECTIONS.ENROLLMENTS)
    .find(filter)
    .sort({ updatedAt: -1 })
    .toArray();

  return toDomainEntities<StudentEnrollment>(docs);
}

/**
 * Counts total approved student enrollments for an examination.
 */
export async function countActiveEnrollmentsForExam(examinationId: string): Promise<number> {
  if (!examinationId) return 0;
  const db = await getMongoDb();
  const normalizedExamId = examinationId.trim();

  return db.collection<StudentEnrollmentDoc>(COLLECTIONS.ENROLLMENTS).countDocuments({
    examinationId: { $in: [normalizedExamId, normalizedExamId.toLowerCase()] },
    status: { $in: APPROVED_ENROLLMENT_STATUSES },
  });
}

/**
 * Counts pending enrollment requests awaiting Admin approval.
 */
export async function countPendingEnrollments(): Promise<number> {
  const db = await getMongoDb();
  return db.collection<StudentEnrollmentDoc>(COLLECTIONS.ENROLLMENTS).countDocuments({
    status: "PENDING",
  });
}
