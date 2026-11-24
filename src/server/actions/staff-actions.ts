"use server";

/**
 * Staff Management Server Actions — PakSeekers Administration.
 *
 * Strictly restricted to authenticated, active ADMIN accounts.
 * Staff accounts cannot manage other Staff, assign permissions, or escalate privileges.
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult, Permission, SafeUser, UserStatus } from "@/types";
import { verifyAdminAuth } from "@/server/auth/session";
import { sanitizeStaffPermissions } from "@/lib/auth/permissions";
import * as userService from "@/server/services/user-service";
import {
  registerStaffByAdmin,
  resendStudentVerificationOtp,
} from "@/server/services/auth-service";

const createStaffSchema = z.object({
  name: z.string().trim().min(2, "Full name must be at least 2 characters.").max(100),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(100)
    .regex(/^(?=.*[A-Za-z])(?=.*\d)/, "Password must contain at least one letter and one number."),
  staffTitle: z.string().trim().max(100).optional(),
  department: z.string().trim().max(100).optional(),
  permissions: z.array(z.string()).optional(),
});

const updateStaffDetailsSchema = z.object({
  name: z.string().trim().min(2, "Full name must be at least 2 characters.").max(100),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address."),
  staffTitle: z.string().trim().max(100).optional(),
  department: z.string().trim().max(100).optional(),
  password: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || (val.length >= 8 && /^(?=.*[A-Za-z])(?=.*\d)/.test(val)),
      "New password must be at least 8 characters and contain a letter and number."
    ),
});

function revalidateStaffPaths(staffId?: string) {
  revalidatePath("/admin/staff");
  if (staffId) {
    revalidatePath(`/admin/staff/${staffId}`);
  }
  revalidatePath("/admin/dashboard");
  revalidatePath("/staff/dashboard");
}

export async function createStaffAccountAction(
  rawInput: unknown
): Promise<ActionResult<{ staff: SafeUser; emailSent: boolean }>> {
  const auth = await verifyAdminAuth();
  if ("error" in auth) return auth.error;

  const parsed = createStaffSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid staff account details.",
    };
  }

  try {
    const permissions = sanitizeStaffPermissions(parsed.data.permissions);
    const result = await registerStaffByAdmin({
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
      staffTitle: parsed.data.staffTitle,
      department: parsed.data.department,
      permissions,
      createdBy: auth.user.id,
    });

    revalidateStaffPaths(result.user.id);
    return {
      success: true,
      data: {
        staff: result.user,
        emailSent: result.emailSent,
      },
      message: result.emailSent
        ? `Staff account created! A 6-digit verification code has been sent to ${result.user.email}.`
        : "Staff account created with Pending Verification status, but the email could not be dispatched right now. Use Resend Verification Code on their profile or login page.",
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to create staff account.";
    return {
      success: false,
      error: msg.includes("already exists") ? "An account with this email already exists." : msg,
    };
  }
}

export async function resendStaffVerificationByAdminAction(
  staffId: string
): Promise<ActionResult<{ message: string; cooldownSeconds?: number }>> {
  const auth = await verifyAdminAuth();
  if ("error" in auth) return auth.error;

  if (!staffId?.trim()) {
    return { success: false, error: "Staff ID is required." };
  }

  const staff = await userService.getStaffById(staffId.trim());
  if (!staff || staff.role !== "staff") {
    return { success: false, error: "Staff account not found." };
  }

  if (staff.isEmailVerified !== false) {
    return {
      success: true,
      data: { message: "Staff email is already verified.", cooldownSeconds: 0 },
    };
  }

  const res = await resendStudentVerificationOtp(staff.email);
  if (!res.success) {
    return {
      success: false,
      error: res.message,
      retryAfterSeconds: res.retryAfterSeconds,
    };
  }

  revalidateStaffPaths(staff.id);
  return {
    success: true,
    data: {
      message: res.message,
      cooldownSeconds: res.cooldownSeconds,
    },
  };
}

export async function updateStaffDetailsAction(
  staffId: string,
  rawInput: unknown
): Promise<ActionResult<SafeUser>> {
  const auth = await verifyAdminAuth();
  if ("error" in auth) return auth.error;

  if (!staffId?.trim()) {
    return { success: false, error: "Staff ID is required." };
  }

  const parsed = updateStaffDetailsSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid staff details.",
    };
  }

  try {
    const updated = await userService.updateStaffDetails(staffId.trim(), parsed.data);
    if (!updated) {
      return { success: false, error: "Staff account not found." };
    }

    revalidateStaffPaths(staffId.trim());
    return { success: true, data: updated, message: "Staff details updated successfully." };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update staff details.",
    };
  }
}

export async function updateStaffPermissionsAction(
  staffId: string,
  permissions: Permission[]
): Promise<ActionResult<SafeUser>> {
  const auth = await verifyAdminAuth();
  if ("error" in auth) return auth.error;

  if (!staffId?.trim()) {
    return { success: false, error: "Staff ID is required." };
  }

  // Prevent accidental self-modification
  if (auth.user.id === staffId.trim()) {
    return { success: false, error: "Administrators cannot modify their own permissions." };
  }

  try {
    const existing = await userService.getStaffById(staffId.trim());
    if (!existing || existing.role !== "staff") {
      return { success: false, error: "Staff account not found." };
    }

    const sanitized = sanitizeStaffPermissions(permissions);
    const updated = await userService.updateStaffPermissions(staffId.trim(), sanitized);
    if (!updated) {
      return { success: false, error: "Failed to update staff permissions." };
    }

    revalidateStaffPaths(staffId.trim());
    revalidatePath("/staff", "layout");
    return {
      success: true,
      data: updated,
      message: `Updated permissions (${sanitized.length} active permissions). Changes take effect immediately.`,
    };
  } catch (err) {
    console.error("Failed to update staff permissions:", err);
    return { success: false, error: "Failed to update staff permissions." };
  }
}

export async function updateStaffStatusAction(
  staffId: string,
  status: UserStatus
): Promise<ActionResult<SafeUser>> {
  const auth = await verifyAdminAuth();
  if ("error" in auth) return auth.error;

  if (!staffId?.trim()) {
    return { success: false, error: "Staff ID is required." };
  }

  const normalizedId = staffId.trim();
  if (auth.user.id === normalizedId) {
    return { success: false, error: "Administrators cannot deactivate their own account." };
  }

  if (status !== "active" && status !== "suspended") {
    return { success: false, error: "Status must be either 'active' or 'suspended'." };
  }

  try {
    const existing = await userService.getStaffById(normalizedId);
    if (!existing || existing.role !== "staff") {
      return { success: false, error: "Staff account not found." };
    }

    const updated = await userService.updateStaffStatus(normalizedId, status);
    if (!updated) {
      return { success: false, error: "Failed to update staff account status." };
    }

    revalidateStaffPaths(normalizedId);
    revalidatePath("/staff", "layout");
    return {
      success: true,
      data: updated,
      message:
        status === "suspended"
          ? "Staff account deactivated and all active sessions revoked."
          : "Staff account activated.",
    };
  } catch (err) {
    console.error("Failed to update staff status:", err);
    return { success: false, error: "Failed to update staff account status." };
  }
}

export async function deleteStaffAccountAction(
  staffId: string
): Promise<ActionResult<{ staffId: string }>> {
  const auth = await verifyAdminAuth();
  if ("error" in auth) return auth.error;

  if (!staffId?.trim()) {
    return { success: false, error: "Staff ID is required." };
  }

  const normalizedId = staffId.trim();
  if (auth.user.id === normalizedId) {
    return { success: false, error: "Administrators cannot delete their own account." };
  }

  try {
    const res = await userService.deleteStaffAccount(normalizedId);
    if (!res.success) {
      return { success: false, error: res.error || "Failed to delete staff account." };
    }

    revalidateStaffPaths(normalizedId);
    return { success: true, data: { staffId: normalizedId } };
  } catch (err) {
    console.error("Failed to delete staff account:", err);
    return { success: false, error: "Failed to delete staff account." };
  }
}
