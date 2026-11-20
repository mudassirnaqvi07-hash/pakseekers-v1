/**
 * Database Reconciliation & Migration Script: Multi-Exam Enrollment & Subjects
 *
 * Safe & Idempotent:
 * 1. Connects to MongoDB Atlas using active environment configuration.
 * 2. Creates & verifies all indexes for student_enrollments & exam_subjects.
 * 3. Populates exam_subjects junction records for all existing subjects.
 * 4. Re-syncs exam totalSubjects counts.
 * 5. Auto-provisions ACTIVE enrollments for existing students based on their profile targetExam.
 *
 * Usage: node scripts/reconcile-exam-subjects.mjs
 */

import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";
import dns from "dns";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure resilient DNS resolution for MongoDB Atlas SRV connection strings.
try {
  const currentServers = dns.getServers();
  if (
    !currentServers.length ||
    currentServers.some((s) => s.startsWith("127.") || s === "::1")
  ) {
    dns.setServers(["8.8.8.8", "1.1.1.1", ...currentServers]);
  }
} catch {
  // Ignore DNS override errors
}

// Simple .env parser to avoid external dependencies
function loadEnvFile(filePath) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let val = match[2].trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnvFile(path.resolve(__dirname, "../.env.local"));
loadEnvFile(path.resolve(__dirname, "../.env"));

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ Error: MONGODB_URI environment variable is missing.");
  process.exit(1);
}

const COLLECTIONS = {
  USERS: "users",
  EXAMS: "exams",
  SUBJECTS: "subjects",
  EXAM_SUBJECTS: "exam_subjects",
  ENROLLMENTS: "student_enrollments",
};

async function reconcile() {
  console.log("🚀 Starting Multi-Exam Enrollment & Subject Junction Reconciliation...\n");

  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    console.log(` Connected to MongoDB Atlas: ${db.databaseName}`);

    // 1. Ensure Indexes
    console.log("\n1️⃣  Verifying MongoDB Indexes...");
    const enrollmentsCol = db.collection(COLLECTIONS.ENROLLMENTS);
    await enrollmentsCol.createIndex(
      { studentId: 1, examinationId: 1 },
      { unique: true, name: "idx_enrollments_student_exam_unique" }
    );
    await enrollmentsCol.createIndex(
      { studentId: 1, status: 1 },
      { name: "idx_enrollments_student_status" }
    );
    await enrollmentsCol.createIndex(
      { examinationId: 1, status: 1 },
      { name: "idx_enrollments_exam_status" }
    );

    const examSubjectsCol = db.collection(COLLECTIONS.EXAM_SUBJECTS);
    await examSubjectsCol.createIndex(
      { examId: 1, subjectId: 1 },
      { unique: true, name: "idx_exam_subjects_exam_subject_unique" }
    );
    await examSubjectsCol.createIndex(
      { examId: 1, displayOrder: 1 },
      { name: "idx_exam_subjects_exam_order" }
    );
    await examSubjectsCol.createIndex(
      { subjectId: 1 },
      { name: "idx_exam_subjects_subject" }
    );
    console.log("   Indexes verified successfully.");

    // 2. Reconcile Subjects -> Exam Subjects Junction
    console.log("\n2️⃣  Reconciling Subjects into `exam_subjects` junction collection...");
    const subjects = await db.collection(COLLECTIONS.SUBJECTS).find({}).toArray();
    console.log(`   Found ${subjects.length} total subjects.`);

    let junctionsCreated = 0;
    let junctionsExisting = 0;

    // Group subjects by examId to establish sequential displayOrder
    const examSubjectMap = new Map();
    for (const sub of subjects) {
      const examId = sub.examId || "general";
      if (!examSubjectMap.has(examId)) {
        examSubjectMap.set(examId, []);
      }
      examSubjectMap.get(examId).push(sub);
    }

    const now = new Date().toISOString();

    for (const [examId, subs] of examSubjectMap.entries()) {
      let order = 1;
      for (const sub of subs) {
        const id = `es_${examId}_${sub.id}`;
        const existing = await examSubjectsCol.findOne({
          examId: { $in: [examId, examId.toLowerCase()] },
          subjectId: { $in: [sub.id, sub.id.toLowerCase()] },
        });

        if (!existing) {
          await examSubjectsCol.insertOne({
            id,
            examId,
            subjectId: sub.id,
            displayOrder: order,
            isActive: true,
            createdAt: sub.createdAt || now,
            updatedAt: now,
          });
          junctionsCreated++;
        } else {
          junctionsExisting++;
        }

        // Also ensure subject.examIds array is initialized
        await db.collection(COLLECTIONS.SUBJECTS).updateOne(
          { _id: sub._id },
          { $addToSet: { examIds: examId } }
        );

        order++;
      }
    }
    console.log(`   Junctions created: ${junctionsCreated}, already existing: ${junctionsExisting}`);

    // 3. Re-sync Exam TotalSubjects Counts
    console.log("\n3️⃣  Syncing `totalSubjects` count across all exams...");
    const exams = await db.collection(COLLECTIONS.EXAMS).find({}).toArray();
    for (const exam of exams) {
      const activeCount = await examSubjectsCol.countDocuments({
        examId: { $in: [exam.id, exam.id.toLowerCase()] },
        isActive: { $ne: false },
      });
      await db.collection(COLLECTIONS.EXAMS).updateOne(
        { _id: exam._id },
        { $set: { totalSubjects: activeCount, updatedAt: now } }
      );
      console.log(`   - Exam ${exam.code || exam.id}: ${activeCount} subjects`);
    }

    // 4. Auto-enroll existing students based on profile.targetExam
    console.log("\n4️⃣  Auto-enrolling legacy students with profile.targetExam...");
    const students = await db
      .collection(COLLECTIONS.USERS)
      .find({ role: "student" })
      .toArray();

    let autoEnrolledCount = 0;
    let alreadyEnrolledCount = 0;

    for (const student of students) {
      const targetExamCode = student.profile?.targetExam || student.targetExam;
      if (!targetExamCode) continue;

      // Find matching exam by code or id
      const matchedExam = exams.find(
        (e) =>
          e.code?.toUpperCase() === targetExamCode.toUpperCase() ||
          e.id.toLowerCase() === targetExamCode.toLowerCase()
      );

      if (!matchedExam) {
        // If no direct code match, check if targetExam matches partial or MDCAT/ECAT
        continue;
      }

      const existingEnrollment = await enrollmentsCol.findOne({
        studentId: student.id,
        examinationId: matchedExam.id,
      });

      if (!existingEnrollment) {
        await enrollmentsCol.insertOne({
          id: `enr_${student.id}_${matchedExam.id}`,
          studentId: student.id,
          examinationId: matchedExam.id,
          status: "ACTIVE",
          enrollmentSource: "FREE_SELECTION",
          enrolledAt: student.createdAt || now,
          removedAt: null,
          createdAt: now,
          updatedAt: now,
        });
        autoEnrolledCount++;
        console.log(`   + Enrolled student ${student.name} (${student.email}) into ${matchedExam.code}`);
      } else {
        alreadyEnrolledCount++;
      }
    }

    console.log(`   Legacy students enrolled: ${autoEnrolledCount}, already enrolled: ${alreadyEnrolledCount}`);

    console.log("\n✅ Reconciliation Complete! All database collections and schemas are synchronized.\n");
  } finally {
    await client.close();
  }
}

reconcile().catch((err) => {
  console.error("❌ Reconciliation failed:", err);
  process.exit(1);
});
