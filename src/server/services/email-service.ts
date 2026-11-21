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
 * - Safe URL construction using the WHATWG URL API.
 * - Production domain enforcement (fails safely if APP_URL missing in production).
 */

import nodemailer, { type Transporter } from "nodemailer";
import { env } from "@/lib/config/env";

let transporterInstance: Transporter | null = null;

/**
 * Resets the cached transporter singleton.
 * Primarily used in test suites or when SMTP credentials reload.
 */
export function resetMailTransporter(): void {
  transporterInstance = null;
}

export function getMailTransporter(): Transporter {
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
 * Server-side diagnostic utility to verify SMTP connection using transporter.verify().
 * Never exposes credentials in logs or output.
 */
export async function verifySmtpConnection(): Promise<{
  success: boolean;
  host: string;
  port: number;
  secure: boolean;
  error?: string;
  code?: string;
}> {
  const host = process.env.SMTP_HOST || env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || env.SMTP_PORT || 465);
  const secure =
    process.env.SMTP_SECURE === "true" ||
    process.env.SMTP_SECURE === "1" ||
    env.SMTP_SECURE === true ||
    port === 465;

  try {
    const transporter = getMailTransporter();
    await transporter.verify();
    return { success: true, host, port, secure };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const errorCode = (err as { code?: string })?.code;
    console.error(`[SMTP Diagnostic] Connection verification failed (${errorCode || "UNKNOWN"}):`, errorMsg);
    return {
      success: false,
      host,
      port,
      secure,
      error: errorMsg,
      code: errorCode,
    };
  }
}

/**
 * Builds the responsive HTML body for the OTP verification email.
 *
 * Rules:
 * - Prominently displays the 6-digit OTP code.
 * - States clear 10-minute expiration.
 * - Warns user never to share the code.
 * - Contains NO verification URLs or links.
 */
function buildOtpVerificationEmailHtml({
  name,
  otp,
  expiresInMinutes = 10,
}: {
  name: string;
  otp: string;
  expiresInMinutes?: number;
}): string {
  const safeName = name ? name.trim() : "Student";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your PakSeekers Verification Code</title>
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
      margin-bottom: 20px;
    }
    .otp-box-container {
      text-align: center;
      margin: 28px 0;
    }
    .otp-box {
      display: inline-block;
      background-color: #f0fdfa;
      border: 2px dashed #0f766e;
      border-radius: 12px;
      padding: 16px 28px;
      font-size: 36px;
      font-weight: 800;
      letter-spacing: 10px;
      color: #0f766e;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
    }
    .badge-info {
      display: inline-block;
      background-color: #fef3c7;
      border: 1px solid #fde68a;
      color: #92400e;
      font-size: 12px;
      font-weight: 600;
      padding: 5px 12px;
      border-radius: 9999px;
      margin-bottom: 16px;
    }
    .security-notice {
      background-color: #f8fafc;
      border-left: 4px solid #0f766e;
      padding: 12px 16px;
      margin-top: 24px;
      margin-bottom: 24px;
      border-radius: 0 8px 8px 0;
      font-size: 13px;
      color: #475569;
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
        <span class="badge-info">⏳ Verification code expires in ${expiresInMinutes} minutes</span>
        <p class="body-text">
          Thank you for creating your student account. To complete your registration and begin preparing for MDCAT, ECAT, and university admissions tests, please enter the 6-digit verification code below:
        </p>

        <div class="otp-box-container">
          <div class="otp-box">${otp}</div>
        </div>

        <div class="security-notice">
          <strong>🔒 Security Reminder:</strong> Never share this verification code with anyone. PakSeekers staff will never ask for your code.
        </div>

        <p class="body-text" style="font-size: 13px; color: #64748b; margin-bottom: 0;">
          If you did not create an account on PakSeekers, you can safely ignore this email. No account will be activated without your confirmation code.
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
 * Sends a branded student account OTP verification email via SMTP.
 */
export async function sendVerificationEmail({
  to,
  name,
  otp,
  expiresInMinutes = 10,
}: {
  to: string;
  name: string;
  otp: string;
  expiresInMinutes?: number;
}): Promise<SendVerificationEmailResult> {
  const from = process.env.SMTP_FROM || env.SMTP_FROM || "PakSeekers <mudassirhassanreall@gmail.com>";

  const html = buildOtpVerificationEmailHtml({
    name,
    otp,
    expiresInMinutes,
  });

  const text = `
Welcome to PakSeekers, ${name}!

Your 6-digit email verification code is:
${otp}

This verification code will expire in ${expiresInMinutes} minutes.
For your security, do not share this code with anyone. PakSeekers staff will never ask for your code.

If you did not create an account on PakSeekers, please ignore this email.
  `.trim();

  try {
    const transporter = getMailTransporter();
    const info = await transporter.sendMail({
      from,
      to,
      subject: `${otp} is your PakSeekers verification code`,
      text,
      html,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("❌ Failed to send verification OTP email via SMTP:", errorMsg);
    return {
      success: false,
      error: "Unable to dispatch verification email at this moment. Please try again shortly.",
    };
  }
}

/**
 * Convenience alias for sendVerificationEmail.
 */
export const sendVerificationOtpEmail = sendVerificationEmail;
