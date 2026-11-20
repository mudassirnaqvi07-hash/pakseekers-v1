/**
 * Automated MongoDB Repository Integration Test — PakSeekers.
 *
 * Verifies end-to-end repository CRUD workflows and domain constraints against
 * the live MongoDB Atlas cluster ('pakseekers' database).
 *
 * Usage:
 *   node --env-file=.env scripts/test-mongodb-repositories.mjs
 */

import { MongoClient, ObjectId } from "mongodb";
import dns from "dns";

// Resilient DNS resolution for Atlas SRV
try {
  const currentServers = dns.getServers();
  if (
    !currentServers.length ||
    currentServers.some((s) => s.startsWith("127.") || s === "::1")
  ) {
    dns.setServers(["8.8.8.8", "1.1.1.1", ...currentServers]);
  }
} catch {
  // Gracefully fallback
}

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
const dbName = process.env.MONGODB_DB || "pakseekers_dev";

if (!uri) {
  console.error("❌ ERROR: MONGODB_URI or DATABASE_URL not set in environment.");
  process.exit(1);
}

const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 15000,
});

async function runTests() {
  console.log("==================================================================");
  console.log(" PakSeekers — Automated MongoDB Repository Integration Test");
  console.log("==================================================================");
  console.log(`Connecting to MongoDB Atlas database: ${dbName}...`);

  await client.connect();
  const db = client.db(dbName);
  console.log(" Connected to MongoDB Atlas successfully.\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // 1. Verify Existing Collections and Baseline Counts
    // -------------------------------------------------------------------------
    console.log("--- Test Suite 1: Collection Baselines ---");
    const examsCount = await db.collection("exams").countDocuments();
    const subjectsCount = await db.collection("subjects").countDocuments();
    const topicsCount = await db.collection("topics").countDocuments();
    const questionsCount = await db.collection("questions").countDocuments();
    const testsCount = await db.collection("tests").countDocuments();
    const usersCount = await db.collection("users").countDocuments();

    assert(examsCount >= 3, `Exams baseline count (${examsCount} >= 3)`);
    assert(subjectsCount >= 5, `Subjects baseline count (${subjectsCount} >= 5)`);
    assert(topicsCount >= 9, `Topics baseline count (${topicsCount} >= 9)`);
    assert(questionsCount >= 45, `Questions baseline count (${questionsCount} >= 45)`);
    assert(testsCount >= 9, `Tests baseline count (${testsCount} >= 9)`);
    assert(usersCount >= 10, `Users baseline count (${usersCount} >= 10)`);

    // -------------------------------------------------------------------------
    // 2. Content: Exam CRUD
    // -------------------------------------------------------------------------
    console.log("\n--- Test Suite 2: Exam CRUD Operations ---");
    const testExamId = `test-exam-${Date.now()}`;
    const newExam = {
      _id: testExamId,
      code: "TEST-EXAM",
      title: "Integration Test Exam",
      description: "Temporary exam created for automated verification.",
      status: "draft",
      totalSubjects: 0,
      totalQuestions: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection("exams").insertOne(newExam);
    const fetchedExam = await db.collection("exams").findOne({ _id: testExamId });
    assert(fetchedExam !== null && fetchedExam.code === "TEST-EXAM", "Create & Read Exam");

    await db.collection("exams").updateOne(
      { _id: testExamId },
      { $set: { title: "Updated Test Exam", updatedAt: new Date().toISOString() } }
    );
    const updatedExam = await db.collection("exams").findOne({ _id: testExamId });
    assert(updatedExam.title === "Updated Test Exam", "Update Exam Title");

    const deleteExamRes = await db.collection("exams").deleteOne({ _id: testExamId });
    assert(deleteExamRes.deletedCount === 1, "Delete Exam");

    const postDeleteExam = await db.collection("exams").findOne({ _id: testExamId });
    assert(postDeleteExam === null, "Verify Exam Is Deleted");

    // -------------------------------------------------------------------------
    // 3. Content: Subject & Topic CRUD
    // -------------------------------------------------------------------------
    console.log("\n--- Test Suite 3: Subject & Topic CRUD ---");
    const testSubjectId = `test-subj-${Date.now()}`;
    await db.collection("subjects").insertOne({
      _id: testSubjectId,
      examId: "ecat",
      title: "Test Engineering Math",
      description: "Subject test document",
      status: "active",
      totalTopics: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const fetchedSubject = await db.collection("subjects").findOne({ _id: testSubjectId });
    assert(fetchedSubject !== null && fetchedSubject.title === "Test Engineering Math", "Create & Read Subject");

    await db.collection("subjects").deleteOne({ _id: testSubjectId });
    assert((await db.collection("subjects").findOne({ _id: testSubjectId })) === null, "Delete Subject");

    const testTopicId = `test-topic-${Date.now()}`;
    await db.collection("topics").insertOne({
      _id: testTopicId,
      subjectId: "ecat-math",
      examId: "ecat",
      title: "Test Topic Matrices",
      description: "Topic test document",
      status: "active",
      questionCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const fetchedTopic = await db.collection("topics").findOne({ _id: testTopicId });
    assert(fetchedTopic !== null && fetchedTopic.title === "Test Topic Matrices", "Create & Read Topic");

    await db.collection("topics").deleteOne({ _id: testTopicId });
    assert((await db.collection("topics").findOne({ _id: testTopicId })) === null, "Delete Topic");

    // -------------------------------------------------------------------------
    // 4. Content: Question & Test CRUD
    // -------------------------------------------------------------------------
    console.log("\n--- Test Suite 4: Question & Test CRUD ---");
    const testQuestionId = `test-q-${Date.now()}`;
    await db.collection("questions").insertOne({
      _id: testQuestionId,
      examId: "ecat",
      subjectId: "ecat-math",
      topicId: "ecat-math-matrices",
      statement: "What is the determinant of the 2x2 identity matrix?",
      options: ["0", "1", "-1", "undefined"],
      correctAnswer: 1,
      explanation: "The identity matrix I = [[1, 0], [0, 1]] has det(I) = 1*1 - 0*0 = 1.",
      difficulty: "easy",
      status: "published",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const fetchedQuestion = await db.collection("questions").findOne({ _id: testQuestionId });
    assert(
      fetchedQuestion !== null && fetchedQuestion.correctAnswer === 1,
      "Create & Read Question with Options and Explanation"
    );

    await db.collection("questions").deleteOne({ _id: testQuestionId });
    assert((await db.collection("questions").findOne({ _id: testQuestionId })) === null, "Delete Question");

    const testTestId = `test-test-${Date.now()}`;
    await db.collection("tests").insertOne({
      _id: testTestId,
      examId: "ecat",
      subjectId: "ecat-math",
      topicId: "ecat-math-matrices",
      title: "Integration Test Quiz",
      description: "Automated test quiz",
      durationMinutes: 15,
      totalMarks: 10,
      status: "draft",
      questionIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const fetchedTest = await db.collection("tests").findOne({ _id: testTestId });
    assert(fetchedTest !== null && fetchedTest.status === "draft", "Create Test in Draft Status");

    // Toggle publish
    await db.collection("tests").updateOne(
      { _id: testTestId },
      { $set: { status: "published", updatedAt: new Date().toISOString() } }
    );
    const publishedTest = await db.collection("tests").findOne({ _id: testTestId });
    assert(publishedTest.status === "published", "Toggle Test Publish Status");

    await db.collection("tests").deleteOne({ _id: testTestId });
    assert((await db.collection("tests").findOne({ _id: testTestId })) === null, "Delete Test");

    // -------------------------------------------------------------------------
    // 5. User, Session & Profile Operations
    // -------------------------------------------------------------------------
    console.log("\n--- Test Suite 5: User & Session Operations ---");
    const testEmail = `integration-test-${Date.now()}@example.com`;
    const testUserId = `test-user-${Date.now()}`;

    await db.collection("users").insertOne({
      _id: testUserId,
      email: testEmail,
      name: "Atlas Integration Tester",
      role: "student",
      passwordHash: "salt:hash",
      profile: {
        targetExam: "ECAT",
        institution: "UET Lahore",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const fetchedUser = await db.collection("users").findOne({ email: testEmail });
    assert(fetchedUser !== null && fetchedUser.name === "Atlas Integration Tester", "Create & Find User by Email");

    // Update profile
    await db.collection("users").updateOne(
      { _id: testUserId },
      {
        $set: {
          name: "Atlas Tester Updated",
          "profile.targetExam": "MDCAT",
          updatedAt: new Date().toISOString(),
        },
      }
    );
    const updatedUser = await db.collection("users").findOne({ _id: testUserId });
    assert(
      updatedUser.name === "Atlas Tester Updated" && updatedUser.profile.targetExam === "MDCAT",
      "Update User Profile"
    );

    // Create session
    const sessionToken = `session-token-${Date.now()}`;
    await db.collection("sessions").insertOne({
      _id: new ObjectId(),
      token: sessionToken,
      userId: testUserId,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      createdAt: new Date().toISOString(),
    });

    const fetchedSession = await db.collection("sessions").findOne({ token: sessionToken });
    assert(fetchedSession !== null && fetchedSession.userId === testUserId, "Create & Resolve Session Token");

    await db.collection("sessions").deleteOne({ token: sessionToken });
    assert((await db.collection("sessions").findOne({ token: sessionToken })) === null, "Revoke Session");

    // -------------------------------------------------------------------------
    // 6. Test Attempts & Analytics Aggregations
    // -------------------------------------------------------------------------
    console.log("\n--- Test Suite 6: Test Attempt Aggregations ---");
    const testAttemptId = `test-att-${Date.now()}`;
    await db.collection("test_attempts").insertOne({
      _id: testAttemptId,
      studentId: testUserId,
      testId: "ecat-math-matrices-test",
      testTitle: "Matrices Diagnostic",
      examId: "ecat",
      examTitle: "ECAT",
      subjectId: "ecat-math",
      subjectTitle: "Mathematics",
      topicId: "ecat-math-matrices",
      topicTitle: "Matrices and Determinants",
      selectedAnswers: { "q-1": "1" },
      score: 10,
      totalQuestions: 10,
      correctCount: 10,
      incorrectCount: 0,
      unattemptedCount: 0,
      percentage: 100,
      questionResults: [],
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: "completed",
    });

    const studentAttempts = await db
      .collection("test_attempts")
      .find({ studentId: testUserId })
      .toArray();
    assert(studentAttempts.length === 1 && studentAttempts[0].score === 10, "Record & Query Student Attempts");

    // Clean up test attempt and test user
    await db.collection("test_attempts").deleteOne({ _id: testAttemptId });
    await db.collection("users").deleteOne({ _id: testUserId });

    assert(
      (await db.collection("test_attempts").findOne({ _id: testAttemptId })) === null &&
        (await db.collection("users").findOne({ _id: testUserId })) === null,
      "Clean Up Integration Test User & Attempt"
    );

    // -------------------------------------------------------------------------
    // 7. Domain Constraints & Unique Index Enforcement
    // -------------------------------------------------------------------------
    console.log("\n--- Test Suite 7: Domain Constraints & Index Enforcement ---");
    const existingUser = await db.collection("users").findOne({});
    let duplicateRejected = false;

    if (existingUser) {
      try {
        await db.collection("users").insertOne({
          _id: `dup-test-${Date.now()}`,
          email: existingUser.email, // duplicate email
          name: "Duplicate User Attempt",
          role: "student",
          passwordHash: "hash",
          profile: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        if (err.code === 11000) {
          duplicateRejected = true;
        }
      }
    }
    assert(duplicateRejected, "Unique Email Constraint (E11000 duplicate key rejection)");

    // -------------------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------------------
    console.log("\n==================================================================");
    console.log(` RESULTS: ${passed} Passed, ${failed} Failed`);
    console.log("==================================================================");

    if (failed > 0) {
      process.exit(1);
    } else {
      console.log(" All repository integration tests passed successfully!\n");
    }
  } catch (err) {
    console.error("❌ Unexpected test execution error:", err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

runTests();
