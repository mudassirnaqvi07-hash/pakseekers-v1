# Changelog: Multi-Exam Enrollment & Content Access Control

**Release**: PakSeekers v1.2.0  
**Date**: November 20, 2026  
**Type**: Feature Release & Architecture Enhancement  
**Status**: STABLE & VERIFIED  

---

## 1. Summary of Changes

PakSeekers v1.2.0 introduces multi-examination preparation support for student accounts, a many-to-many relationship between examinations and reusable academic subjects, strict server-side content access enforcement, and administrative enrollment inspection.

---

## 2. Detailed Changes by Layer

### 2.1 Database & Collections (`src/server/db`)
- **New Collection**: `student_enrollments` (`COLLECTIONS.ENROLLMENTS = "student_enrollments"`)
  - Tracks student enrollment lifecycle (`ACTIVE`, `REMOVED`).
  - Compound unique index: `{ studentId: 1, examinationId: 1 }`.
  - Status indexes: `{ studentId: 1, status: 1 }` and `{ examinationId: 1, status: 1 }`.
- **New Collection**: `exam_subjects` (`COLLECTIONS.EXAM_SUBJECTS = "exam_subjects"`)
  - Enables reusable academic subjects across multiple examinations.
  - Exam-specific sequence ordering (`displayOrder`) and weighting (`weightage`).
  - Compound unique index: `{ examId: 1, subjectId: 1 }`.
- **Subject Document Enhancement**:
  - Maintained `examId: string` for backward compatibility.
  - Added `examIds?: string[]` to support fast multi-exam queries.

### 2.2 Data Repositories (`src/server/repositories`)
- **New Repository**: `src/server/repositories/enrollment-repository.ts`
  - `createOrReactivateEnrollment`: Idempotent upsert with timestamp management.
  - `removeEnrollment`: Soft-removal setting `status: "REMOVED"` and preserving historical attempts.
  - `findActiveEnrollment` & `findEnrollment`.
  - `getStudentEnrollments` & `getExamEnrollments`.
  - `countActiveEnrollmentsForExam`.
- **Enhanced Repository**: `src/server/repositories/content-repository.ts`
  - `getSubjectsForExam`: Many-to-many junction retrieval with custom display order and automatic fallback to legacy `examId`.
  - `assignSubjectToExam`: Associates subjects to exams without duplicating question records.
  - `removeSubjectFromExam`: Disassociates subjects from exams without deleting the subject or questions.
  - `updateExamSubjectOrder`: Updates ordering of subjects within an exam syllabus.

### 2.3 Application Services & Server Actions (`src/server/services` & `src/server/actions`)
- **New Service**: `src/server/services/enrollment-service.ts`
  - `canAccessExamination(studentId, examId)`: Authoritative security access check. Admins bypass.
  - `verifyTestAccess(studentId, testId)`: Verifies enrollment before test-taking.
  - `enrollStudent(studentId, examId, source)`: Validates active exam and enrolls.
  - `removeEnrollment(studentId, examId)`: Soft-removes enrollment.
  - `getStudentActiveExams` & `getStudentEnrolledExamsDetails`: Per-exam analytics aggregation.
- **Enhanced Service**: `src/server/services/content-service.ts`
  - `getSubjectsByExamId`: Uses many-to-many junction ordering.
  - `getEnrolledTests`: Scopes published tests strictly to exams the student is actively enrolled in.
- **New Server Actions**: `src/server/actions/enrollment-actions.ts`
  - `enrollInExamAction(examId)`: Authenticated student enrollment.
  - `removeExamEnrollmentAction(examId)`: Authenticated student removal.
  - `checkExamAccessAction(examId)`: Client access verification.
  - `adminUpdateStudentEnrollmentAction(studentId, examId, status)`: Admin governance.
- **Hardened Security Action**: `src/server/actions/attempt-actions.ts`
  - In `recordTestAttemptAction`: Enforced `canAccessExamination` prior to fetching questions or recording attempts. Rejects unauthorized attempts with 403 Forbidden.

### 2.4 User Interface & Presentation (`src/app` & `src/features`)
- **Exam Catalog** (`src/app/exams/page.tsx` & `src/features/exams/components/exam-card.tsx`):
  - Added enrollment awareness: Displays "Enrolled Track" badge for active preparations.
  - One-click "Enroll in Track" button with instant loading feedback.
- **Student Dashboard** (`src/app/student/dashboard/page.tsx`):
  - Prominent **"My Examination Preparations"** section with interactive `ExamEnrollmentCard` for each active exam.
  - Empty state with clear guidance when student has no active enrollments.
  - Scoped "Curriculum Subjects" and "Available Tests" to enrolled exams.
  - Added "Add Another Exam" workspace switcher.
- **Exam Workspace** (`src/app/exams/[examId]/page.tsx`):
  - Complete workspace for enrolled students (subjects, tests, mocks, removal dialog).
  - Clean preview + "Enroll to Access Full Syllabus & Practice Tests" banner for non-enrolled students and guests.
- **Direct Test & Quiz Protection** (`/tests/[id]` & `/practice`):
  - Non-enrolled students see an informative "Enrollment Required" screen with direct enrollment action rather than 404 or unhandled crash.
- **Admin Interface** (`src/app/admin/exams/[id]/edit` & `src/app/admin/students/[id]`):
  - Added `ExamSubjectManager` for associating, reordering, and disassociating reusable subjects.
  - Added active student enrollment counter on exam editor.
  - Added `StudentEnrollmentsCard` on student details page for inspecting all enrolled tracks and manually granting or revoking enrollments.

### 2.5 Migration Scripts & Tooling (`scripts/`)
- `scripts/reconcile-exam-subjects.mjs`:
  - Fully idempotent reconciliation tool.
  - Automatically created `exam_subjects` junctions for all existing subjects.
  - Re-synced `totalSubjects` across all exams.
  - Auto-enrolled legacy students into their declared profile target exam.
- `scripts/test-multi-exam-enrollment.mjs`:
  - 24-assertion automated test suite covering Scenarios A through F.

---

## 3. Backward Compatibility & Upgrade Guarantees

- **No Breaking Database Changes**: Existing collections (`exams`, `subjects`, `questions`, `tests`, `test_attempts`, `users`) remain intact.
- **Zero Data Loss on Removal**: Historical student attempts, scores, and review data are never deleted when an examination track is removed.
- **Transparent Fallback**: Legacy subject queries without junction records automatically fall back to direct `examId` filtering.
