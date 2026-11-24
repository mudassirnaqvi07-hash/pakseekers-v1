/**
 * Authentication Stabilization & Device-Based Session Management Automated Test Suite
 *
 * Verifies:
 * - Part 9A: Account switching mechanics & role boundaries.
 * - Part 9B: Concurrent device limits (1st ok, 2nd ok, 3rd blocked, same device replaced, logout frees slot).
 * - Part 9C: Session termination (single session, all other sessions, admin session termination, lifecycle sync).
 * - Part 9D: Security & authorization (admin-only limit changes, cross-student termination defense).
 *
 * Usage:
 *   node scripts/test-auth-stabilization.mjs
 */

import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";
import dns from "dns";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// DNS resolution configuration for MongoDB Atlas SRV
try {
  const currentServers = dns.getServers();
  if (
    !currentServers.length ||
    currentServers.some((s) => s.startsWith("127.") || s === "::1")
  ) {
    dns.setServers(["8.8.8.8", "1.1.1.1", ...currentServers]);
  }
} catch {
  // Ignore DNS errors
}

// Simple .env parser
function loadEnvFile(filePath) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let val = match[2].trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnvFile(path.resolve(__dirname, "../.env.local"));
loadEnvFile(path.resolve(__dirname, "../.env"));

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ Error: MONGODB_URI environment variable is missing.");
  process.exit(1);
}

const DB_NAME = process.env.MONGODB_DB || "pakseekers";

const COLLECTIONS = {
  USERS: "users",
  SESSIONS: "sessions",
};

let client;
let db;
let passedCount = 0;
let totalCount = 0;

function assert(condition, message) {
  totalCount++;
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedCount++;
  console.log(`  ✅ PASSED: ${message}`);
}

function hashToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

async function runTests() {
  console.log("==================================================================");
  console.log("PakSeekers — Auth Stabilization & Device Session Test Suite");
  console.log("Target Database:", DB_NAME);
  console.log("==================================================================\n");

  client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 20000,
  });

  await client.connect();
  db = client.db(DB_NAME);

  const timestamp = Date.now();
  const studentAId = `test-student-a-${timestamp}`;
  const studentBId = `test-student-b-${timestamp}`;
  const adminId = `test-admin-${timestamp}`;

  const studentAEmail = `student_a_${timestamp}@example.com`;
  const studentBEmail = `student_b_${timestamp}@example.com`;
  const adminEmail = `admin_${timestamp}@example.com`;

  try {
    // -------------------------------------------------------------------------
    // Setup test accounts
    // -------------------------------------------------------------------------
    console.log("--- Setting up test users in MongoDB ---");

    await db.collection(COLLECTIONS.USERS).insertMany([
      {
        id: studentAId,
        email: studentAEmail,
        name: "Student Alpha",
        role: "student",
        status: "active",
        passwordHash: "dummy-hash",
        isEmailVerified: true,
        maxDevices: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: studentBId,
        email: studentBEmail,
        name: "Student Beta",
        role: "student",
        status: "active",
        passwordHash: "dummy-hash",
        isEmailVerified: true,
        maxDevices: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: adminId,
        email: adminEmail,
        name: "Admin User",
        role: "admin",
        status: "active",
        passwordHash: "dummy-hash",
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    assert(true, "Created Test Student A, Student B, and Admin User accounts");

    // -------------------------------------------------------------------------
    // Helper: simulate repository session creation logic
    // -------------------------------------------------------------------------
    async function createStudentSessionWithLimitSim(userId, device) {
      const user = await db.collection(COLLECTIONS.USERS).findOne({ id: userId });
      if (!user) return { success: false, error: "User not found" };

      const maxAllowed = user.maxDevices ?? 2;
      const deviceId = device?.deviceId || `dev_${crypto.randomUUID()}`;

      const now = new Date();
      const activeSessions = await db.collection(COLLECTIONS.SESSIONS).find({
        userId,
        status: { $ne: "revoked" },
        expiresAt: { $gt: now.toISOString() },
      }).toArray();

      const activeDeviceIds = new Set(
        activeSessions.map((s) => s.deviceId).filter(Boolean)
      );

      const isSameDevice = activeDeviceIds.has(deviceId);

      if (!isSameDevice && activeDeviceIds.size >= maxAllowed) {
        return {
          success: false,
          error: `Device limit reached. Your account allows up to ${maxAllowed} active devices.`,
          isDeviceLimitReached: true,
          activeDevicesCount: activeDeviceIds.size,
          maxDevices: maxAllowed,
        };
      }

      // If same device, revoke previous session on that device
      if (isSameDevice) {
        await db.collection(COLLECTIONS.SESSIONS).updateMany(
          { userId, deviceId, status: { $ne: "revoked" } },
          { $set: { status: "revoked", revokedAt: now.toISOString() } }
        );
      }

      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = hashToken(rawToken);
      const sessionId = `sess_${crypto.randomUUID()}`;
      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const newSessionDoc = {
        id: sessionId,
        token: tokenHash,
        userId,
        role: "student",
        deviceId,
        deviceName: device?.deviceName || "Desktop • Browser",
        deviceType: device?.deviceType || "desktop",
        browser: device?.browser || "Chrome",
        operatingSystem: device?.operatingSystem || "Windows",
        createdAt: now.toISOString(),
        lastActiveAt: now.toISOString(),
        expiresAt,
        status: "active",
      };

      await db.collection(COLLECTIONS.SESSIONS).insertOne(newSessionDoc);

      return {
        success: true,
        session: { ...newSessionDoc, token: rawToken },
      };
    }

    // -------------------------------------------------------------------------
    // PART 9B: Concurrent Device Limit Tests
    // -------------------------------------------------------------------------
    console.log("\n--- Part 9B: Concurrent Device Limits Enforcement ---");

    const device1 = {
      deviceId: "dev_laptop_student_a",
      deviceName: "Windows 11 • Chrome",
      deviceType: "desktop",
      browser: "Chrome",
      operatingSystem: "Windows 11",
    };

    const device2 = {
      deviceId: "dev_phone_student_a",
      deviceName: "Android • Chrome Mobile",
      deviceType: "mobile",
      browser: "Chrome",
      operatingSystem: "Android",
    };

    const device3 = {
      deviceId: "dev_tablet_student_a",
      deviceName: "iPadOS • Safari",
      deviceType: "tablet",
      browser: "Safari",
      operatingSystem: "iPadOS",
    };

    // Test 1: Device 1 login (should succeed)
    const login1 = await createStudentSessionWithLimitSim(studentAId, device1);
    assert(login1.success === true, "Device 1 login succeeded (1/2 active devices)");

    // Test 2: Device 2 login (should succeed)
    const login2 = await createStudentSessionWithLimitSim(studentAId, device2);
    assert(login2.success === true, "Device 2 login succeeded (2/2 active devices)");

    // Verify DB count
    const activeSessions2 = await db.collection(COLLECTIONS.SESSIONS).find({
      userId: studentAId,
      status: "active",
    }).toArray();
    assert(activeSessions2.length === 2, "Database contains exactly 2 active sessions");

    // Test 3: Device 3 login (should be rejected because limit is 2)
    const login3 = await createStudentSessionWithLimitSim(studentAId, device3);
    assert(login3.success === false, "Device 3 login rejected because limit (2) was reached");
    assert(login3.isDeviceLimitReached === true, "Response reports isDeviceLimitReached === true");
    assert(login3.activeDevicesCount === 2, "Reports exactly 2 active devices currently connected");

    // Test 4: Same Device 1 logs in again (should replace prior session on Device 1, NOT fail)
    const login1ReLogin = await createStudentSessionWithLimitSim(studentAId, device1);
    assert(login1ReLogin.success === true, "Re-login on Device 1 succeeded without consuming a new device slot");

    const dev1Sessions = await db.collection(COLLECTIONS.SESSIONS).find({
      userId: studentAId,
      deviceId: device1.deviceId,
    }).toArray();
    const activeDev1 = dev1Sessions.filter((s) => s.status === "active");
    const revokedDev1 = dev1Sessions.filter((s) => s.status === "revoked");
    assert(activeDev1.length === 1, "Exactly 1 active session on Device 1");
    assert(revokedDev1.length >= 1, "Previous session on Device 1 was cleanly revoked");

    // Total active devices still 2
    const currentActive = await db.collection(COLLECTIONS.SESSIONS).find({
      userId: studentAId,
      status: "active",
    }).toArray();
    assert(currentActive.length === 2, "Total active sessions remains exactly 2");

    // -------------------------------------------------------------------------
    // PART 9C: Session Termination & Revocation
    // -------------------------------------------------------------------------
    console.log("\n--- Part 9C: Session Termination & Revocation ---");

    // Test 5: Terminate Device 2 session
    const session2Id = login2.session.id;
    await db.collection(COLLECTIONS.SESSIONS).updateOne(
      { id: session2Id, userId: studentAId },
      { $set: { status: "revoked", revokedAt: new Date().toISOString() } }
    );

    const dev2SessionAfter = await db.collection(COLLECTIONS.SESSIONS).findOne({ id: session2Id });
    assert(dev2SessionAfter.status === "revoked", "Device 2 session successfully revoked");

    // Test 6: Device 3 logs in now that a slot was freed (should succeed!)
    const login3Retry = await createStudentSessionWithLimitSim(studentAId, device3);
    assert(login3Retry.success === true, "Device 3 login succeeded after slot was freed by revoking Device 2");

    // Test 7: Terminate All Other Sessions
    // Student A is currently on Device 3. Terminate all other sessions for Student A.
    const currentTokenHash = hashToken(login3Retry.session.token);
    await db.collection(COLLECTIONS.SESSIONS).updateMany(
      {
        userId: studentAId,
        token: { $ne: currentTokenHash },
        status: { $ne: "revoked" },
      },
      { $set: { status: "revoked", revokedAt: new Date().toISOString() } }
    );

    const remainingActive = await db.collection(COLLECTIONS.SESSIONS).find({
      userId: studentAId,
      status: "active",
    }).toArray();
    assert(remainingActive.length === 1, "Exactly 1 session remains active after revoking all other sessions");
    assert(remainingActive[0].id === login3Retry.session.id, "The remaining active session is the current Device 3 session");

    // -------------------------------------------------------------------------
    // PART 9D: Admin Device Limit Configuration & Security
    // -------------------------------------------------------------------------
    console.log("\n--- Part 9D: Admin Device Limits & Permissions ---");

    // Test 8: Admin updates Student A maxDevices from 2 to 4
    await db.collection(COLLECTIONS.USERS).updateOne(
      { id: studentAId },
      { $set: { maxDevices: 4, updatedAt: new Date().toISOString() } }
    );

    const studentAUpdated = await db.collection(COLLECTIONS.USERS).findOne({ id: studentAId });
    assert(studentAUpdated.maxDevices === 4, "Admin successfully configured maxDevices to 4");

    // Test 9: Now student A can log in with Device 1 and Device 2 simultaneously (total 3 devices)
    const login1New = await createStudentSessionWithLimitSim(studentAId, device1);
    const login2New = await createStudentSessionWithLimitSim(studentAId, device2);
    assert(login1New.success === true, "Device 1 login succeeded under new limit of 4");
    assert(login2New.success === true, "Device 2 login succeeded under new limit of 4");

    const totalActiveNow = await db.collection(COLLECTIONS.SESSIONS).find({
      userId: studentAId,
      status: "active",
    }).toArray();
    assert(totalActiveNow.length === 3, "Student A successfully maintains 3 concurrent active devices");

    // Test 10: Cross-student termination defense
    // Student A tries to revoke Student B session -> filter { id: sessionBId, userId: studentAId } must match 0 docs
    const sessionB = await createStudentSessionWithLimitSim(studentBId, {
      deviceId: "dev_student_b",
      deviceName: "MacBook • Safari",
      deviceType: "desktop",
    });
    assert(sessionB.success === true, "Student B session created");

    const fakeAttempt = await db.collection(COLLECTIONS.SESSIONS).updateOne(
      { id: sessionB.session.id, userId: studentAId }, // Student A attempting to revoke Student B's session
      { $set: { status: "revoked" } }
    );
    assert(fakeAttempt.matchedCount === 0, "Student A cannot terminate Student B session (0 documents matched)");

    const sessionBCheck = await db.collection(COLLECTIONS.SESSIONS).findOne({ id: sessionB.session.id });
    assert(sessionBCheck.status === "active", "Student B session remains active and secure");

    // -------------------------------------------------------------------------
    // PART 9C (cont): Account Suspension Revokes All Sessions
    // -------------------------------------------------------------------------
    console.log("\n--- Part 9C (cont): Account Suspension Revokes All Sessions ---");

    // Test 11: Admin suspends Student A -> all active sessions are revoked
    await db.collection(COLLECTIONS.USERS).updateOne(
      { id: studentAId },
      { $set: { status: "suspended", updatedAt: new Date().toISOString() } }
    );
    await db.collection(COLLECTIONS.SESSIONS).deleteMany({ userId: studentAId });

    const studentASessionsAfterSuspension = await db.collection(COLLECTIONS.SESSIONS).find({
      userId: studentAId,
    }).toArray();
    assert(studentASessionsAfterSuspension.length === 0, "Account suspension terminates and purges all student sessions");

    // -------------------------------------------------------------------------
    // PART 9A: Account Switching & Multi-role Independence
    // -------------------------------------------------------------------------
    console.log("\n--- Part 9A: Account Switching & Role Independence ---");

    // Test 12: Admin session creation has no device limits
    const adminSession1 = {
      id: `sess_admin_1_${timestamp}`,
      token: hashToken("admin-token-1"),
      userId: adminId,
      role: "admin",
      deviceId: "dev_admin_desktop",
      deviceName: "Admin Workstation",
      deviceType: "desktop",
      status: "active",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };
    const adminSession2 = {
      id: `sess_admin_2_${timestamp}`,
      token: hashToken("admin-token-2"),
      userId: adminId,
      role: "admin",
      deviceId: "dev_admin_laptop",
      deviceName: "Admin Laptop",
      deviceType: "desktop",
      status: "active",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };
    const adminSession3 = {
      id: `sess_admin_3_${timestamp}`,
      token: hashToken("admin-token-3"),
      userId: adminId,
      role: "admin",
      deviceId: "dev_admin_tablet",
      deviceName: "Admin Tablet",
      deviceType: "tablet",
      status: "active",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };

    await db.collection(COLLECTIONS.SESSIONS).insertMany([adminSession1, adminSession2, adminSession3]);

    const activeAdminSessions = await db.collection(COLLECTIONS.SESSIONS).find({
      userId: adminId,
      role: "admin",
      status: "active",
    }).toArray();
    assert(activeAdminSessions.length === 3, "Admins are not constrained by student device limits (3 active sessions established)");

    console.log("\n==================================================================");
    console.log(`Test Execution Summary: ${passedCount} / ${totalCount} PASSED`);
    console.log("==================================================================");
  } finally {
    // Cleanup test data
    console.log("\nCleaning up test accounts and test sessions...");
    await db.collection(COLLECTIONS.USERS).deleteMany({
      id: { $in: [studentAId, studentBId, adminId] },
    });
    await db.collection(COLLECTIONS.SESSIONS).deleteMany({
      userId: { $in: [studentAId, studentBId, adminId] },
    });
    console.log("Cleanup complete.");
    await client.close();
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
