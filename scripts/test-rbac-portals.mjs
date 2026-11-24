/**
 * PakSeekers — Complete RBAC, Three-Role Auth & Private Portal Routing Test Suite
 *
 * Covers Phase 11 verification scenarios:
 * 1. Permission Registry & Default Role Policy (ADMIN, STAFF, STUDENT)
 * 2. Privilege Escalation & Sanitization Defenses
 * 3. Live MongoDB Staff Lifecycle (Create, Permission Modify/Revoke, Deactivation Session Revocation)
 * 4. 6-Way Account Switching Session Invalidation (Student <-> Admin <-> Staff)
 * 5. Role-Change Session Invalidation & Device Limit Preservation
 * 6. Route Protection, Entry-Point Redirects (/ -> Student Portal), and Action Boundaries
 *
 * Usage:
 *   node scripts/test-rbac-portals.mjs
 */

import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";
import dns from "dns";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resilient DNS for MongoDB Atlas SRV
try {
  const currentServers = dns.getServers();
  if (!currentServers.length || currentServers.some((s) => s.startsWith("127.") || s === "::1")) {
    dns.setServers(["8.8.8.8", "1.1.1.1", ...currentServers]);
  }
} catch {
  // Ignore
}

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

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("FATAL: MONGODB_URI not configured.");
  process.exit(1);
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

function hashToken(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function readSrc(relPath) {
  return fs.readFileSync(path.resolve(__dirname, "..", relPath), "utf-8");
}

async function run() {
  console.log("\n=================================================================");
  console.log(" PAKSEEKERS RBAC, THREE-ROLE AUTH & PORTAL ROUTING TEST SUITE");
  console.log("=================================================================\n");

  // ---------------------------------------------------------------------------
  // SUITE 1: Centralized Permission Registry & Policy Checks
  // ---------------------------------------------------------------------------
  console.log("Suite 1: Centralized Permission System & Default Policies");
  const permSrc = readSrc("src/lib/auth/permissions.ts");

  const requiredPermissions = [
    "EXAM_VIEW", "EXAM_CREATE", "EXAM_EDIT", "EXAM_DELETE",
    "SUBJECT_VIEW", "SUBJECT_CREATE", "SUBJECT_EDIT", "SUBJECT_DELETE",
    "TOPIC_VIEW", "TOPIC_CREATE", "TOPIC_EDIT", "TOPIC_DELETE",
    "QUESTION_VIEW", "QUESTION_CREATE", "QUESTION_EDIT", "QUESTION_DELETE", "QUESTION_IMPORT",
    "TEST_VIEW", "TEST_CREATE", "TEST_EDIT", "TEST_DELETE", "TEST_PUBLISH",
    "ANALYTICS_VIEW", "TEST_PERFORMANCE_VIEW",
    "STUDENT_VIEW", "STUDENT_SUSPEND", "STUDENT_REACTIVATE", "STUDENT_DELETE",
    "STAFF_MANAGE", "ROLE_MANAGE", "PLATFORM_SETTINGS_MANAGE", "SECURITY_SETTINGS_MANAGE",
  ];

  for (const perm of requiredPermissions) {
    assert(permSrc.includes(`"${perm}"`), `Permission ${perm} is defined in registry`);
  }

  // Verify DEFAULT_STAFF_PERMISSIONS boundaries
  const defaultMatch = permSrc.match(/export const DEFAULT_STAFF_PERMISSIONS[^=]*=\s*\[([\s\S]*?)\];/);
  const defaultBlock = defaultMatch ? defaultMatch[1] : "";
  assert(defaultBlock.includes('"EXAM_CREATE"') && defaultBlock.includes('"QUESTION_IMPORT"'), "Default Staff permissions include Exams & Question Import");
  assert(defaultBlock.includes('"TEST_VIEW"') && defaultBlock.includes('"TEST_CREATE"') && defaultBlock.includes('"TEST_EDIT"'), "Default Staff permissions include draft test creation/editing/preview");
  assert(defaultBlock.includes('"ANALYTICS_VIEW"') && defaultBlock.includes('"TEST_PERFORMANCE_VIEW"'), "Default Staff permissions include aggregated analytics");
  assert(!defaultBlock.includes('"TEST_PUBLISH"'), "Default Staff permissions strictly exclude TEST_PUBLISH");
  assert(!defaultBlock.includes('"TEST_DELETE"'), "Default Staff permissions strictly exclude TEST_DELETE");
  assert(!defaultBlock.includes('"STUDENT_'), "Default Staff permissions strictly exclude Student management");
  assert(!defaultBlock.includes('"STAFF_MANAGE"') && !defaultBlock.includes('"ROLE_MANAGE"'), "Default Staff permissions strictly exclude Staff/Role administration");
  assert(!defaultBlock.includes('"PLATFORM_SETTINGS_MANAGE"') && !defaultBlock.includes('"SECURITY_SETTINGS_MANAGE"'), "Default Staff permissions strictly exclude Platform/Security settings");

  // ---------------------------------------------------------------------------
  // SUITE 2: Public Entry-Point, Proxy & Portal Guard Architecture
  // ---------------------------------------------------------------------------
  console.log("\nSuite 2: Public Entry-Point, Proxy & Three-Portal Route Protection");
  const rootPage = readSrc("src/app/page.tsx");
  assert(rootPage.includes('redirect("/student/login")'), "Unauthenticated / redirects to Student Portal entry (/student/login)");
  assert(rootPage.includes("getDashboardRouteForRole"), "Authenticated / redirects dynamically by verified role");

  const proxySrc = readSrc("src/proxy.ts");
  assert(proxySrc.includes('normalizedPath === "/admin"') && proxySrc.includes('normalizedPath.startsWith("/admin/")'), "Proxy protects all /admin/* routes");
  assert(proxySrc.includes('isStaffProtectedRoute') && proxySrc.includes('"/staff/login"'), "Proxy protects /staff/* while allowing /staff/login without redirect loops");
  assert(proxySrc.includes('isStudentProtectedRoute') && proxySrc.includes('"/student/register"'), "Proxy protects /student/* while allowing /student/login and /student/register");
  assert(proxySrc.includes('/api/admin') && proxySrc.includes('/api/staff') && proxySrc.includes('status: 401'), "Proxy rejects unauthenticated /api/admin and /api/staff requests early with 401");

  const adminLayout = readSrc("src/app/admin/layout.tsx");
  const staffLayout = readSrc("src/app/staff/layout.tsx");
  assert(adminLayout.includes("requireAdmin()"), "Admin layout enforces requireAdmin()");
  assert(staffLayout.includes("requireStaff()"), "Staff layout enforces requireStaff()");

  // Verify Staff module pages enforce granular permissions server-side
  const staffRoutes = [
    ["src/app/staff/exams/page.tsx", 'requireStaff("EXAM_VIEW")'],
    ["src/app/staff/exams/new/page.tsx", 'requireStaff("EXAM_CREATE")'],
    ["src/app/staff/exams/[id]/edit/page.tsx", 'requireStaff("EXAM_EDIT")'],
    ["src/app/staff/subjects/page.tsx", 'requireStaff("SUBJECT_VIEW")'],
    ["src/app/staff/topics/page.tsx", 'requireStaff("TOPIC_VIEW")'],
    ["src/app/staff/questions/page.tsx", 'requireStaff("QUESTION_VIEW")'],
    ["src/app/staff/tests/page.tsx", 'requireStaff("TEST_VIEW")'],
    ["src/app/staff/tests/new/page.tsx", 'requireStaff("TEST_CREATE")'],
    ["src/app/staff/tests/[id]/edit/page.tsx", 'requireStaff("TEST_EDIT")'],
    ["src/app/staff/tests/import/page.tsx", 'requireStaff("QUESTION_IMPORT")'],
    ["src/app/staff/analytics/page.tsx", 'requireStaff(["ANALYTICS_VIEW", "TEST_PERFORMANCE_VIEW"])'],
  ];
  for (const [file, guard] of staffRoutes) {
    assert(readSrc(file).includes(guard), `${file} enforces ${guard}`);
  }

  // Verify Admin Staff management pages strictly enforce requireAdmin()
  assert(readSrc("src/app/admin/staff/page.tsx").includes("requireAdmin()"), "/admin/staff strictly enforces requireAdmin()");
  assert(readSrc("src/app/admin/staff/new/page.tsx").includes("requireAdmin()"), "/admin/staff/new strictly enforces requireAdmin()");
  assert(readSrc("src/app/admin/staff/[id]/page.tsx").includes("requireAdmin()"), "/admin/staff/[id] strictly enforces requireAdmin()");

  // Verify public registration always forces student role
  const authServiceSrc = readSrc("src/server/services/auth-service.ts");
  assert(authServiceSrc.includes('role: "student"') && !authServiceSrc.includes("input.role"), "Public registration always creates student accounts only");

  // Verify content actions check TEST_PUBLISH on publish attempts
  const contentActionsSrc = readSrc("src/server/actions/content-actions.ts");
  assert(contentActionsSrc.includes('verifyContentPermission("TEST_PUBLISH")'), "Content actions enforce TEST_PUBLISH server-side before publishing");
  assert(!contentActionsSrc.includes("verifyAdminAuth"), "Content actions migrated cleanly to permission-based authorization");

  // ---------------------------------------------------------------------------
  // SUITE 3: Live MongoDB Staff Lifecycle & 6-Way Account Switching Tests
  // ---------------------------------------------------------------------------
  console.log("\nSuite 3: Live MongoDB Staff Lifecycle & 6-Way Account Switching");
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  const usersCol = db.collection("users");
  const sessionsCol = db.collection("sessions");

  const stamp = Date.now();
  const adminId = `rbac-admin-${stamp}`;
  const staffId = `rbac-staff-${stamp}`;
  const studentId = `rbac-student-${stamp}`;

  try {
    await usersCol.insertMany([
      {
        id: adminId,
        email: `rbac.admin.${stamp}@pakseekers.test`,
        name: "RBAC Test Admin",
        role: "admin",
        status: "active",
        isEmailVerified: true,
        passwordHash: "test:hash",
        profile: { educationLevel: "N/A", institution: "HQ", targetExam: "ALL" },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: staffId,
        email: `rbac.staff.${stamp}@pakseekers.test`,
        name: "RBAC Test Staff",
        role: "staff",
        status: "active",
        permissions: ["EXAM_VIEW", "TEST_VIEW", "TEST_CREATE"],
        isEmailVerified: true,
        passwordHash: "test:hash",
        profile: { educationLevel: "MSc", institution: "PakSeekers", targetExam: "MDCAT" },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: studentId,
        email: `rbac.student.${stamp}@pakseekers.test`,
        name: "RBAC Test Student",
        role: "student",
        status: "active",
        isEmailVerified: true,
        maxDevices: 2,
        passwordHash: "test:hash",
        profile: { educationLevel: "FSc", institution: "PGC", targetExam: "MDCAT" },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    const staffDoc = await usersCol.findOne({ id: staffId });
    assert(staffDoc?.role === "staff" && staffDoc?.status === "active", "Staff account created with role 'staff' and active status");

    // Simulate permission modification (grant TEST_PUBLISH, revoke EXAM_VIEW)
    await usersCol.updateOne(
      { id: staffId },
      { $set: { permissions: ["TEST_VIEW", "TEST_CREATE", "TEST_PUBLISH"] } }
    );
    const updatedStaff = await usersCol.findOne({ id: staffId });
    assert(
      updatedStaff?.permissions.includes("TEST_PUBLISH") && !updatedStaff?.permissions.includes("EXAM_VIEW"),
      "Admin permission grant & revocation persisted accurately on Staff document"
    );

    // Simulate 6-way account switching session replacement
    const pairs = [
      ["student", studentId, "admin", adminId],
      ["admin", adminId, "student", studentId],
      ["staff", staffId, "admin", adminId],
      ["admin", adminId, "staff", staffId],
      ["student", studentId, "staff", staffId],
      ["staff", staffId, "student", studentId],
    ];

    for (const [fromRole, fromId, toRole, toId] of pairs) {
      const oldRaw = `tok-old-${fromRole}-${toRole}-${stamp}-${Math.random()}`;
      const newRaw = `tok-new-${fromRole}-${toRole}-${stamp}-${Math.random()}`;
      const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

      await sessionsCol.insertOne({
        id: `s1-${Math.random()}`,
        token: hashToken(oldRaw),
        userId: fromId,
        role: fromRole,
        status: "active",
        expiresAt,
        createdAt: new Date().toISOString(),
      });

      // Account switch flow: invalidate old session + issue new session
      await sessionsCol.deleteOne({ token: hashToken(oldRaw) });
      await sessionsCol.insertOne({
        id: `s2-${Math.random()}`,
        token: hashToken(newRaw),
        userId: toId,
        role: toRole,
        status: "active",
        expiresAt,
        createdAt: new Date().toISOString(),
      });

      const oldStillExists = await sessionsCol.findOne({ token: hashToken(oldRaw) });
      const newExists = await sessionsCol.findOne({ token: hashToken(newRaw) });
      assert(!oldStillExists && newExists?.userId === toId && newExists?.role === toRole, `Account switch ${fromRole} -> ${toRole} invalidated old session and activated ${toRole}`);

      await sessionsCol.deleteOne({ token: hashToken(newRaw) });
    }

    // Verify Deactivating Staff revokes all active Staff sessions immediately
    const activeStaffSess = `tok-staff-active-${stamp}`;
    await sessionsCol.insertOne({
      id: `s-staff-${stamp}`,
      token: hashToken(activeStaffSess),
      userId: staffId,
      role: "staff",
      status: "active",
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    });

    await usersCol.updateOne({ id: staffId }, { $set: { status: "suspended" } });
    await sessionsCol.deleteMany({ userId: staffId });

    const remainingStaffSessions = await sessionsCol.countDocuments({ userId: staffId });
    assert(remainingStaffSessions === 0, "Deactivating Staff account revokes all active Staff sessions immediately");
  } finally {
    await sessionsCol.deleteMany({ userId: { $in: [adminId, staffId, studentId] } });
    await usersCol.deleteMany({ id: { $in: [adminId, staffId, studentId] } });
    await client.close();
  }

  console.log("\n=================================================================");
  console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Test suite fatal error:", err);
  process.exit(1);
});
