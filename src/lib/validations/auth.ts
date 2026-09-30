/**
 * Zod Validation Schemas for Authentication, Profile, and Test Attempts — PakSeekers Phase 4.
 */

import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Please enter a valid email.")
    .email("Please enter a valid email."),
  password: z.string().min(1, "Password is required."),
  callbackUrl: z.string().optional(),
});

export const studentRegisterSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters.")
      .max(100, "Full name must be under 100 characters."),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, "Please enter a valid email.")
      .email("Please enter a valid email."),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters.")
      .max(100, "Password must be under 100 characters."),
    confirmPassword: z
      .string()
      .min(1, "Please confirm your password."),
    educationLevel: z
      .string()
      .optional()
      .default("FSc Pre-Medical"),
    institution: z
      .string()
      .optional()
      .transform((val) => (val && val.trim().length > 0 ? val.trim() : "Not specified")),
    targetExam: z
      .string()
      .optional()
      .default("MDCAT"),
    phone: z.string().optional(),
    callbackUrl: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const studentProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters.")
    .max(100, "Full name must be under 100 characters."),
  educationLevel: z
    .string()
    .min(1, "Please select your education level."),
  institution: z
    .string()
    .min(2, "Institution/College must be at least 2 characters.")
    .max(150, "Institution must be under 150 characters."),
  targetExam: z
    .string()
    .min(1, "Please select your target entry exam."),
  phone: z.string().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type StudentRegisterFormData = z.infer<typeof studentRegisterSchema>;
export type StudentProfileFormData = z.infer<typeof studentProfileSchema>;
