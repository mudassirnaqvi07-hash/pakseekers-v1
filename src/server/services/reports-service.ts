import "server-only";

/**
 * Reports & Analytics Application Service — PakSeekers.
 *
 * Exposes server-side API for platform overview, performance analytics,
 * student engagement reports, and question issue reports.
 */

import type { QuestionReport, QuestionReportStatus } from "@/types";
import * as reportRepo from "@/server/repositories/report-repository";
import type {
  PlatformAnalyticsReport,
  PlatformOverviewStats,
  PopularTestStat,
  SubjectContentDistribution,
} from "@/server/repositories/report-repository";

export type {
  PlatformAnalyticsReport,
  PlatformOverviewStats,
  PopularTestStat,
  SubjectContentDistribution,
};

export async function getPlatformAnalytics(): Promise<PlatformAnalyticsReport> {
  return reportRepo.getPlatformAnalytics();
}

export async function getAllQuestionReports(filter?: {
  status?: string;
  search?: string;
}): Promise<QuestionReport[]> {
  return reportRepo.getAllQuestionReports(filter);
}

export async function getQuestionReportById(id: string): Promise<QuestionReport | null> {
  return reportRepo.getQuestionReportById(id);
}

export async function getPendingQuestionReportsCount(): Promise<number> {
  return reportRepo.countPendingQuestionReports();
}

export async function updateQuestionReportStatus(
  id: string,
  status: QuestionReportStatus,
  adminNotes?: string,
  resolvedBy?: string
): Promise<QuestionReport | null> {
  return reportRepo.updateQuestionReportStatus(id, status, adminNotes, resolvedBy);
}

export async function generatePlatformCsvReport(): Promise<string> {
  return reportRepo.generateCsvReportData();
}
