import type { Metadata } from "next";
import { PlaceholderPage } from "../_components/placeholder-page";

export const metadata: Metadata = { title: "Questions" };

export default function QuestionsPage() {
  return (
    <PlaceholderPage
      title="Questions"
      description="Build and manage the question bank — create, review, publish, and archive questions."
      phase="Phase 7 — Question Bank"
    />
  );
}
