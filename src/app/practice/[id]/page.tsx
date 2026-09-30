/**
 * Direct Practice Route — /practice/[id]
 *
 * Enforces student authentication. Unauthenticated users are redirected to login
 * with callbackUrl. Authenticated students are forwarded to the full practice canvas.
 */

import { notFound, redirect } from "next/navigation";
import { requireStudent } from "@/server/auth/session";
import { getTestById } from "@/server/repositories/content-repository";

interface PracticeByIdPageProps {
  params: Promise<{ id: string }>;
}

export default async function PracticeByIdPage({ params }: PracticeByIdPageProps) {
  const { id } = await params;

  // 1. Enforce student authentication with callbackUrl
  await requireStudent(`/practice/${id}`);

  // 2. Resolve test
  const test = getTestById(id);
  if (!test || test.status !== "published") {
    notFound();
  }

  // 3. Forward to the test session
  redirect(
    `/exams/${test.examId}/topics/${test.topicId || "cell-biology"}/practice?testId=${test.id}`
  );
}
