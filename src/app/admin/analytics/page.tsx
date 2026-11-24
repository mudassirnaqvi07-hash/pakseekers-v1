import type { Metadata } from "next";
import ReportsPage from "@/app/admin/reports/page";

export const metadata: Metadata = {
  title: "Analytics & Reports — PakSeekers Admin",
  description: "Real-time platform usage metrics, test performance distribution, and content breakdown.",
};

export default async function AdminAnalyticsPage() {
  return <ReportsPage />;
}
