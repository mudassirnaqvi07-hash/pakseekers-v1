import type { Metadata } from "next";
import { PlaceholderPage } from "../_components/placeholder-page";

export const metadata: Metadata = { title: "Lessons" };

export default function LessonsPage() {
  return (
    <PlaceholderPage
      title="Lessons"
      description="Create and manage lesson content associated with each topic."
      phase="Phase 6 — Lesson Management"
    />
  );
}
