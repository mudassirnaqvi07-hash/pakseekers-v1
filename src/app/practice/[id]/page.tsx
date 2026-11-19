/**
 * Direct Practice Route — /practice/[id]
 *
 * Forwards to canonical /tests/[id] route.
 */

import { redirect } from "next/navigation";

interface PracticeByIdPageProps {
  params: Promise<{ id: string }>;
}

export default async function PracticeByIdPage({ params }: PracticeByIdPageProps) {
  const { id } = await params;
  redirect(`/tests/${id}`);
}
