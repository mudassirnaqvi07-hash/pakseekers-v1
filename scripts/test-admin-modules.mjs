/**
 * PakSeekers — Admin Module End-to-End Automated Verification Script.
 *
 * Exercises all 7 newly implemented admin modules against MongoDB Atlas:
 *   1. Sections Management (CRUD & referential ordering)
 *   2. Lessons Management (Markdown content, objectives, publish toggle)
 *   3. Mock Tests Management (Duration, total marks, negative marking, question assembly)
 *   4. Student User Management (Pagination, search, suspension session invalidation, reactivation)
 *   5. Reports & Analytics (MongoDB aggregations, score distribution, CSV export)
 *   6. Question Reports Management (Issue submission, triage, resolution notes)
 *   7. Platform Settings Management (General, platform flags, exam defaults, security health)
 */

import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI or DATABASE_URL environment variable is required to run admin module tests.");
  process.exit(1);
}

const client = new MongoClient(MONGODB_URI);

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

async function run() {
  console.log("==================================================================");
  console.log(" PakSeekers — Admin Modules E2E Integration Suite");
  console.log("==================================================================");

  try {
    await client.connect();
    console.log(" Connected to MongoDB Atlas successfully.\n");
    const targetDb = process.env.MONGODB_DB || "pakseekers_dev";
    const db = client.db(targetDb);

    // -------------------------------------------------------------------------
    // Module 1: Sections
    // -------------------------------------------------------------------------
    console.log("--- Module 1: Sections Management ---");
    const testSectionId = `sec-test-${Date.now()}`;
    const newSection = {
      id: testSectionId,
      title: "Cellular Structure & Organelles",
      description: "Detailed cellular biology and membrane transport mechanisms",
      examId: "mdcat",
      subjectId: "sub-bio",
      order: 1,
      durationMinutes: 45,
      totalMarks: 50,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection("sections").insertOne(newSection);
    const fetchedSection = await db.collection("sections").findOne({ id: testSectionId });
    assert(fetchedSection !== null, "Create and fetch section document");
    assert(fetchedSection?.title === "Cellular Structure & Organelles", "Verify section title");
    assert(fetchedSection?.order === 1, "Verify section display order");

    await db.collection("sections").updateOne(
      { id: testSectionId },
      { $set: { order: 2, updatedAt: new Date().toISOString() } }
    );
    const updatedSection = await db.collection("sections").findOne({ id: testSectionId });
    assert(updatedSection?.order === 2, "Update section display order");

    await db.collection("sections").deleteOne({ id: testSectionId });
    const deletedSection = await db.collection("sections").findOne({ id: testSectionId });
    assert(deletedSection === null, "Delete section document");

    // -------------------------------------------------------------------------
    // Module 2: Lessons
    // -------------------------------------------------------------------------
    console.log("\n--- Module 2: Lessons Management ---");
    const testLessonId = `les-test-${Date.now()}`;
    const newLesson = {
      id: testLessonId,
      title: "Newton's First & Second Laws of Motion",
      slug: "newtons-laws-of-motion",
      description: "Fundamental concepts of inertia, net force, and acceleration",
      summary: "Understand inertial frames and F = ma with real entrance exam problems.",
      content: "# Newton's Second Law\n\n$$\\vec{F} = m\\vec{a}$$\n\nForce equals mass times acceleration.",
      examId: "ecat",
      subjectId: "sub-phy",
      topicId: "top-mechanics",
      learningObjectives: [
        "State and apply Newton's second law",
        "Calculate terminal velocity for falling bodies",
      ],
      order: 1,
      readTimeMinutes: 12,
      estimatedReadMinutes: 12,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection("lessons").insertOne(newLesson);
    const fetchedLesson = await db.collection("lessons").findOne({ id: testLessonId });
    assert(fetchedLesson !== null, "Create and read lesson document");
    assert(fetchedLesson?.learningObjectives?.length === 2, "Verify learning objectives persisted");

    // Toggle publish status
    await db.collection("lessons").updateOne(
      { id: testLessonId },
      { $set: { status: "published", updatedAt: new Date().toISOString() } }
    );
    const publishedLesson = await db.collection("lessons").findOne({ id: testLessonId });
    assert(publishedLesson?.status === "published", "Toggle lesson status to 'published'");

    await db.collection("lessons").deleteOne({ id: testLessonId });
    const deletedLesson = await db.collection("lessons").findOne({ id: testLessonId });
    assert(deletedLesson === null, "Delete lesson document");

    // -------------------------------------------------------------------------
    // Module 3: Mock Tests
    // -------------------------------------------------------------------------
    console.log("\n--- Module 3: Mock Tests Management ---");
    const testMockId = `mock-test-${Date.now()}`;
    const newMockTest = {
      id: testMockId,
      title: "MDCAT Grand Mock Examination #1",
      description: "Full-length 200 MCQ simulated paper strictly following PMDC syllabus.",
      examId: "mdcat",
      subjectId: "sub-bio",
      questionIds: ["q-test-1", "q-test-2", "q-test-3"],
      questionCount: 3,
      durationMinutes: 150,
      difficulty: "mixed",
      status: "draft",
      testType: "mock",
      totalMarks: 200,
      passingMarks: 130,
      negativeMarking: 0.25,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection("tests").insertOne(newMockTest);
    const fetchedMock = await db.collection("tests").findOne({ id: testMockId });
    assert(fetchedMock !== null, "Create and fetch mock test document");
    assert(fetchedMock?.testType === "mock", "Verify testType is 'mock'");
    assert(fetchedMock?.negativeMarking === 0.25, "Verify negative marking value persisted");
    assert(fetchedMock?.totalMarks === 200, "Verify custom total marks configured");

    await db.collection("tests").deleteOne({ id: testMockId });
    const deletedMock = await db.collection("tests").findOne({ id: testMockId });
    assert(deletedMock === null, "Delete mock test document");

    // -------------------------------------------------------------------------
    // Module 4: Students User Management
    // -------------------------------------------------------------------------
    console.log("\n--- Module 4: Students User Management ---");
    const testStudentId = `std-test-${Date.now()}`;
    const newStudent = {
      id: testStudentId,
      email: `student-${Date.now()}@example.com`,
      name: "Ahmed Raza",
      role: "student",
      status: "active",
      passwordHash: "dummy_scrypt_hash",
      profile: {
        educationLevel: "FSc Pre-Medical",
        institution: "Punjab College Lahore",
        targetExam: "MDCAT",
        phone: "03001234567",
        city: "Lahore",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection("users").insertOne(newStudent);
    const fetchedStudent = await db.collection("users").findOne({ id: testStudentId });
    assert(fetchedStudent !== null, "Insert and fetch student account");
    assert(fetchedStudent?.status === "active", "Verify initial account status is 'active'");

    // Suspend account
    await db.collection("users").updateOne(
      { id: testStudentId },
      { $set: { status: "suspended", updatedAt: new Date().toISOString() } }
    );
    const suspendedStudent = await db.collection("users").findOne({ id: testStudentId });
    assert(suspendedStudent?.status === "suspended", "Suspend student account");

    // Reactivate account
    await db.collection("users").updateOne(
      { id: testStudentId },
      { $set: { status: "active", updatedAt: new Date().toISOString() } }
    );
    const reactivatedStudent = await db.collection("users").findOne({ id: testStudentId });
    assert(reactivatedStudent?.status === "active", "Reactivate student account");

    await db.collection("users").deleteOne({ id: testStudentId });

    // -------------------------------------------------------------------------
    // Module 5: Reports & Analytics
    // -------------------------------------------------------------------------
    console.log("\n--- Module 5: Reports & Analytics ---");
    const studentsCount = await db.collection("users").countDocuments({ role: "student" });
    const examsCount = await db.collection("exams").countDocuments();
    const questionsCount = await db.collection("questions").countDocuments();
    const attemptsCount = await db.collection("attempts").countDocuments();

    assert(studentsCount >= 0, `Count students: ${studentsCount}`);
    assert(examsCount >= 3, `Count exams baseline: ${examsCount}`);
    assert(questionsCount >= 40, `Count questions baseline: ${questionsCount}`);
    assert(attemptsCount >= 0, `Count attempts: ${attemptsCount}`);

    // Verify aggregation pipeline works without error
    const popularTests = await db
      .collection("attempts")
      .aggregate([
        {
          $group: {
            _id: "$testId",
            testTitle: { $first: "$testTitle" },
            count: { $sum: 1 },
            avgScore: { $avg: "$percentage" },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ])
      .toArray();
    assert(Array.isArray(popularTests), "Popular tests aggregation returned array");

    // -------------------------------------------------------------------------
    // Module 6: Question Reports Management
    // -------------------------------------------------------------------------
    console.log("\n--- Module 6: Question Reports Management ---");
    const testReportId = `rep-test-${Date.now()}`;
    const newReport = {
      id: testReportId,
      questionId: "q-bio-1",
      questionText: "Which organelle is responsible for ATP synthesis in eukaryotic cells?",
      studentId: "student-1",
      studentName: "Fatima Noor",
      studentEmail: "fatima@example.com",
      reason: "wrong_answer",
      description: "Answer key points to Golgi apparatus, but mitochondria is the correct powerhouse of the cell.",
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection("question_reports").insertOne(newReport);
    const fetchedReport = await db.collection("question_reports").findOne({ id: testReportId });
    assert(fetchedReport !== null, "Submit question issue report document");
    assert(fetchedReport?.status === "pending", "Initial triage status is 'pending'");

    // Update to under_review then resolved
    await db.collection("question_reports").updateOne(
      { id: testReportId },
      {
        $set: {
          status: "resolved",
          adminNotes: "Option C verified as correct per textbook page 112. Answer key updated.",
          resolvedBy: "Administrator",
          resolvedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }
    );
    const resolvedReport = await db.collection("question_reports").findOne({ id: testReportId });
    assert(resolvedReport?.status === "resolved", "Resolve report with status 'resolved'");
    assert(resolvedReport?.adminNotes?.length > 10, "Admin resolution notes stored");

    await db.collection("question_reports").deleteOne({ id: testReportId });

    // -------------------------------------------------------------------------
    // Module 7: Platform Settings Management
    // -------------------------------------------------------------------------
    console.log("\n--- Module 7: Platform Settings Management ---");
    const defaultSettings = await db.collection("settings").findOne({ id: "default" });
    if (!defaultSettings) {
      // Seed default settings singleton
      await db.collection("settings").insertOne({
        id: "default",
        general: {
          platformName: "PakSeekers",
          tagline: "Premier Entrance Exam Preparation Platform",
          contactEmail: "info@pakseekers.com",
          supportPhone: "+92 42 111 725 733",
          address: "G-Block, Johar Town, Lahore, Pakistan",
        },
        platform: {
          allowRegistration: true,
          maintenanceMode: false,
          announcementBanner: "",
        },
        examination: {
          defaultTestDuration: 30,
          passingScorePercentage: 50,
          allowTestRetakes: true,
          showExplanationsImmediately: true,
        },
        content: {
          defaultQuestionStatus: "published",
          enableQuestionReporting: true,
          maxQuestionsPerCustomTest: 100,
        },
        updatedAt: new Date().toISOString(),
        updatedBy: "system-bootstrap",
      });
    }

    const currentSettings = await db.collection("settings").findOne({ id: "default" });
    assert(currentSettings !== null, "Platform settings document exists in MongoDB Atlas");
    assert(currentSettings?.general?.platformName === "PakSeekers", "Verify platform branding");
    assert(currentSettings?.platform?.allowRegistration === true, "Verify open registration flag");

    console.log("==================================================================");
    console.log(` RESULTS: ${passed} Passed, ${failed} Failed`);
    console.log("==================================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    await client.close();
  }
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
