import "server-only";

/**
 * MongoDB Student Enrollment Repository — PakSeekers.
 *
 * Implements high-performance, indexed MongoDB Atlas persistence for student
 * examination track enrollments.
 *
 * Adheres to:
 * - Domain-Driven Design (Data Access Layer)
 * - Multi-exam preparation per student
 * - Soft-removal pattern (historical attempts & data preservation)
 * - Idempotent re-enrollment
 */

import {
  getMongoDb,
  COLLECTIONS,
  toDomainEntity,
  toDomainEntities,
  type StudentEnrollmentDoc,
} from "@/server/db";
import type { StudentEnrollment, EnrollmentStatus, EnrollmentSource } from "@/types";

export interface EnrollmentFilters {
  status?: EnrollmentStatus;
  examinationId?: string;
  studentId?: string;
}

/**
 * Idempotently enrolls or reactivates a student in an examination track.
 * If enrollment existed and was REMOVED, reactivates to ACTIVE and updates enrolledAt.
 * If already ACTIVE, updates updatedAt without duplicating records.
 */
export async function createOrReactivateEnrollment(
  studentId: string,
  examinationId: string,
  source: EnrollmentSource = "FREE_SELECTION"
): Promise<StudentEnrollment> {
  const db = await getMongoDb();
  const now = new Date().toISOString();
  const normalizedExamId = examinationId.trim();
  const id = `enr_${studentId}_${normalizedExamId}`;

  const result = await db.collection<StudentEnrollmentDoc>(COLLECTIONS.ENROLLMENTS).findOneAndUpdate(
    { studentId, examinationId: normalizedExamId },
    {
      $set: {
        status: "ACTIVE",
        enrollmentSource: source,
        enrolledAt: now,
        removedAt: null,
        updatedAt: now,
      },
      $setOnInsert: {
        id,
        studentId,
        examinationId: normalizedExamId,
        createdAt: now,
      },
    },
    {
      upsert: true,
      returnDocument: "after",
    }
  );

  if (!result) {
    throw new Error(`Failed to create or update enrollment for student ${studentId} in exam ${normalizedExamId}`);
  }

  return toDomainEntity<StudentEnrollment>(result);
}

/**
 * Soft-removes an examination enrollment.
 * Sets status to REMOVED and records removedAt timestamp.
 * Preserves the document so historical attempts and analytics retain foreign key validity.
 */
export async function removeEnrollment(
  studentId: string,
  examinationId: string
): Promise<boolean> {
  const db = await getMongoDb();
  const now = new Date().toISOString();
  const normalizedExamId = examinationId.trim();

  const result = await db.collection<StudentEnrollmentDoc>(COLLECTIONS.ENROLLMENTS).updateOne(
    {
      studentId,
      examinationId: { $in: [normalizedExamId, normalizedExamId.toLowerCase()] },
      status: "ACTIVE",
    },
    {
      $set: {
        status: "REMOVED",
        removedAt: now,
        updatedAt: now,
      },
    }
  );

  return result.modifiedCount > 0;
}

/**
 * Fetches an active enrollment for a specific student and examination.
 * Returns null if never enrolled or currently removed.
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
    status: "ACTIVE",
  });

  return doc ? toDomainEntity<StudentEnrollment>(doc) : null;
}

/**
 * Fetches the enrollment record regardless of status (ACTIVE or REMOVED).
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
 * Returns all enrollments for a student, optionally filtered by status (e.g., ACTIVE).
 */
export async function getStudentEnrollments(
  studentId: string,
  status?: EnrollmentStatus
): Promise<StudentEnrollment[]> {
  if (!studentId) return [];
  const db = await getMongoDb();
  const filter: Record<string, unknown> = { studentId };
  if (status) {
    filter.status = status;
  }

  const docs = await db
    .collection<StudentEnrollmentDoc>(COLLECTIONS.ENROLLMENTS)
    .find(filter)
    .sort({ enrolledAt: -1 })
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
    filter.status = status;
  }

  const docs = await db
    .collection<StudentEnrollmentDoc>(COLLECTIONS.ENROLLMENTS)
    .find(filter)
    .sort({ enrolledAt: -1 })
    .toArray();

  return toDomainEntities<StudentEnrollment>(docs);
}

/**
 * Returns all enrollments across the platform for administrative reporting.
 */
export async function getAllEnrollments(
  filters?: EnrollmentFilters
): Promise<StudentEnrollment[]> {
  const db = await getMongoDb();
  const filter: Record<string, unknown> = {};

  if (filters?.status) {
    filter.status = filters.status;
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
 * Counts total active student enrollments for an examination.
 */
export async function countActiveEnrollmentsForExam(examinationId: string): Promise<number> {
  if (!examinationId) return 0;
  const db = await getMongoDb();
  const normalizedExamId = examinationId.trim();

  return db.collection<StudentEnrollmentDoc>(COLLECTIONS.ENROLLMENTS).countDocuments({
    examinationId: { $in: [normalizedExamId, normalizedExamId.toLowerCase()] },
    status: "ACTIVE",
  });
}
