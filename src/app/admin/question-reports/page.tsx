import type { Metadata } from "next";
import { PlaceholderPage } from "../_components/placeholder-page";

export const metadata: Metadata = { title: "Question Reports" };

export default function QuestionReportsPage() {
  return (
    <PlaceholderPage
      title="Question Reports"
      description="Review questions flagged by students as inaccurate, unclear, or incorrect."
      phase="Phase 9 — Students + Reports"
    />
  );
}
