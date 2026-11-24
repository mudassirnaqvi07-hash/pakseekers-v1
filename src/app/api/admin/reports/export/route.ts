import { NextResponse } from "next/server";
import { verifyApiAuth } from "@/server/auth/session";
import { generatePlatformCsvReport } from "@/server/services/reports-service";

export async function GET() {
  try {
    const auth = await verifyApiAuth({
      allowedRoles: ["admin"],
      requiredPermissions: "ANALYTICS_VIEW",
    });
    if ("response" in auth) {
      return auth.response;
    }

    const csvContent = await generatePlatformCsvReport();
    const timestamp = new Date().toISOString().split("T")[0];

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="pakseekers-platform-report-${timestamp}.csv"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Failed to generate CSV export:", error);
    return NextResponse.json(
      { error: "Export generation failed." },
      { status: 500 }
    );
  }
}
