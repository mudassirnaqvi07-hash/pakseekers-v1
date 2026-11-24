import "server-only";

/**
 * Device Identification & User-Agent Parsing — PakSeekers.
 *
 * Implements persistent, cookie-backed device identification and best-effort
 * device metadata extraction without external dependencies.
 *
 * Security:
 * - Device ID is cryptographically generated and stored in an HTTP-only, SameSite=Lax cookie.
 * - Does not use invasive fingerprinting or rely solely on mutable IP addresses.
 */

import { cookies, headers } from "next/headers";
import crypto from "crypto";
import type { DeviceType } from "@/types";

export const DEVICE_COOKIE_NAME = "pakseekers_device_id";

export interface ParsedDeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceType: DeviceType;
  browser: string;
  operatingSystem: string;
}

/**
 * Resolves or establishes a persistent device identifier stored in an HTTP-only cookie.
 */
export async function getOrCreateDeviceId(): Promise<string> {
  try {
    const cookieStore = await cookies();
    const existing = cookieStore.get(DEVICE_COOKIE_NAME)?.value;
    if (existing && /^dev_[a-zA-Z0-9_-]{16,64}$/.test(existing)) {
      return existing;
    }

    const newDeviceId = `dev_${crypto.randomUUID().replace(/-/g, "")}`;

    let isHttps = false;
    try {
      const headerStore = await headers();
      isHttps = headerStore.get("x-forwarded-proto") === "https";
    } catch {
      isHttps = false;
    }

    cookieStore.set(DEVICE_COOKIE_NAME, newDeviceId, {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      path: "/",
      maxAge: 365 * 24 * 60 * 60, // 1 year
    });

    return newDeviceId;
  } catch {
    // Non-request context fallback
    return `dev_${crypto.randomUUID().replace(/-/g, "")}`;
  }
}

/**
 * Parses user-agent header into clean, human-readable device metadata.
 */
export function parseUserAgent(userAgent?: string | null): {
  deviceName: string;
  deviceType: DeviceType;
  browser: string;
  operatingSystem: string;
} {
  const ua = (userAgent || "").trim();

  // 1. Operating System
  let operatingSystem = "Unknown OS";
  if (/iPhone|iPod/i.test(ua)) {
    operatingSystem = "iOS (iPhone)";
  } else if (/iPad/i.test(ua)) {
    operatingSystem = "iPadOS";
  } else if (/Android/i.test(ua)) {
    operatingSystem = "Android";
  } else if (/Windows NT 10.0/i.test(ua)) {
    operatingSystem = "Windows 11 / 10";
  } else if (/Windows NT/i.test(ua)) {
    operatingSystem = "Windows";
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    operatingSystem = "macOS";
  } else if (/Linux/i.test(ua)) {
    operatingSystem = "Linux";
  } else if (/CrOS/i.test(ua)) {
    operatingSystem = "Chrome OS";
  }

  // 2. Browser
  let browser = "Web Browser";
  if (/Edg\//i.test(ua)) {
    browser = "Microsoft Edge";
  } else if (/OPR\/|Opera/i.test(ua)) {
    browser = "Opera";
  } else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) {
    browser = "Chrome";
  } else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) {
    browser = "Safari";
  } else if (/Firefox\//i.test(ua)) {
    browser = "Firefox";
  }

  // 3. Device Type
  let deviceType: DeviceType = "desktop";
  if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) {
    deviceType = "tablet";
  } else if (/iPhone|iPod|Android.*Mobile|Mobile/i.test(ua)) {
    deviceType = "mobile";
  }

  const deviceName = `${operatingSystem} • ${browser}`;

  return {
    deviceName,
    deviceType,
    browser,
    operatingSystem,
  };
}

/**
 * Gathers complete device information for the current request.
 */
export async function resolveCurrentDeviceInfo(): Promise<ParsedDeviceInfo> {
  const deviceId = await getOrCreateDeviceId();

  let userAgent = "";
  try {
    const headerStore = await headers();
    userAgent = headerStore.get("user-agent") || "";
  } catch {
    userAgent = "";
  }

  const parsed = parseUserAgent(userAgent);

  return {
    deviceId,
    ...parsed,
  };
}
