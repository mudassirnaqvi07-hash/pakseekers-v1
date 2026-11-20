import { NextRequest, NextResponse } from "next/server";
import { verifyEmailToken } from "@/server/services/auth-service";

/**
 * Server-side Email Verification Endpoint.
 *
 * GET /api/auth/verify-email?token=<token>
 *
 * Atomically verifies the token against MongoDB, sets isEmailVerified = true,
 * invalidates the token, and redirects to the user-facing verification status page.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token || typeof token !== "string" || token.trim().length < 16) {
    return NextResponse.redirect(
      new URL("/verify-email?status=error&reason=invalid", request.url)
    );
  }

  const result = await verifyEmailToken(token.trim());

  if (!result.success) {
    const reason = result.reason === "expired" ? "expired" : "invalid";
    return NextResponse.redirect(
      new URL(`/verify-email?status=error&reason=${reason}`, request.url)
    );
  }

  return NextResponse.redirect(
    new URL("/verify-email?status=success", request.url)
  );
}
