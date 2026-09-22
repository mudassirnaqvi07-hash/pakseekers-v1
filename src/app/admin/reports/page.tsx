import type { Metadata } from "next";
import { PlaceholderPage } from "../_components/placeholder-page";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return (
    <PlaceholderPage
      title="Reports"
      description="Analytics and reporting for content performance and student activity."
      phase="Phase 9 — Students + Reports"
    />
  );
}
