import "server-only";

/**
 * Email Delivery Application Service — PakSeekers.
 *
 * Configures Nodemailer with Gmail SMTP to deliver branded, responsive
 * verification emails and account notifications.
 *
 * Security:
 * - Credentials loaded exclusively from server environment variables.
 * - Transport connection verification and error isolation.
 * - Zero client-side leakage (server-only).
 */

import nodemailer, { type Transporter } from "nodemailer";
import { env } from "@/lib/config/env";

let transporterInstance: Transporter | null = null;

function getMailTransporter(): Transporter {
  if (transporterInstance) {
    return transporterInstance;
  }

  const host = process.env.SMTP_HOST || env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || env.SMTP_PORT || 465);
  const secure =
    process.env.SMTP_SECURE === "true" ||
    process.env.SMTP_SECURE === "1" ||
    env.SMTP_SECURE === true ||
    port === 465;

  const user = process.env.SMTP_USER || env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD || env.SMTP_PASSWORD;

  if (!user || !pass) {
    console.warn("⚠️ SMTP credentials (SMTP_USER / SMTP_PASSWORD) are not fully configured.");
  }

  transporterInstance = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: user || "",
      pass: pass ? pass.replace(/\s+/g, "") : "", // Gmail app passwords may contain spaces
    },
    // Connection timeout safety
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  return transporterInstance;
}

/**
 * Builds the responsive HTML body for the verification email.
 */
function buildVerificationEmailHtml({
  name,
  verificationUrl,
  expiresInMinutes,
}: {
  name: string;
  verificationUrl: string;
  expiresInMinutes: number;
}): string {
  const safeName = name ? name.trim() : "Student";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your PakSeekers Account</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #1e293b;
      line-height: 1.6;
    }
    .wrapper {
      width: 100%;
      background-color: #f8fafc;
      padding: 40px 16px;
      box-sizing: border-box;
    }
    .container {
      max-width: 560px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
      padding: 32px 24px;
      text-align: center;
      color: #ffffff;
    }
    .brand-title {
      margin: 0;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .brand-subtitle {
      margin: 6px 0 0 0;
      font-size: 13px;
      opacity: 0.9;
      font-weight: 500;
    }
    .content {
      padding: 36px 32px 28px 32px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 16px;
    }
    .body-text {
      font-size: 15px;
      color: #334155;
      margin-bottom: 24px;
    }
    .btn-container {
      text-align: center;
      margin: 32px 0;
    }
    .btn {
      display: inline-block;
      background-color: #0f766e;
      color: #ffffff !important;
      font-size: 15px;
      font-weight: 700;
      text-decoration: none;
      padding: 14px 36px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(15, 118, 110, 0.25);
    }
    .btn:hover {
      background-color: #115e59;
    }
    .link-fallback {
      background-color: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px;
      font-size: 12px;
      color: #475569;
      word-break: break-all;
      margin-bottom: 24px;
    }
    .badge-info {
      display: inline-block;
      background-color: #fef3c7;
      border: 1px solid #fde68a;
      color: #92400e;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 9999px;
      margin-bottom: 16px;
    }
    .footer {
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 24px 32px;
      font-size: 12px;
      color: #64748b;
      text-align: center;
    }
    .footer p {
      margin: 4px 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1 class="brand-title">PakSeekers</h1>
        <p class="brand-subtitle">Pakistan University Entrance Test Preparation</p>
      </div>
      <div class="content">
        <h2 class="greeting">Welcome to PakSeekers, ${safeName}!</h2>
        <span class="badge-info">⏳ Verification link expires in ${expiresInMinutes} minutes</span>
        <p class="body-text">
          Thank you for creating your student account. To protect your profile and begin practicing for MDCAT, ECAT, and university admissions tests, please verify your email address.
        </p>

        <div class="btn-container">
          <a href="${verificationUrl}" target="_blank" class="btn">Verify Email Address</a>
        </div>

        <p class="body-text" style="font-size: 13px; color: #64748b; margin-bottom: 8px;">
          If the button above does not work, copy and paste this link into your web browser:
        </p>
        <div class="link-fallback">
          <a href="${verificationUrl}" style="color: #0f766e; text-decoration: underline;">${verificationUrl}</a>
        </div>

        <p class="body-text" style="font-size: 13px; color: #64748b; margin-bottom: 0;">
          If you did not register for an account on PakSeekers, you can safely ignore this email. No account will be activated without your confirmation.
        </p>
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} PakSeekers. All rights reserved.</p>
        <p>This is an automated system notification. Please do not reply directly to this email.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export interface SendVerificationEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Sends a branded student account verification email via SMTP.
 */
export async function sendVerificationEmail({
  to,
  name,
  token,
  expiresInMinutes = 30,
}: {
  to: string;
  name: string;
  token: string;
  expiresInMinutes?: number;
}): Promise<SendVerificationEmailResult> {
  const from = process.env.SMTP_FROM || env.SMTP_FROM || "PakSeekers <mudassirhassanreall@gmail.com>";
  const baseUrl = (process.env.APP_URL || env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");
  const verificationUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;

  const html = buildVerificationEmailHtml({
    name,
    verificationUrl,
    expiresInMinutes,
  });

  const text = `
Welcome to PakSeekers, ${name}!

Please verify your student email address to activate your account.
This link will expire in ${expiresInMinutes} minutes.

Verify Email Address:
${verificationUrl}

If you did not create an account on PakSeekers, please ignore this email.
  `.trim();

  try {
    const transporter = getMailTransporter();
    const info = await transporter.sendMail({
      from,
      to,
      subject: "Verify Your PakSeekers Account",
      text,
      html,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("❌ Failed to send verification email via SMTP:", errorMsg);
    return {
      success: false,
      error: "Unable to dispatch verification email at this moment. Please try again shortly.",
    };
  }
}
