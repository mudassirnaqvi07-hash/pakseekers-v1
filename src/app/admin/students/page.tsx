import type { Metadata } from "next";
import { PlaceholderPage } from "../_components/placeholder-page";

export const metadata: Metadata = { title: "Students" };

export default function StudentsPage() {
  return (
    <PlaceholderPage
      title="Students"
      description="View and manage registered student accounts and their progress."
      phase="Phase 9 — Students + Reports"
    />
  );
}
