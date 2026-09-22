import type { Metadata } from "next";
import { PlaceholderPage } from "../_components/placeholder-page";

export const metadata: Metadata = { title: "Topics" };

export default function TopicsPage() {
  return (
    <PlaceholderPage
      title="Topics"
      description="Manage the topics within each section — the curriculum building blocks."
      phase="Phase 5 — Test Structure Management"
    />
  );
}
