import { NextRequest, NextResponse } from "next/server";
import { verifyStudentOtp } from "@/server/services/auth-service";

/**
 * Server-side Email Verification Endpoint.
 *
 * GET /api/auth/verify-email
 * Redirects legacy links safely to the 6-digit OTP verification page.
 *
 * POST /api/auth/verify-email
 * Verifies student email with a 6-digit OTP payload.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  const targetUrl = new URL("/verify-email", request.url);
  if (email) {
    targetUrl.searchParams.set("email", email);
  }

  return NextResponse.redirect(targetUrl);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp } = body || {};

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: "Email and 6-digit verification code are required." },
        { status: 400 }
      );
    }

    const result = await verifyStudentOtp(email, otp);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err) {
    console.error("API verify-email error:", err);
    return NextResponse.json(
      { success: false, error: "Invalid request payload." },
      { status: 400 }
    );
  }
}
