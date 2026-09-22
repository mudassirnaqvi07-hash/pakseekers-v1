import type { Metadata } from "next";
import { PlaceholderPage } from "../_components/placeholder-page";

export const metadata: Metadata = { title: "Tests" };

export default function TestsPage() {
  return (
    <PlaceholderPage
      title="Tests"
      description="Manage test definitions — NAT, PU Entry Test, LGAT, and more."
      phase="Phase 5 — Test Structure Management"
    />
  );
}
