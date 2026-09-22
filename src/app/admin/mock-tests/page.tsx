import type { Metadata } from "next";
import { PlaceholderPage } from "../_components/placeholder-page";

export const metadata: Metadata = { title: "Mock Tests" };

export default function MockTestsPage() {
  return (
    <PlaceholderPage
      title="Mock Tests"
      description="Design timed mock tests by selecting questions from the question bank."
      phase="Phase 8 — Mock Tests"
    />
  );
}
