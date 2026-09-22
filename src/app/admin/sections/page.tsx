import type { Metadata } from "next";
import { PlaceholderPage } from "../_components/placeholder-page";

export const metadata: Metadata = { title: "Sections" };

export default function SectionsPage() {
  return (
    <PlaceholderPage
      title="Sections"
      description="Organise tests into logical sections for structured content delivery."
      phase="Phase 5 — Test Structure Management"
    />
  );
}
