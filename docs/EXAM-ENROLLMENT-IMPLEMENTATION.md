# Multi-Exam Enrollment & Content Access Implementation Plan

**System**: PakSeekers Academic Preparation Platform  
**Document**: Step-by-Step Implementation Guide & Verification Protocol  
**Author**: Senior Software Engineer & System Architect  
**Status**: APPROVED FOR EXECUTION  
**Target Version**: PakSeekers v1.2.0  

---

## 1. Overview & Phased Roadmap

This document outlines the systematic implementation of the multi-examination enrollment and access enforcement architecture. The implementation is broken into 5 sequential, verifiable phases:

- **Phase 1: Database & Domain Layer**: Types, Schemas, Indexes, and Repositories.
- **Phase 2: Reconciliation & Data Migration**: Script to sync existing subjects and auto-enroll legacy students.
- **Phase 3: Application Services & Server Actions**: Core business logic, authorization rules, and mutations.
- **Phase 4: Student UI & Presentation**: Dashboard with "My Preparations", exam catalog with enrollment, exam workspaces, and confirmation modals.
- **Phase 5: Admin UI & Management**: Subject-to-exam association and student enrollment inspection.
- **Phase 6: Automated Verification & Documentation**: End-to-end integration tests, scenarios A–F verification, test reports, and changelogs.

---

## 2. File-Level Implementation Breakdown

### Phase 1: Database & Domain Models

#### 1.1 `src/types/content.ts` & `src/types/index.ts`
- **Add**:
  - `EnrollmentStatus = "ACTIVE" | "REMOVED"`
  - `EnrollmentSource = "FREE_SELECTION" | "SUBSCRIPTION" | "ADMIN_GRANTED"`
  - `StudentEnrollment` interface:
    - `id: string`
    - `studentId: string`
    - `examinationId: string`
    - `status: EnrollmentStatus`
    - `enrollmentSource: EnrollmentSource`
    - `enrolledAt: string`
    - `removedAt?: string | null`
    - `createdAt: string`
    - `updatedAt: string`
  - `ExamSubject` interface:
    - `id: string`
    - `examId: string`
    - `subjectId: string`
    - `displayOrder: number`
    - `weightage?: number`
    - `isActive: boolean`
    - `createdAt?: string`
    - `updatedAt?: string`
  - `EnrolledExamDetails`: Exam metadata enriched with subject count, completed tests, and average accuracy.
- **Update**:
  - Export new interfaces from `src/types/index.ts`.

#### 1.2 `src/server/db/schema.ts`
- **Add**:
  - `COLLECTIONS.ENROLLMENTS = "student_enrollments"`
  - `COLLECTIONS.EXAM_SUBJECTS = "exam_subjects"`
  - `StudentEnrollmentDoc` and `ExamSubjectDoc` interfaces extending `Document`.
  - In `ensureMongoIndexes()`:
    - `idx_enrollments_student_exam_unique`: `{ studentId: 1, examinationId: 1 }` (unique)
    - `idx_enrollments_student_status`: `{ studentId: 1, status: 1 }`
    - `idx_enrollments_exam_status`: `{ examinationId: 1, status: 1 }`
    - `idx_exam_subjects_exam_subject_unique`: `{ examId: 1, subjectId: 1 }` (unique)
    - `idx_exam_subjects_exam_order`: `{ examId: 1, displayOrder: 1 }`
    - `idx_exam_subjects_subject`: `{ subjectId: 1 }`

#### 1.3 `src/server/repositories/enrollment-repository.ts` (NEW)
- **Implement**:
  - `createOrReactivateEnrollment(studentId: string, examId: string, source?: EnrollmentSource): Promise<StudentEnrollment>`
    - Uses MongoDB `findOneAndUpdate` with `$set` to ensure idempotent activation and update timestamps.
  - `removeEnrollment(studentId: string, examId: string): Promise<boolean>`
    - Soft-removes by updating `{ status: "REMOVED", removedAt: new Date().toISOString() }`. Does NOT delete document.
  - `getActiveEnrollment(studentId: string, examId: string): Promise<StudentEnrollment | null>`
  - `getStudentEnrollments(studentId: string, status?: EnrollmentStatus): Promise<StudentEnrollment[]>`
  - `getExamEnrollments(examId: string, status?: EnrollmentStatus): Promise<StudentEnrollment[]>`
  - `getAllEnrollments(filters?: { status?: EnrollmentStatus; examId?: string; studentId?: string }): Promise<StudentEnrollment[]>`
  - `countActiveEnrollmentsForExam(examId: string): Promise<number>`

#### 1.4 `src/server/repositories/content-repository.ts`
- **Add Junction Operations**:
  - `assignSubjectToExam(examId: string, subjectId: string, displayOrder?: number, weightage?: number): Promise<ExamSubject>`
  - `removeSubjectFromExam(examId: string, subjectId: string): Promise<boolean>`
  - `getExamSubjectJunctions(examId: string): Promise<ExamSubject[]>`
  - `getSubjectsForExam(examId: string): Promise<Subject[]>`
    - Queries `exam_subjects` sorted by `displayOrder`. Joins with `subjects`. Falls back to legacy `examId` if junction records are empty.
  - `updateExamSubjectOrder(examId: string, subjectOrder: { subjectId: string; displayOrder: number }[]): Promise<boolean>`

---

### Phase 2: Reconciliation & Data Migration

#### 2.1 `scripts/reconcile-exam-subjects.mjs` (NEW)
- Idempotent script:
  - Connects to active MongoDB database (`pakseekers_dev`).
  - Ensures all indexes are built.
  - Iterates over all existing subjects: creates corresponding `exam_subjects` junction records for their primary `examId` with sequential `displayOrder`.
  - Recalculates and updates `totalSubjects` count on all exams.
  - Inspects existing students with `user.profile.targetExam`: auto-provisions active enrollments so legacy demo students have immediate access to their declared preparations.

---

### Phase 3: Application Services & Actions

#### 3.1 `src/server/services/enrollment-service.ts` (NEW)
- **Implement**:
  - `canAccessExamination(studentId: string, examId: string): Promise<boolean>`:
    - Authoritative access check. Admins bypass. Checks for active enrollment.
  - `enrollStudent(studentId: string, examId: string, source?: EnrollmentSource): Promise<ActionResult<StudentEnrollment>>`
    - Validates exam exists and is active.
    - Idempotently creates or reactivates enrollment.
  - `removeEnrollment(studentId: string, examId: string): Promise<ActionResult<void>>`
    - Validates current enrollment. Soft-removes.
  - `getStudentActiveExams(studentId: string): Promise<Exam[]>`
  - `getStudentEnrollmentOverview(studentId: string): Promise<{ activeExams: Exam[]; enrollments: StudentEnrollment[] }>`
  - `verifyTestAccess(studentId: string, testId: string): Promise<{ canAccess: boolean; examId?: string; error?: string }>`

#### 3.2 `src/server/services/content-service.ts`
- Update `getSubjectsByExamId(examId: string)`: Use `contentRepo.getSubjectsForExam(examId)` to honor many-to-many ordering and associations.
- Add `getEnrolledTests(studentId: string, filters?: TestFilters): Promise<Test[]>`: Scopes published tests to exams the student is actively enrolled in.

#### 3.3 `src/server/actions/enrollment-actions.ts` (NEW)
- **Server Actions**:
  - `enrollInExamAction(examId: string): Promise<ActionResult<StudentEnrollment>>`
    - Authenticates current student via `getCurrentUser()`.
    - Invokes `enrollmentService.enrollStudent()`.
    - Revalidates `/student/dashboard`, `/exams`, `/exams/[examId]`, `/student/tests`.
  - `removeExamEnrollmentAction(examId: string): Promise<ActionResult<void>>`
    - Authenticates student.
    - Invokes `enrollmentService.removeEnrollment()`.
    - Revalidates affected routes.

#### 3.4 `src/server/actions/attempt-actions.ts`
- **Enforce Access Check**:
  - In `recordTestAttemptAction()`, verify `await canAccessExamination(user.id, input.examId)`.
  - If false, return `{ success: false, error: "You are not actively enrolled in this examination track. Please enroll to record test attempts." }`.

---

### Phase 4: Student UI & Presentation

#### 4.1 Exam Catalog (`src/app/exams/page.tsx`)
- Detect authenticated student session.
- Query active enrollments for the student.
- Display status badge on each exam: "Enrolled" vs "Available".
- One-click "Enroll Now" or "Go to Workspace".

#### 4.2 Student Dashboard (`src/app/student/dashboard/page.tsx`)
- Fetch student active enrollments via `enrollmentService`.
- If 0 enrollments:
  - Render an engaging `EmptyState` explaining that no preparations are active yet, with a direct button to "Browse Examination Catalog".
- If 1+ enrollments:
  - Render prominent **"My Preparations / Active Examinations"** section with cards for each enrolled exam (Title, Code, Subjects Count, Workspace link, Quick removal action).
  - Add workspace switcher / "Add Another Exam" action button.
  - Scope "Curriculum Subjects" and "Available Tests" to enrolled exams.
  - Display "Remove Examination" confirmation modal that explicitly explains historical scores and attempts are permanently saved.

#### 4.3 Dedicated Exam Workspace (`src/app/exams/[examId]/page.tsx`)
- If student is enrolled:
  - Full workspace view: Subjects grid, syllabus breakdown, practice tests, grand mocks, and "Remove from My Preparations" option.
- If student is NOT enrolled (or guest):
  - Displays high-level syllabus preview, sample subjects, and an **"Enroll to Access Complete Syllabus & Practice Tests"** banner with instant enrollment button.

#### 4.4 Quiz Canvas & Direct Test Protection
- `src/app/tests/[id]/page.tsx`: Verify `canAccessExamination(user.id, test.examId)`. If false, display enrollment prompt rather than generic 404 or unhandled crash.
- `src/app/exams/[examId]/topics/[topicId]/practice/page.tsx`: Verify `canAccessExamination(student.id, examId)`. If false, render access restriction notice with enrollment CTA.

---

### Phase 5: Admin UI & Governance

#### 5.1 Admin Exam Subject Manager (`src/features/admin/components/exam-subject-manager.tsx`)
- Rendered in `/admin/exams/[id]/edit`.
- Allows admins to:
  - View all subjects associated with the exam with their `displayOrder`.
  - Associate existing subjects to this exam.
  - Adjust display ordering.
  - Remove subject association from this exam (without deleting the subject entity).

#### 5.2 Admin Student Enrollment Inspection (`src/app/admin/students/[id]/page.tsx`)
- Display "Active Enrollments" section in student profile.
- Lists all enrolled exams, enrollment date, source, and status (`ACTIVE` / `REMOVED`).
- Admin action to grant or revoke enrollment directly.

---

### Phase 6: Automated Verification & Testing

#### 6.1 Automated Test Suite (`scripts/test-multi-exam-enrollment.mjs`)
- **Unit & Logic Tests**:
  - Test A: Single student enrolls in MDCAT.
  - Test B: Same student enrolls in ECAT (multi-enrollment).
  - Test C: Duplicate enrollment prevention (idempotent no-op).
  - Test D: Soft-removal of MDCAT (status marked `REMOVED`).
  - Test E: Historical attempts of MDCAT remain intact after removal.
  - Test F: Re-enrollment in MDCAT succeeds and reactivates access.
  - Test G: Authorization denial for non-enrolled exam test submission.
  - Test H: Admin bypass check.
  - Test I: Shared subject in both MDCAT and ECAT with distinct ordering.
- **Verification Criteria**:
  - `npm run lint` passes with 0 errors.
  - `npx tsc --noEmit` passes with 0 type errors.
  - `npm run build` succeeds cleanly.
  - Full automated test suite passes 100%.

---

## 3. Risk Mitigation & Invariant Checklist

| Risk | Likelihood | Impact | Architectural Mitigation |
| :--- | :--- | :--- | :--- |
| **Data Loss on Exam Removal** | Low | Critical | Repository only supports soft-update (`status = "REMOVED"`). No `delete` query exists on attempts or enrollments during student removal. |
| **Breaking Existing Subject Links** | Medium | High | Junction queries fall back to legacy `examId` on `SubjectDoc`. Reconcile script populates junctions before rollout. |
| **IDOR Access Leak** | Medium | High | `recordTestAttemptAction` checks `canAccessExamination` server-side with verified session student ID. |
| **Client UI Out of Sync** | Low | Low | Server actions call `revalidatePath` on `/student/dashboard`, `/student/tests`, and `/exams/[examId]`. |
