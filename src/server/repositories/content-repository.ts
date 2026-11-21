import "server-only";

/**
 * MongoDB Content Repository — PakSeekers Phase 1.
 *
 * Implements high-performance, indexed MongoDB Atlas persistence for:
 *   Exams, Subjects, Topics, Questions, and Tests.
 *
 * Follows the Modular Monolith + DDD architecture:
 *   Presentation (app/) -> Application Services (content-service.ts) -> Content Repository -> MongoDB Atlas
 */

import {
  getMongoDb,
  COLLECTIONS,
  toDomainEntity,
  toDomainEntities,
  type ExamDoc,
  type SubjectDoc,
  type ExamSubjectDoc,
  type TopicDoc,
  type QuestionDoc,
  type TestDoc,
  type SectionDoc,
  type LessonDoc,
} from "@/server/db";
import type {
  Exam,
  Subject,
  ExamSubject,
  Topic,
  Question,
  QuestionOption,
  Test,
  ContentStatus,
  QuestionDifficulty,
  QuestionStatus,
  TestDifficulty,
  TestStatus,
  Section,
  Lesson,
  LessonStatus,
} from "@/types";

// ---------------------------------------------------------------------------
// Dashboard Metrics
// ---------------------------------------------------------------------------

export interface DashboardStats {
  totalExams: number;
  totalSubjects: number;
  totalTopics: number;
  totalQuestions: number;
  totalTests: number;
  publishedTests: number;
  draftTests: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const db = await getMongoDb();
  const [
    totalExams,
    totalSubjects,
    totalTopics,
    totalQuestions,
    totalTests,
    publishedTests,
    draftTests,
  ] = await Promise.all([
    db.collection(COLLECTIONS.EXAMS).countDocuments(),
    db.collection(COLLECTIONS.SUBJECTS).countDocuments(),
    db.collection(COLLECTIONS.TOPICS).countDocuments(),
    db.collection(COLLECTIONS.QUESTIONS).countDocuments(),
    db.collection(COLLECTIONS.TESTS).countDocuments(),
    db.collection(COLLECTIONS.TESTS).countDocuments({ status: "published" }),
    db.collection(COLLECTIONS.TESTS).countDocuments({ status: "draft" }),
  ]);

  return {
    totalExams,
    totalSubjects,
    totalTopics,
    totalQuestions,
    totalTests,
    publishedTests,
    draftTests,
  };
}

// ---------------------------------------------------------------------------
// Exam Operations
// ---------------------------------------------------------------------------

export async function getAllExams(status?: ContentStatus): Promise<Exam[]> {
  const db = await getMongoDb();
  const filter = status ? { status } : {};
  const docs = await db
    .collection<ExamDoc>(COLLECTIONS.EXAMS)
    .find(filter)
    .sort({ title: 1 })
    .toArray();
  return toDomainEntities<Exam>(docs);
}

export async function getExamById(id: string): Promise<Exam | null> {
  if (!id) return null;
  const db = await getMongoDb();
  const doc = await db.collection<ExamDoc>(COLLECTIONS.EXAMS).findOne({
    $or: [{ id }, { id: id.toLowerCase() }, { code: id.toUpperCase() }],
  });
  return doc ? toDomainEntity<Exam>(doc) : null;
}

export async function createExam(input: {
  title: string;
  code: string;
  description: string;
  status: ContentStatus;
}): Promise<Exam> {
  const db = await getMongoDb();
  const normalizedCode = input.code.trim().toUpperCase();
  const baseId = normalizedCode.toLowerCase().replace(/[^a-z0-9]/g, "-") || `exam-${Date.now()}`;

  // Check unique constraints
  const existing = await db.collection<ExamDoc>(COLLECTIONS.EXAMS).findOne({
    $or: [{ id: baseId }, { code: normalizedCode }],
  });

  if (existing) {
    throw new Error(`An entrance exam with code '${normalizedCode}' already exists.`);
  }

  const now = new Date().toISOString();
  const newExam: Exam = {
    id: baseId,
    title: input.title.trim(),
    code: normalizedCode,
    description: input.description.trim(),
    totalSubjects: 0,
    status: input.status,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection<ExamDoc>(COLLECTIONS.EXAMS).insertOne(newExam as ExamDoc);
  return newExam;
}

export async function updateExam(
  id: string,
  input: Partial<{
    title: string;
    code: string;
    description: string;
    status: ContentStatus;
  }>
): Promise<Exam | null> {
  const db = await getMongoDb();
  const now = new Date().toISOString();

  const updateFields: Record<string, unknown> = {
    updatedAt: now,
  };

  if (input.title !== undefined) updateFields.title = input.title.trim();
  if (input.code !== undefined) updateFields.code = input.code.trim().toUpperCase();
  if (input.description !== undefined) updateFields.description = input.description.trim();
  if (input.status !== undefined) updateFields.status = input.status;

  const result = await db.collection<ExamDoc>(COLLECTIONS.EXAMS).findOneAndUpdate(
    { $or: [{ id }, { id: id.toLowerCase() }] },
    { $set: updateFields },
    { returnDocument: "after" }
  );

  return result ? toDomainEntity<Exam>(result) : null;
}

export async function deleteExam(id: string): Promise<boolean> {
  const db = await getMongoDb();
  const lowerId = id.toLowerCase();

  const deleteRes = await db.collection<ExamDoc>(COLLECTIONS.EXAMS).deleteOne({
    $or: [{ id }, { id: lowerId }],
  });

  if (deleteRes.deletedCount === 0) return false;

  // Cascade clean-up in MongoDB
  await Promise.all([
    db.collection(COLLECTIONS.SUBJECTS).deleteMany({ examId: { $in: [id, lowerId] } }),
    db.collection(COLLECTIONS.TOPICS).deleteMany({ examId: { $in: [id, lowerId] } }),
    db.collection(COLLECTIONS.QUESTIONS).deleteMany({ examId: { $in: [id, lowerId] } }),
    db.collection(COLLECTIONS.TESTS).deleteMany({ examId: { $in: [id, lowerId] } }),
  ]);

  return true;
}

// ---------------------------------------------------------------------------
// Subject Operations
// ---------------------------------------------------------------------------

/**
 * Fetches all subjects for an exam using many-to-many junction collection `exam_subjects`.
 * Preserves custom displayOrder and weightage.
 * Seamlessly falls back to legacy `examId` on `subjects` collection if no junction records exist.
 */
export async function getSubjectsForExam(examId: string): Promise<Subject[]> {
  if (!examId) return [];
  const db = await getMongoDb();
  const normalizedExamId = examId.trim();

  // 1. Check exam_subjects junction table
  const junctions = await db
    .collection<ExamSubjectDoc>(COLLECTIONS.EXAM_SUBJECTS)
    .find({
      examId: { $in: [normalizedExamId, normalizedExamId.toLowerCase()] },
      isActive: { $ne: false },
    })
    .sort({ displayOrder: 1 })
    .toArray();

  if (junctions.length > 0) {
    const subjectIds = junctions.map((j) => j.subjectId);
    const subjectDocs = await db
      .collection<SubjectDoc>(COLLECTIONS.SUBJECTS)
      .find({
        $or: [
          { id: { $in: subjectIds } },
          { id: { $in: subjectIds.map((s) => s.toLowerCase()) } },
        ],
      })
      .toArray();

    const subjectMap = new Map<string, SubjectDoc>();
    for (const s of subjectDocs) {
      subjectMap.set(s.id, s);
      subjectMap.set(s.id.toLowerCase(), s);
    }

    // Map according to junction ordering and inject displayOrder / weightage
    const orderedSubjects: Subject[] = [];
    for (const j of junctions) {
      const doc = subjectMap.get(j.subjectId) || subjectMap.get(j.subjectId.toLowerCase());
      if (doc) {
        const entity = toDomainEntity<Subject>(doc);
        entity.displayOrder = j.displayOrder;
        entity.weightage = j.weightage;
        orderedSubjects.push(entity);
      }
    }

    if (orderedSubjects.length > 0) {
      return orderedSubjects;
    }
  }

  // 2. Backward compatibility fallback: query direct examId or examIds
  const fallbackDocs = await db
    .collection<SubjectDoc>(COLLECTIONS.SUBJECTS)
    .find({
      $or: [
        { examId: { $in: [normalizedExamId, normalizedExamId.toLowerCase()] } },
        { examIds: { $in: [normalizedExamId, normalizedExamId.toLowerCase()] } },
      ],
    })
    .sort({ title: 1 })
    .toArray();

  return toDomainEntities<Subject>(fallbackDocs);
}

/**
 * Assigns an existing subject to an exam in the junction table with custom ordering and weightage.
 * Also synchronizes examIds array on the Subject document and increments totalSubjects on Exam.
 */
export async function assignSubjectToExam(
  examId: string,
  subjectId: string,
  displayOrder?: number,
  weightage?: number
): Promise<ExamSubject> {
  const db = await getMongoDb();
  const normalizedExamId = examId.trim();
  const normalizedSubjectId = subjectId.trim();
  const now = new Date().toISOString();
  const id = `es_${normalizedExamId}_${normalizedSubjectId}`;

  // If displayOrder not provided, append to end
  let order = displayOrder;
  if (order === undefined) {
    const existingCount = await db
      .collection<ExamSubjectDoc>(COLLECTIONS.EXAM_SUBJECTS)
      .countDocuments({
        examId: { $in: [normalizedExamId, normalizedExamId.toLowerCase()] },
      });
    order = existingCount + 1;
  }

  const junctionDoc: ExamSubjectDoc = {
    id,
    examId: normalizedExamId,
    subjectId: normalizedSubjectId,
    displayOrder: order,
    weightage,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection<ExamSubjectDoc>(COLLECTIONS.EXAM_SUBJECTS).updateOne(
    {
      examId: { $in: [normalizedExamId, normalizedExamId.toLowerCase()] },
      subjectId: { $in: [normalizedSubjectId, normalizedSubjectId.toLowerCase()] },
    },
    { $set: junctionDoc },
    { upsert: true }
  );

  // Sync examIds on Subject document
  await db
    .collection<SubjectDoc>(COLLECTIONS.SUBJECTS)
    .updateOne(
      { $or: [{ id: normalizedSubjectId }, { id: normalizedSubjectId.toLowerCase() }] },
      { $addToSet: { examIds: normalizedExamId } as never }
    );

  // Re-sync exam totalSubjects
  const total = await db
    .collection<ExamSubjectDoc>(COLLECTIONS.EXAM_SUBJECTS)
    .countDocuments({
      examId: { $in: [normalizedExamId, normalizedExamId.toLowerCase()] },
      isActive: { $ne: false },
    });

  await db
    .collection<ExamDoc>(COLLECTIONS.EXAMS)
    .updateOne(
      { $or: [{ id: normalizedExamId }, { id: normalizedExamId.toLowerCase() }] },
      { $set: { totalSubjects: total, updatedAt: now } }
    );

  return toDomainEntity<ExamSubject>(junctionDoc);
}

/**
 * Removes a subject from an exam junction.
 * Does not delete the subject entity, enabling reusability in other exams.
 */
export async function removeSubjectFromExam(
  examId: string,
  subjectId: string
): Promise<boolean> {
  const db = await getMongoDb();
  const normalizedExamId = examId.trim();
  const normalizedSubjectId = subjectId.trim();
  const now = new Date().toISOString();

  const delResult = await db.collection<ExamSubjectDoc>(COLLECTIONS.EXAM_SUBJECTS).deleteOne({
    examId: { $in: [normalizedExamId, normalizedExamId.toLowerCase()] },
    subjectId: { $in: [normalizedSubjectId, normalizedSubjectId.toLowerCase()] },
  });

  if (delResult.deletedCount > 0) {
    // Remove examId from subject's examIds array
    await db
      .collection<SubjectDoc>(COLLECTIONS.SUBJECTS)
      .updateOne(
        { $or: [{ id: normalizedSubjectId }, { id: normalizedSubjectId.toLowerCase() }] },
        { $pull: { examIds: normalizedExamId } as never }
      );

    // Re-sync exam totalSubjects
    const total = await db
      .collection<ExamSubjectDoc>(COLLECTIONS.EXAM_SUBJECTS)
      .countDocuments({
        examId: { $in: [normalizedExamId, normalizedExamId.toLowerCase()] },
        isActive: { $ne: false },
      });

    await db
      .collection<ExamDoc>(COLLECTIONS.EXAMS)
      .updateOne(
        { $or: [{ id: normalizedExamId }, { id: normalizedExamId.toLowerCase() }] },
        { $set: { totalSubjects: total, updatedAt: now } }
      );

    return true;
  }

  return false;
}

/**
 * Gets all raw junction records for an exam.
 */
export async function getExamSubjectJunctions(examId: string): Promise<ExamSubject[]> {
  const db = await getMongoDb();
  const normalizedExamId = examId.trim();
  const docs = await db
    .collection<ExamSubjectDoc>(COLLECTIONS.EXAM_SUBJECTS)
    .find({
      examId: { $in: [normalizedExamId, normalizedExamId.toLowerCase()] },
      isActive: { $ne: false },
    })
    .sort({ displayOrder: 1 })
    .toArray();

  return toDomainEntities<ExamSubject>(docs);
}

/**
 * Updates displayOrder for multiple subjects in an exam.
 */
export async function updateExamSubjectOrder(
  examId: string,
  subjectOrder: { subjectId: string; displayOrder: number }[]
): Promise<boolean> {
  const db = await getMongoDb();
  const normalizedExamId = examId.trim();
  const now = new Date().toISOString();

  const bulkOps = subjectOrder.map((item) => ({
    updateOne: {
      filter: {
        examId: { $in: [normalizedExamId, normalizedExamId.toLowerCase()] },
        subjectId: { $in: [item.subjectId, item.subjectId.toLowerCase()] },
      },
      update: {
        $set: {
          displayOrder: item.displayOrder,
          updatedAt: now,
        },
      },
    },
  }));

  if (bulkOps.length > 0) {
    await db.collection<ExamSubjectDoc>(COLLECTIONS.EXAM_SUBJECTS).bulkWrite(bulkOps);
  }

  return true;
}

export async function getAllSubjects(examId?: string): Promise<Subject[]> {
  if (examId) {
    return getSubjectsForExam(examId);
  }
  const db = await getMongoDb();
  const docs = await db
    .collection<SubjectDoc>(COLLECTIONS.SUBJECTS)
    .find({})
    .sort({ title: 1 })
    .toArray();
  return toDomainEntities<Subject>(docs);
}

export async function getSubjectById(id: string): Promise<Subject | null> {
  if (!id) return null;
  const db = await getMongoDb();
  const doc = await db.collection<SubjectDoc>(COLLECTIONS.SUBJECTS).findOne({
    $or: [{ id }, { id: id.toLowerCase() }],
  });
  return doc ? toDomainEntity<Subject>(doc) : null;
}

export async function createSubject(input: {
  examId: string;
  title: string;
  description: string;
  icon?: string;
  status?: ContentStatus;
}): Promise<Subject> {
  const db = await getMongoDb();
  const slug = input.title.toLowerCase().replace(/[^a-z0-9]/g, "-");
  let id = `${input.examId.toLowerCase()}-${slug}`;

  const existing = await db.collection<SubjectDoc>(COLLECTIONS.SUBJECTS).findOne({
    id: { $in: [id, id.toLowerCase()] },
  });

  if (existing) {
    id = `${id}-${Date.now().toString(36)}`;
  }

  const now = new Date().toISOString();
  const newSubject: Subject = {
    id,
    examId: input.examId,
    examIds: [input.examId],
    title: input.title.trim(),
    description: input.description.trim(),
    icon: input.icon || "BookOpen",
    totalTopics: 0,
    status: input.status || "active",
    createdAt: now,
    updatedAt: now,
  };

  await db.collection<SubjectDoc>(COLLECTIONS.SUBJECTS).insertOne(newSubject as SubjectDoc);

  // Automatically register in exam_subjects junction table
  const existingCount = await db
    .collection<ExamSubjectDoc>(COLLECTIONS.EXAM_SUBJECTS)
    .countDocuments({ examId: input.examId });

  const junctionDoc: ExamSubjectDoc = {
    id: `es_${input.examId}_${id}`,
    examId: input.examId,
    subjectId: id,
    displayOrder: existingCount + 1,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  await db.collection<ExamSubjectDoc>(COLLECTIONS.EXAM_SUBJECTS).insertOne(junctionDoc);

  // Increment parent exam totalSubjects
  await db
    .collection<ExamDoc>(COLLECTIONS.EXAMS)
    .updateOne({ id: input.examId }, { $inc: { totalSubjects: 1 } });

  return newSubject;
}

export async function updateSubject(
  id: string,
  input: Partial<{
    examId: string;
    title: string;
    description: string;
    icon?: string;
    status?: ContentStatus;
  }>
): Promise<Subject | null> {
  const db = await getMongoDb();
  const now = new Date().toISOString();

  const updateFields: Record<string, unknown> = {
    updatedAt: now,
  };

  if (input.examId !== undefined) updateFields.examId = input.examId;
  if (input.title !== undefined) updateFields.title = input.title.trim();
  if (input.description !== undefined) updateFields.description = input.description.trim();
  if (input.icon !== undefined) updateFields.icon = input.icon;
  if (input.status !== undefined) updateFields.status = input.status;

  const result = await db.collection<SubjectDoc>(COLLECTIONS.SUBJECTS).findOneAndUpdate(
    { $or: [{ id }, { id: id.toLowerCase() }] },
    { $set: updateFields },
    { returnDocument: "after" }
  );

  return result ? toDomainEntity<Subject>(result) : null;
}

export async function deleteSubject(id: string): Promise<boolean> {
  const db = await getMongoDb();
  const lowerId = id.toLowerCase();

  const subject = await db.collection<SubjectDoc>(COLLECTIONS.SUBJECTS).findOne({
    $or: [{ id }, { id: lowerId }],
  });

  if (!subject) return false;

  await db.collection<SubjectDoc>(COLLECTIONS.SUBJECTS).deleteOne({
    $or: [{ id }, { id: lowerId }],
  });

  // Cascade clean-up (including exam_subjects junction records)
  await Promise.all([
    db.collection(COLLECTIONS.EXAM_SUBJECTS).deleteMany({ subjectId: { $in: [id, lowerId] } }),
    db.collection(COLLECTIONS.TOPICS).deleteMany({ subjectId: { $in: [id, lowerId] } }),
    db.collection(COLLECTIONS.QUESTIONS).deleteMany({ subjectId: { $in: [id, lowerId] } }),
    db.collection(COLLECTIONS.TESTS).deleteMany({ subjectId: { $in: [id, lowerId] } }),
    db.collection(COLLECTIONS.EXAMS).updateOne({ id: subject.examId }, { $inc: { totalSubjects: -1 } }),
  ]);

  return true;
}

// ---------------------------------------------------------------------------
// Topic Operations
// ---------------------------------------------------------------------------

export async function getAllTopics(subjectId?: string, examId?: string): Promise<Topic[]> {
  const db = await getMongoDb();
  const filter: Record<string, unknown> = {};

  if (subjectId) {
    filter.subjectId = { $in: [subjectId, subjectId.toLowerCase()] };
  }
  if (examId) {
    filter.examId = { $in: [examId, examId.toLowerCase()] };
  }

  const docs = await db
    .collection<TopicDoc>(COLLECTIONS.TOPICS)
    .find(filter)
    .sort({ title: 1 })
    .toArray();
  return toDomainEntities<Topic>(docs);
}

export async function getTopicById(id: string): Promise<Topic | null> {
  if (!id) return null;
  const db = await getMongoDb();
  const doc = await db.collection<TopicDoc>(COLLECTIONS.TOPICS).findOne({
    $or: [{ id }, { id: id.toLowerCase() }],
  });
  return doc ? toDomainEntity<Topic>(doc) : null;
}

export async function createTopic(input: {
  examId: string;
  subjectId: string;
  title: string;
  description: string;
  status?: ContentStatus;
}): Promise<Topic> {
  const db = await getMongoDb();
  let id = input.title.toLowerCase().replace(/[^a-z0-9]/g, "-") || `topic-${Date.now()}`;

  const existing = await db.collection<TopicDoc>(COLLECTIONS.TOPICS).findOne({
    id: { $in: [id, id.toLowerCase()] },
  });

  if (existing) {
    id = `${id}-${Date.now().toString(36)}`;
  }

  const now = new Date().toISOString();
  const newTopic: Topic = {
    id,
    subjectId: input.subjectId,
    examId: input.examId,
    title: input.title.trim(),
    description: input.description.trim(),
    questionCount: 0,
    status: input.status || "active",
    createdAt: now,
    updatedAt: now,
  };

  await db.collection<TopicDoc>(COLLECTIONS.TOPICS).insertOne(newTopic as TopicDoc);

  // Increment parent subject totalTopics
  await db
    .collection<SubjectDoc>(COLLECTIONS.SUBJECTS)
    .updateOne({ id: input.subjectId }, { $inc: { totalTopics: 1 } });

  return newTopic;
}

export async function updateTopic(
  id: string,
  input: Partial<{
    examId: string;
    subjectId: string;
    title: string;
    description: string;
    status?: ContentStatus;
  }>
): Promise<Topic | null> {
  const db = await getMongoDb();
  const now = new Date().toISOString();

  const updateFields: Record<string, unknown> = {
    updatedAt: now,
  };

  if (input.examId !== undefined) updateFields.examId = input.examId;
  if (input.subjectId !== undefined) updateFields.subjectId = input.subjectId;
  if (input.title !== undefined) updateFields.title = input.title.trim();
  if (input.description !== undefined) updateFields.description = input.description.trim();
  if (input.status !== undefined) updateFields.status = input.status;

  const result = await db.collection<TopicDoc>(COLLECTIONS.TOPICS).findOneAndUpdate(
    { $or: [{ id }, { id: id.toLowerCase() }] },
    { $set: updateFields },
    { returnDocument: "after" }
  );

  return result ? toDomainEntity<Topic>(result) : null;
}

export async function deleteTopic(id: string): Promise<boolean> {
  const db = await getMongoDb();
  const lowerId = id.toLowerCase();

  const topic = await db.collection<TopicDoc>(COLLECTIONS.TOPICS).findOne({
    $or: [{ id }, { id: lowerId }],
  });

  if (!topic) return false;

  await db.collection<TopicDoc>(COLLECTIONS.TOPICS).deleteOne({
    $or: [{ id }, { id: lowerId }],
  });

  // Cascade cleanup
  await Promise.all([
    db.collection(COLLECTIONS.QUESTIONS).deleteMany({ topicId: { $in: [id, lowerId] } }),
    db.collection(COLLECTIONS.TESTS).deleteMany({ topicId: { $in: [id, lowerId] } }),
    db.collection(COLLECTIONS.SUBJECTS).updateOne({ id: topic.subjectId }, { $inc: { totalTopics: -1 } }),
  ]);

  return true;
}

// ---------------------------------------------------------------------------
// Question Operations
// ---------------------------------------------------------------------------

export interface QuestionFilters {
  examId?: string;
  subjectId?: string;
  topicId?: string;
  difficulty?: QuestionDifficulty;
  status?: QuestionStatus;
  search?: string;
  limit?: number;
  skip?: number;
}

export async function getAllQuestions(filters?: QuestionFilters): Promise<Question[]> {
  const db = await getMongoDb();
  const filter: Record<string, unknown> = {};

  if (filters?.examId) {
    filter.examId = { $in: [filters.examId, filters.examId.toLowerCase()] };
  }
  if (filters?.subjectId) {
    filter.subjectId = { $in: [filters.subjectId, filters.subjectId.toLowerCase()] };
  }
  if (filters?.topicId) {
    filter.topicId = { $in: [filters.topicId, filters.topicId.toLowerCase()] };
  }
  if (filters?.difficulty) {
    filter.difficulty = filters.difficulty;
  }
  if (filters?.status) {
    filter.status = filters.status;
  }
  if (filters?.search) {
    const term = filters.search.trim();
    filter.$or = [
      { questionText: { $regex: term, $options: "i" } },
      { explanation: { $regex: term, $options: "i" } },
    ];
  }

  let cursor = db.collection<QuestionDoc>(COLLECTIONS.QUESTIONS).find(filter).sort({ createdAt: -1 });

  if (filters?.skip && filters.skip > 0) {
    cursor = cursor.skip(filters.skip);
  }
  if (filters?.limit && filters.limit > 0) {
    cursor = cursor.limit(filters.limit);
  }

  const docs = await cursor.toArray();
  return toDomainEntities<Question>(docs);
}

export async function getQuestionById(id: string): Promise<Question | null> {
  if (!id) return null;
  const db = await getMongoDb();
  const doc = await db.collection<QuestionDoc>(COLLECTIONS.QUESTIONS).findOne({
    $or: [{ id }, { id: id.toLowerCase() }],
  });
  return doc ? toDomainEntity<Question>(doc) : null;
}

export async function getQuestionsByIds(ids: string[]): Promise<Question[]> {
  if (!ids || ids.length === 0) return [];
  const db = await getMongoDb();
  const docs = await db.collection<QuestionDoc>(COLLECTIONS.QUESTIONS).find({
    id: { $in: ids },
  }).toArray();

  return toDomainEntities<Question>(docs);
}

export async function createQuestion(
  input: Omit<Question, "id" | "createdAt" | "updatedAt">
): Promise<Question> {
  const db = await getMongoDb();
  const now = new Date().toISOString();
  const id = `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  const newQuestion: Question = {
    ...input,
    id,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection<QuestionDoc>(COLLECTIONS.QUESTIONS).insertOne(newQuestion as QuestionDoc);

  // Increment parent topic questionCount
  if (input.topicId) {
    await db
      .collection<TopicDoc>(COLLECTIONS.TOPICS)
      .updateOne({ id: input.topicId }, { $inc: { questionCount: 1 } });
  }

  return newQuestion;
}

export async function updateQuestion(id: string, input: Partial<Question>): Promise<Question | null> {
  const db = await getMongoDb();
  const now = new Date().toISOString();

  const updateData: Partial<QuestionDoc> = { ...input };
  delete updateData.id;
  delete updateData.createdAt;
  updateData.updatedAt = now;

  const result = await db.collection<QuestionDoc>(COLLECTIONS.QUESTIONS).findOneAndUpdate(
    { $or: [{ id }, { id: id.toLowerCase() }] },
    { $set: updateData },
    { returnDocument: "after" }
  );

  return result ? toDomainEntity<Question>(result) : null;
}

export async function deleteQuestion(id: string): Promise<boolean> {
  const db = await getMongoDb();
  const lowerId = id.toLowerCase();

  const question = await db.collection<QuestionDoc>(COLLECTIONS.QUESTIONS).findOne({
    $or: [{ id }, { id: lowerId }],
  });

  if (!question) return false;

  await db.collection<QuestionDoc>(COLLECTIONS.QUESTIONS).deleteOne({
    $or: [{ id }, { id: lowerId }],
  });

  // Decrement parent topic questionCount
  if (question.topicId) {
    await db
      .collection<TopicDoc>(COLLECTIONS.TOPICS)
      .updateOne({ id: question.topicId }, { $inc: { questionCount: -1 } });
  }

  // Remove deleted question ID from tests and sync questionCount
  await db.collection<TestDoc>(COLLECTIONS.TESTS).updateMany(
    { questionIds: { $in: [id, lowerId] } },
    { $pull: { questionIds: { $in: [id, lowerId] } } as never }
  );

  return true;
}

// ---------------------------------------------------------------------------
// Test Operations
// ---------------------------------------------------------------------------

export interface TestFilters {
  examId?: string;
  subjectId?: string;
  topicId?: string;
  status?: TestStatus;
  difficulty?: TestDifficulty;
  search?: string;
  limit?: number;
  skip?: number;
}

export async function getAllTests(filters?: TestFilters): Promise<Test[]> {
  const db = await getMongoDb();
  const filter: Record<string, unknown> = {};

  if (filters?.examId) {
    filter.examId = { $in: [filters.examId, filters.examId.toLowerCase()] };
  }
  if (filters?.subjectId) {
    filter.subjectId = { $in: [filters.subjectId, filters.subjectId.toLowerCase()] };
  }
  if (filters?.topicId) {
    filter.topicId = { $in: [filters.topicId, filters.topicId.toLowerCase()] };
  }
  if (filters?.status) {
    filter.status = filters.status;
  }
  if (filters?.difficulty) {
    filter.difficulty = filters.difficulty;
  }
  if (filters?.search) {
    const term = filters.search.trim();
    filter.$or = [
      { title: { $regex: term, $options: "i" } },
      { description: { $regex: term, $options: "i" } },
    ];
  }

  let cursor = db.collection<TestDoc>(COLLECTIONS.TESTS).find(filter).sort({ createdAt: -1 });

  if (filters?.skip && filters.skip > 0) {
    cursor = cursor.skip(filters.skip);
  }
  if (filters?.limit && filters.limit > 0) {
    cursor = cursor.limit(filters.limit);
  }

  const docs = await cursor.toArray();
  return toDomainEntities<Test>(docs);
}

export async function getTestById(id: string): Promise<Test | null> {
  if (!id) return null;
  const db = await getMongoDb();
  const doc = await db.collection<TestDoc>(COLLECTIONS.TESTS).findOne({
    $or: [{ id }, { id: id.toLowerCase() }],
  });
  return doc ? toDomainEntity<Test>(doc) : null;
}

export async function createTest(
  input: Omit<Test, "id" | "questionCount" | "createdAt" | "updatedAt">
): Promise<Test> {
  const db = await getMongoDb();
  const now = new Date().toISOString();
  const id = `test-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  const newTest: Test = {
    ...input,
    id,
    questionCount: input.questionIds.length,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection<TestDoc>(COLLECTIONS.TESTS).insertOne(newTest as TestDoc);
  return newTest;
}

export async function updateTest(id: string, input: Partial<Test>): Promise<Test | null> {
  const db = await getMongoDb();
  const now = new Date().toISOString();

  const updateData: Partial<TestDoc> = { ...input };
  delete updateData.id;
  delete updateData.createdAt;
  updateData.updatedAt = now;

  if (input.questionIds !== undefined) {
    updateData.questionCount = input.questionIds.length;
  }

  const result = await db.collection<TestDoc>(COLLECTIONS.TESTS).findOneAndUpdate(
    { $or: [{ id }, { id: id.toLowerCase() }] },
    { $set: updateData },
    { returnDocument: "after" }
  );

  return result ? toDomainEntity<Test>(result) : null;
}

export async function togglePublishTest(id: string): Promise<Test | null> {
  const current = await getTestById(id);
  if (!current) return null;

  const nextStatus: TestStatus = current.status === "published" ? "draft" : "published";
  return updateTest(id, { status: nextStatus });
}

export async function deleteTest(id: string): Promise<boolean> {
  const db = await getMongoDb();
  const lowerId = id.toLowerCase();

  const result = await db.collection<TestDoc>(COLLECTIONS.TESTS).deleteOne({
    $or: [{ id }, { id: lowerId }],
  });

  return result.deletedCount > 0;
}

// ---------------------------------------------------------------------------
// Bulk Quiz Importer
// ---------------------------------------------------------------------------

export interface ImportQuizData {
  examId: string;
  subjectId: string;
  topicId: string;
  title: string;
  description: string;
  durationMinutes: number;
  difficulty: TestDifficulty;
  status: TestStatus;
  questions: Array<{
    questionText: string;
    options: QuestionOption[];
    correctAnswer: string;
    explanation: string;
    difficulty: QuestionDifficulty;
  }>;
}

export async function importQuizWithQuestions(input: ImportQuizData): Promise<{
  test: Test;
  questions: Question[];
}> {
  const db = await getMongoDb();
  const now = new Date().toISOString();

  // 1. Prepare questions
  const createdQuestions: Question[] = input.questions.map((q, idx) => {
    const qId = `q-${Date.now()}-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`;
    return {
      id: qId,
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      examId: input.examId,
      subjectId: input.subjectId,
      topicId: input.topicId,
      difficulty: q.difficulty,
      status: "published" as QuestionStatus,
      createdAt: now,
      updatedAt: now,
    };
  });

  // 2. Prepare test
  const testId = `test-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const createdTest: Test = {
    id: testId,
    title: input.title.trim(),
    description: input.description.trim(),
    examId: input.examId,
    subjectId: input.subjectId,
    topicId: input.topicId,
    questionIds: createdQuestions.map((q) => q.id),
    durationMinutes: input.durationMinutes,
    questionCount: createdQuestions.length,
    difficulty: input.difficulty,
    status: input.status,
    createdAt: now,
    updatedAt: now,
  };

  // 3. Batch insert into MongoDB
  await Promise.all([
    db.collection<QuestionDoc>(COLLECTIONS.QUESTIONS).insertMany(createdQuestions as QuestionDoc[]),
    db.collection<TestDoc>(COLLECTIONS.TESTS).insertOne(createdTest as TestDoc),
    db.collection<TopicDoc>(COLLECTIONS.TOPICS).updateOne(
      { id: input.topicId },
      { $inc: { questionCount: createdQuestions.length } }
    ),
  ]);

  return {
    test: createdTest,
    questions: createdQuestions,
  };
}

// ---------------------------------------------------------------------------
// Section Operations
// ---------------------------------------------------------------------------

export async function getAllSections(): Promise<Section[]> {
  const db = await getMongoDb();
  const docs = await db
    .collection<SectionDoc>(COLLECTIONS.SECTIONS)
    .find()
    .sort({ order: 1, title: 1 })
    .toArray();
  return toDomainEntities<Section>(docs);
}

export async function getSectionById(id: string): Promise<Section | null> {
  if (!id) return null;
  const db = await getMongoDb();
  const doc = await db.collection<SectionDoc>(COLLECTIONS.SECTIONS).findOne({ id });
  return doc ? toDomainEntity<Section>(doc) : null;
}

export async function getSectionsBySubject(subjectId: string): Promise<Section[]> {
  if (!subjectId) return [];
  const db = await getMongoDb();
  const docs = await db
    .collection<SectionDoc>(COLLECTIONS.SECTIONS)
    .find({ subjectId })
    .sort({ order: 1, title: 1 })
    .toArray();
  return toDomainEntities<Section>(docs);
}

export async function getSectionsByExam(examId: string): Promise<Section[]> {
  if (!examId) return [];
  const db = await getMongoDb();
  const docs = await db
    .collection<SectionDoc>(COLLECTIONS.SECTIONS)
    .find({ examId })
    .sort({ order: 1, title: 1 })
    .toArray();
  return toDomainEntities<Section>(docs);
}

export async function createSection(input: {
  title: string;
  description: string;
  examId: string;
  subjectId: string;
  order?: number;
  status?: ContentStatus;
}): Promise<Section> {
  const db = await getMongoDb();
  const now = new Date().toISOString();
  const newSection: Section = {
    id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: input.title.trim(),
    description: input.description.trim(),
    examId: input.examId,
    subjectId: input.subjectId,
    order: input.order ?? 1,
    status: input.status || "active",
    createdAt: now,
    updatedAt: now,
  };

  await db.collection<SectionDoc>(COLLECTIONS.SECTIONS).insertOne(newSection as SectionDoc);
  return newSection;
}

export async function updateSection(
  id: string,
  input: Partial<Omit<Section, "id" | "createdAt" | "updatedAt">>
): Promise<Section | null> {
  if (!id) return null;
  const db = await getMongoDb();
  const now = new Date().toISOString();

  const result = await db.collection<SectionDoc>(COLLECTIONS.SECTIONS).findOneAndUpdate(
    { id },
    {
      $set: {
        ...input,
        updatedAt: now,
      },
    },
    { returnDocument: "after" }
  );

  return result ? toDomainEntity<Section>(result) : null;
}

export async function countDependentLessons(sectionId: string): Promise<number> {
  if (!sectionId) return 0;
  const db = await getMongoDb();
  return db.collection(COLLECTIONS.LESSONS).countDocuments({ sectionId });
}

export async function deleteSection(id: string): Promise<boolean> {
  if (!id) return false;
  const db = await getMongoDb();

  // Referential integrity check
  const dependentLessons = await countDependentLessons(id);
  if (dependentLessons > 0) {
    throw new Error(
      `Cannot delete section: ${dependentLessons} lesson(s) are associated with it. Please reassign or delete dependent lessons first.`
    );
  }

  const result = await db.collection<SectionDoc>(COLLECTIONS.SECTIONS).deleteOne({ id });
  return result.deletedCount > 0;
}

// ---------------------------------------------------------------------------
// Lesson Operations
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function getAllLessons(): Promise<Lesson[]> {
  const db = await getMongoDb();
  const docs = await db
    .collection<LessonDoc>(COLLECTIONS.LESSONS)
    .find()
    .sort({ updatedAt: -1 })
    .toArray();
  return toDomainEntities<Lesson>(docs);
}

export async function getPublishedLessons(filter?: {
  examId?: string;
  subjectId?: string;
  topicId?: string;
}): Promise<Lesson[]> {
  const db = await getMongoDb();
  const query: Record<string, unknown> = { status: "published" };
  if (filter?.examId) query.examId = filter.examId;
  if (filter?.subjectId) query.subjectId = filter.subjectId;
  if (filter?.topicId) query.topicId = filter.topicId;

  const docs = await db
    .collection<LessonDoc>(COLLECTIONS.LESSONS)
    .find(query)
    .sort({ order: 1, title: 1 })
    .toArray();
  return toDomainEntities<Lesson>(docs);
}

export async function getLessonById(id: string): Promise<Lesson | null> {
  if (!id) return null;
  const db = await getMongoDb();
  const doc = await db.collection<LessonDoc>(COLLECTIONS.LESSONS).findOne({ id });
  return doc ? toDomainEntity<Lesson>(doc) : null;
}

export async function getLessonsByTopic(topicId: string): Promise<Lesson[]> {
  if (!topicId) return [];
  const db = await getMongoDb();
  const docs = await db
    .collection<LessonDoc>(COLLECTIONS.LESSONS)
    .find({ topicId })
    .sort({ order: 1, title: 1 })
    .toArray();
  return toDomainEntities<Lesson>(docs);
}

export async function createLesson(input: {
  title: string;
  slug?: string;
  description: string;
  content: string;
  examId: string;
  subjectId: string;
  topicId: string;
  sectionId?: string;
  learningObjectives?: string[];
  order?: number;
  readTimeMinutes?: number;
  status?: LessonStatus;
}): Promise<Lesson> {
  const db = await getMongoDb();
  const now = new Date().toISOString();
  const calculatedReadTime =
    input.readTimeMinutes ||
    Math.max(1, Math.ceil(input.content.trim().split(/\s+/).length / 200));

  const newLesson: Lesson = {
    id: `les-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: input.title.trim(),
    slug: input.slug?.trim() || slugify(input.title),
    description: input.description.trim(),
    content: input.content,
    examId: input.examId,
    subjectId: input.subjectId,
    topicId: input.topicId,
    sectionId: input.sectionId,
    learningObjectives: input.learningObjectives || [],
    order: input.order ?? 1,
    readTimeMinutes: calculatedReadTime,
    status: input.status || "draft",
    createdAt: now,
    updatedAt: now,
  };

  await db.collection<LessonDoc>(COLLECTIONS.LESSONS).insertOne(newLesson as LessonDoc);
  return newLesson;
}

export async function updateLesson(
  id: string,
  input: Partial<Omit<Lesson, "id" | "createdAt" | "updatedAt">>
): Promise<Lesson | null> {
  if (!id) return null;
  const db = await getMongoDb();
  const now = new Date().toISOString();

  const updateFields: Record<string, unknown> = {
    ...input,
    updatedAt: now,
  };

  if (input.content && !input.readTimeMinutes) {
    updateFields.readTimeMinutes = Math.max(1, Math.ceil(input.content.trim().split(/\s+/).length / 200));
  }

  const result = await db.collection<LessonDoc>(COLLECTIONS.LESSONS).findOneAndUpdate(
    { id },
    { $set: updateFields },
    { returnDocument: "after" }
  );

  return result ? toDomainEntity<Lesson>(result) : null;
}

export async function deleteLesson(id: string): Promise<boolean> {
  if (!id) return false;
  const db = await getMongoDb();
  const result = await db.collection<LessonDoc>(COLLECTIONS.LESSONS).deleteOne({ id });
  return result.deletedCount > 0;
}

export async function toggleLessonPublish(id: string): Promise<Lesson | null> {
  if (!id) return null;
  const current = await getLessonById(id);
  if (!current) return null;

  const nextStatus: LessonStatus = current.status === "published" ? "draft" : "published";
  return updateLesson(id, { status: nextStatus });
}

// ---------------------------------------------------------------------------
// Mock Tests Operations (Reuses Test entity)
// ---------------------------------------------------------------------------

export async function getAllMockTests(): Promise<Test[]> {
  const db = await getMongoDb();
  const docs = await db
    .collection<TestDoc>(COLLECTIONS.TESTS)
    .find({
      $or: [
        { testType: "mock" },
        { title: { $regex: /mock/i } },
      ],
    })
    .sort({ createdAt: -1 })
    .toArray();
  return toDomainEntities<Test>(docs);
}

export async function getPublishedMockTests(examId?: string): Promise<Test[]> {
  const db = await getMongoDb();
  const query: Record<string, unknown> = {
    status: "published",
    $or: [
      { testType: "mock" },
      { title: { $regex: /mock/i } },
    ],
  };
  if (examId) query.examId = examId;

  const docs = await db
    .collection<TestDoc>(COLLECTIONS.TESTS)
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();
  return toDomainEntities<Test>(docs);
}
