"use server";

/**
 * Administrative Management Server Actions — PakSeekers.
 *
 * Provides protected mutations for:
 *   - Student Account Controls (Activation, Suspension, Admin Profile Editing)
 *   - Question Bug Reports (Triage, Review, Resolution)
 *   - Platform Settings (General, System, Exam, Content Defaults)
 */

import { revalidatePath } from "next/cache";
import type {
  ActionResult,
  PlatformSettings,
  QuestionReport,
  QuestionReportStatus,
  SafeUser,
  UserStatus,
} from "@/types";
import { getCurrentUser } from "@/server/auth/session";
import * as userRepo from "@/server/repositories/user-repository";
import * as reportRepo from "@/server/repositories/report-repository";
import * as settingsRepo from "@/server/repositories/settings-repository";

async function verifyAdminAuth(): Promise<{ user: SafeUser } | { error: ActionResult<never> }> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return {
      error: {
        success: false,
        error: "Unauthorized: Administrator privileges are required to perform this action.",
      },
    };
  }
  return { user };
}

// ---------------------------------------------------------------------------
// Student Account Actions
// ---------------------------------------------------------------------------

export async function updateStudentStatusAction(
  studentId: string,
  status: UserStatus
): Promise<ActionResult<SafeUser>> {
  const auth = await verifyAdminAuth();
  if ("error" in auth) return auth.error;

  if (!studentId) return { success: false, error: "Student ID is required." };
  if (status !== "active" && status !== "suspended") {
    return { success: false, error: "Status must be either 'active' or 'suspended'." };
  }

  try {
    const updated = await userRepo.updateStudentStatus(studentId, status);
    if (!updated) return { success: false, error: "Student account not found." };

    revalidatePath("/admin/students");
    revalidatePath(`/admin/students/${studentId}`);
    return { success: true, data: updated };
  } catch (err) {
    console.error("Failed to update student status:", err);
    return { success: false, error: "Failed to update student account status." };
  }
}

export async function updateStudentProfileByAdminAction(
  studentId: string,
  formData: FormData
): Promise<ActionResult<SafeUser>> {
  const auth = await verifyAdminAuth();
  if ("error" in auth) return auth.error;

  if (!studentId) return { success: false, error: "Student ID is required." };

  const name = formData.get("name")?.toString();
  const educationLevel = formData.get("educationLevel")?.toString();
  const institution = formData.get("institution")?.toString();
  const targetExam = formData.get("targetExam")?.toString();
  const phone = formData.get("phone")?.toString();
  const statusRaw = formData.get("status")?.toString();
  const status =
    statusRaw === "active" || statusRaw === "suspended"
      ? (statusRaw as UserStatus)
      : undefined;

  try {
    const updated = await userRepo.updateStudentProfileByAdmin(studentId, {
      name,
      educationLevel,
      institution,
      targetExam,
      phone,
      status,
    });

    if (!updated) return { success: false, error: "Student account not found." };

    revalidatePath("/admin/students");
    revalidatePath(`/admin/students/${studentId}`);
    return { success: true, data: updated };
  } catch (err) {
    console.error("Failed to update student profile by admin:", err);
    return { success: false, error: "Failed to update student profile." };
  }
}

// ---------------------------------------------------------------------------
// Question Reports Actions
// ---------------------------------------------------------------------------

export async function resolveQuestionReportAction(
  reportId: string,
  status: QuestionReportStatus,
  adminNotes?: string
): Promise<ActionResult<QuestionReport>> {
  const auth = await verifyAdminAuth();
  if ("error" in auth) return auth.error;

  if (!reportId) return { success: false, error: "Report ID is required." };

  try {
    const updated = await reportRepo.updateQuestionReportStatus(
      reportId,
      status,
      adminNotes,
      auth.user.name || "Administrator"
    );

    if (!updated) return { success: false, error: "Question report not found." };

    revalidatePath("/admin/question-reports");
    revalidatePath(`/admin/question-reports/${reportId}`);
    revalidatePath("/admin/reports");
    return { success: true, data: updated };
  } catch (err) {
    console.error("Failed to update question report:", err);
    return { success: false, error: "Failed to update question report." };
  }
}

export const updateQuestionReportStatusAction = resolveQuestionReportAction;

// ---------------------------------------------------------------------------
// Platform Settings Actions
// ---------------------------------------------------------------------------

export async function updateGeneralSettingsAction(
  formData: FormData
): Promise<ActionResult<PlatformSettings>> {
  const auth = await verifyAdminAuth();
  if ("error" in auth) return auth.error;

  const general = {
    platformName: formData.get("platformName")?.toString()?.trim() || "PakSeekers",
    tagline: formData.get("tagline")?.toString()?.trim() || "",
    contactEmail: formData.get("contactEmail")?.toString()?.trim() || "",
    supportPhone: formData.get("supportPhone")?.toString()?.trim() || "",
    address: formData.get("address")?.toString()?.trim() || "",
  };

  try {
    const updated = await settingsRepo.updatePlatformSettings(
      { general },
      auth.user.email
    );
    revalidatePath("/admin/settings");
    revalidatePath("/");
    return { success: true, data: updated };
  } catch (err) {
    console.error("Failed to update general settings:", err);
    return { success: false, error: "Failed to save general settings." };
  }
}

export async function updatePlatformConfigAction(
  formData: FormData
): Promise<ActionResult<PlatformSettings>> {
  const auth = await verifyAdminAuth();
  if ("error" in auth) return auth.error;

  const allowRegistration = formData.get("allowRegistration") === "true";
  const maintenanceMode = formData.get("maintenanceMode") === "true";
  const announcementBanner = formData.get("announcementBanner")?.toString()?.trim() || "";

  try {
    const updated = await settingsRepo.updatePlatformSettings(
      {
        platform: {
          allowRegistration,
          maintenanceMode,
          announcementBanner,
        },
      },
      auth.user.email
    );
    revalidatePath("/admin/settings");
    revalidatePath("/");
    return { success: true, data: updated };
  } catch (err) {
    console.error("Failed to update platform configuration:", err);
    return { success: false, error: "Failed to save platform configuration." };
  }
}

export async function updateExaminationSettingsAction(
  formData: FormData
): Promise<ActionResult<PlatformSettings>> {
  const auth = await verifyAdminAuth();
  if ("error" in auth) return auth.error;

  const defaultTestDuration = Number(formData.get("defaultTestDuration")) || 30;
  const passingScorePercentage = Number(formData.get("passingScorePercentage")) || 50;
  const allowTestRetakes = formData.get("allowTestRetakes") === "true";
  const showExplanationsImmediately = formData.get("showExplanationsImmediately") === "true";

  try {
    const updated = await settingsRepo.updatePlatformSettings(
      {
        examination: {
          defaultTestDuration,
          passingScorePercentage,
          allowTestRetakes,
          showExplanationsImmediately,
        },
      },
      auth.user.email
    );
    revalidatePath("/admin/settings");
    return { success: true, data: updated };
  } catch (err) {
    console.error("Failed to update examination settings:", err);
    return { success: false, error: "Failed to save examination settings." };
  }
}

export async function updateContentDefaultsAction(
  formData: FormData
): Promise<ActionResult<PlatformSettings>> {
  const auth = await verifyAdminAuth();
  if ("error" in auth) return auth.error;

  const defaultQuestionStatus =
    (formData.get("defaultQuestionStatus")?.toString() as "draft" | "review" | "published" | "archived") ||
    "published";
  const enableQuestionReporting = formData.get("enableQuestionReporting") === "true";
  const maxQuestionsPerCustomTest = Number(formData.get("maxQuestionsPerCustomTest")) || 100;

  try {
    const updated = await settingsRepo.updatePlatformSettings(
      {
        content: {
          defaultQuestionStatus,
          enableQuestionReporting,
          maxQuestionsPerCustomTest,
        },
      },
      auth.user.email
    );
    revalidatePath("/admin/settings");
    return { success: true, data: updated };
  } catch (err) {
    console.error("Failed to update content defaults:", err);
    return { success: false, error: "Failed to save content default settings." };
  }
}
