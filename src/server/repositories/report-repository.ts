import "server-only";

/**
 * MongoDB Reports & Question Reports Repository — PakSeekers.
 *
 * Implements actual MongoDB aggregations for platform analytics,
 * student engagement reports, and student question issue reporting workflows.
 */

import {
  getMongoDb,
  COLLECTIONS,
  toDomainEntity,
  toDomainEntities,
  type QuestionReportDoc,
} from "@/server/db";
import type {
  QuestionReport,
  QuestionReportReason,
  QuestionReportStatus,
} from "@/types";

// ---------------------------------------------------------------------------
// Types for Platform Reports & Analytics
// ---------------------------------------------------------------------------

export interface PlatformOverviewStats {
  totalStudents: number;
  activeStudents: number;
  suspendedStudents: number;
  totalExams: number;
  totalSubjects: number;
  totalTopics: number;
  totalQuestions: number;
  totalTests: number;
  publishedTests: number;
  totalMockTests: number;
  totalAttempts: number;
  completedAttempts: number;
  platformAverageScore: number;
  averagePercentage: number;
  pendingQuestionReports: number;
}

export interface PopularTestStat {
  testId: string;
  testTitle: string;
  title: string;
  examTitle: string;
  subjectTitle: string;
  testType: string;
  attemptCount: number;
  attemptsCount: number;
  averageScore: number;
  highestScore: number;
}

export interface SubjectContentDistribution {
  subjectId: string;
  subjectTitle: string;
  examId: string;
  examCode: string;
  topicsCount: number;
  questionCount: number;
  questionsCount: number;
  testCount: number;
}

export interface ScoreDistribution {
  distinction: number;
  merit: number;
  passing: number;
  needsImprovement: number;
}

export interface PlatformAnalyticsReport {
  overview: PlatformOverviewStats;
  popularTests: PopularTestStat[];
  contentDistribution: SubjectContentDistribution[];
  subjectBreakdown: SubjectContentDistribution[];
  scoreDistribution: ScoreDistribution;
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Question Reports Operations
// ---------------------------------------------------------------------------

export async function getAllQuestionReports(filter?: {
  status?: string;
  search?: string;
}): Promise<QuestionReport[]> {
  const db = await getMongoDb();
  const query: Record<string, unknown> = {};

  if (filter?.status && filter.status !== "all") {
    query.status = filter.status;
  }

  if (filter?.search && filter.search.trim().length > 0) {
    const term = filter.search.trim();
    const searchRegex = { $regex: term, $options: "i" };
    query.$or = [
      { questionText: searchRegex },
      { studentName: searchRegex },
      { studentEmail: searchRegex },
      { description: searchRegex },
    ];
  }

  const docs = await db
    .collection<QuestionReportDoc>(COLLECTIONS.QUESTION_REPORTS)
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();

  return toDomainEntities<QuestionReport>(docs);
}

export async function getQuestionReportById(id: string): Promise<QuestionReport | null> {
  if (!id) return null;
  const db = await getMongoDb();
  const doc = await db
    .collection<QuestionReportDoc>(COLLECTIONS.QUESTION_REPORTS)
    .findOne({ id });
  return doc ? toDomainEntity<QuestionReport>(doc) : null;
}

export async function createQuestionReport(input: {
  questionId: string;
  questionText: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  reason: QuestionReportReason;
  description: string;
}): Promise<QuestionReport> {
  const db = await getMongoDb();
  const now = new Date().toISOString();

  const newReport: QuestionReport = {
    id: `qrep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    questionId: input.questionId,
    questionText: input.questionText.trim(),
    studentId: input.studentId,
    studentName: input.studentName.trim(),
    studentEmail: input.studentEmail.trim().toLowerCase(),
    reason: input.reason,
    description: input.description.trim(),
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  await db
    .collection<QuestionReportDoc>(COLLECTIONS.QUESTION_REPORTS)
    .insertOne(newReport as QuestionReportDoc);

  return newReport;
}

export async function updateQuestionReportStatus(
  id: string,
  status: QuestionReportStatus,
  adminNotes?: string,
  resolvedBy?: string
): Promise<QuestionReport | null> {
  if (!id) return null;
  const db = await getMongoDb();
  const now = new Date().toISOString();

  const setFields: Record<string, unknown> = {
    status,
    updatedAt: now,
  };

  if (adminNotes !== undefined) setFields.adminNotes = adminNotes.trim();
  if (status === "resolved" || status === "rejected") {
    setFields.resolvedAt = now;
    if (resolvedBy) setFields.resolvedBy = resolvedBy;
  }

  const result = await db
    .collection<QuestionReportDoc>(COLLECTIONS.QUESTION_REPORTS)
    .findOneAndUpdate(
      { id },
      { $set: setFields },
      { returnDocument: "after" }
    );

  return result ? toDomainEntity<QuestionReport>(result) : null;
}

export async function countPendingQuestionReports(): Promise<number> {
  const db = await getMongoDb();
  return db
    .collection(COLLECTIONS.QUESTION_REPORTS)
    .countDocuments({ status: { $in: ["pending", "under_review"] } });
}

// ---------------------------------------------------------------------------
// Platform Analytics & Reports (Real MongoDB Aggregations)
// ---------------------------------------------------------------------------

export async function getPlatformAnalytics(): Promise<PlatformAnalyticsReport> {
  const db = await getMongoDb();

  // 1. Parallel Collection Counts
  const [
    totalStudents,
    activeStudents,
    suspendedStudents,
    totalExams,
    totalSubjects,
    totalTopics,
    totalQuestions,
    totalTests,
    publishedTests,
    totalMockTests,
    totalAttempts,
    completedAttempts,
    pendingQuestionReports,
    scoreAggResult,
    popularTestsAgg,
    contentDistAgg,
    subjectsList,
  ] = await Promise.all([
    db.collection(COLLECTIONS.USERS).countDocuments({ role: "student" }),
    db.collection(COLLECTIONS.USERS).countDocuments({
      role: "student",
      $or: [{ status: "active" }, { status: { $exists: false } }],
    }),
    db.collection(COLLECTIONS.USERS).countDocuments({ role: "student", status: "suspended" }),
    db.collection(COLLECTIONS.EXAMS).countDocuments(),
    db.collection(COLLECTIONS.SUBJECTS).countDocuments(),
    db.collection(COLLECTIONS.TOPICS).countDocuments(),
    db.collection(COLLECTIONS.QUESTIONS).countDocuments(),
    db.collection(COLLECTIONS.TESTS).countDocuments(),
    db.collection(COLLECTIONS.TESTS).countDocuments({ status: "published" }),
    db.collection(COLLECTIONS.TESTS).countDocuments({
      $or: [{ testType: "mock" }, { title: { $regex: /mock/i } }],
    }),
    db.collection(COLLECTIONS.ATTEMPTS).countDocuments(),
    db.collection(COLLECTIONS.ATTEMPTS).countDocuments({ status: "completed" }),
    db.collection(COLLECTIONS.QUESTION_REPORTS).countDocuments({
      status: { $in: ["pending", "under_review"] },
    }),
    // Average score aggregation
    db
      .collection(COLLECTIONS.ATTEMPTS)
      .aggregate<{ avgPercentage: number }>([
        { $match: { status: "completed" } },
        { $group: { _id: null, avgPercentage: { $avg: "$percentage" } } },
      ])
      .toArray(),
    // Popular tests aggregation
    db
      .collection(COLLECTIONS.ATTEMPTS)
      .aggregate<{
        _id: string;
        testTitle: string;
        examTitle: string;
        subjectTitle: string;
        count: number;
        avgScore: number;
        maxScore: number;
      }>([
        {
          $group: {
            _id: "$testId",
            testTitle: { $first: "$testTitle" },
            examTitle: { $first: "$examTitle" },
            subjectTitle: { $first: "$subjectTitle" },
            count: { $sum: 1 },
            avgScore: { $avg: "$percentage" },
            maxScore: { $max: "$percentage" },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ])
      .toArray(),
    // Content distribution aggregation (questions per subject)
    db
      .collection(COLLECTIONS.QUESTIONS)
      .aggregate<{ _id: string; count: number }>([
        { $group: { _id: "$subjectId", count: { $sum: 1 } } },
      ])
      .toArray(),
    // Subjects list for joining titles
    db.collection(COLLECTIONS.SUBJECTS).find().toArray(),
  ]);

  // 2. Score Bands Count
  const [distinctionCount, meritCount, passingCount, needsImprovementCount] =
    await Promise.all([
      db
        .collection(COLLECTIONS.ATTEMPTS)
        .countDocuments({ status: "completed", percentage: { $gte: 90 } }),
      db.collection(COLLECTIONS.ATTEMPTS).countDocuments({
        status: "completed",
        percentage: { $gte: 75, $lt: 90 },
      }),
      db.collection(COLLECTIONS.ATTEMPTS).countDocuments({
        status: "completed",
        percentage: { $gte: 60, $lt: 75 },
      }),
      db
        .collection(COLLECTIONS.ATTEMPTS)
        .countDocuments({ status: "completed", percentage: { $lt: 60 } }),
    ]);

  const platformAverageScore =
    scoreAggResult.length > 0 && scoreAggResult[0].avgPercentage
      ? Math.round(scoreAggResult[0].avgPercentage)
      : 0;

  // Build Popular Tests
  const popularTests: PopularTestStat[] = popularTestsAgg.map((item) => ({
    testId: item._id,
    testTitle: item.testTitle || "Practice Test",
    title: item.testTitle || "Practice Test",
    examTitle: item.examTitle || "General Exam",
    subjectTitle: item.subjectTitle || "General",
    testType: "practice",
    attemptCount: item.count,
    attemptsCount: item.count,
    averageScore: Math.round(item.avgScore || 0),
    highestScore: Math.round(item.maxScore || 0),
  }));

  // Build Content Distribution
  const questionCountMap = new Map(contentDistAgg.map((c) => [c._id, c.count]));
  const contentDistribution: SubjectContentDistribution[] = subjectsList.map((sub) => ({
    subjectId: sub.id,
    subjectTitle: sub.title,
    examId: sub.examId,
    examCode: (sub.examId || "EXAM").toUpperCase(),
    topicsCount: sub.totalTopics || 0,
    questionCount: questionCountMap.get(sub.id) || 0,
    questionsCount: questionCountMap.get(sub.id) || 0,
    testCount: sub.totalTopics || 0,
  }));

  const scoreDistribution: ScoreDistribution = {
    distinction: distinctionCount,
    merit: meritCount,
    passing: passingCount,
    needsImprovement: needsImprovementCount,
  };

  return {
    overview: {
      totalStudents,
      activeStudents,
      suspendedStudents,
      totalExams,
      totalSubjects,
      totalTopics,
      totalQuestions,
      totalTests,
      publishedTests,
      totalMockTests,
      totalAttempts,
      completedAttempts,
      platformAverageScore,
      averagePercentage: platformAverageScore,
      pendingQuestionReports,
    },
    popularTests,
    contentDistribution,
    subjectBreakdown: contentDistribution,
    scoreDistribution,
    generatedAt: new Date().toISOString(),
  };
}

export async function generateCsvReportData(): Promise<string> {
  const analytics = await getPlatformAnalytics();

  const lines: string[] = [];
  lines.push("PakSeekers Platform Analytics & Performance Summary");
  lines.push(`Generated At,${analytics.generatedAt}`);
  lines.push("");
  lines.push("Platform Overview Metric,Value");
  lines.push(`Total Registered Students,${analytics.overview.totalStudents}`);
  lines.push(`Active Students,${analytics.overview.activeStudents}`);
  lines.push(`Suspended Students,${analytics.overview.suspendedStudents}`);
  lines.push(`Total Exams,${analytics.overview.totalExams}`);
  lines.push(`Total Subjects,${analytics.overview.totalSubjects}`);
  lines.push(`Total Questions,${analytics.overview.totalQuestions}`);
  lines.push(`Published Tests,${analytics.overview.publishedTests}`);
  lines.push(`Total Mock Tests,${analytics.overview.totalMockTests}`);
  lines.push(`Total Student Attempts,${analytics.overview.totalAttempts}`);
  lines.push(`Completed Student Attempts,${analytics.overview.completedAttempts}`);
  lines.push(`Global Average Score,${analytics.overview.platformAverageScore}%`);
  lines.push(`Pending Question Reports,${analytics.overview.pendingQuestionReports}`);
  lines.push("");
  lines.push("Popular Tests Leaderboard,Exam,Subject,Total Attempts,Average Score,Highest Score");

  for (const t of analytics.popularTests) {
    lines.push(
      `"${t.testTitle.replace(/"/g, '""')}","${t.examTitle}","${t.subjectTitle}",${t.attemptCount},${t.averageScore}%,${t.highestScore}%`
    );
  }

  lines.push("");
  lines.push("Subject Content Distribution,Exam,Questions in Bank");
  for (const c of analytics.contentDistribution) {
    lines.push(`"${c.subjectTitle.replace(/"/g, '""')}","${c.examId}",${c.questionCount}`);
  }

  return lines.join("\n");
}
