import "server-only";

/**
 * MongoDB Platform Settings Repository — PakSeekers.
 *
 * Implements persistent configuration for general platform details,
 * student registration controls, maintenance mode, and examination preferences.
 */

import {
  getMongoDb,
  COLLECTIONS,
  toDomainEntity,
  type SettingsDoc,
} from "@/server/db";
import type { PlatformSettings } from "@/types";

const DEFAULT_SETTINGS: PlatformSettings = {
  id: "default",
  general: {
    platformName: "PakSeekers",
    tagline: "Pakistan's Premier Entrance Examination Preparation Platform",
    contactEmail: "contact@pakseekers.com",
    supportPhone: "+92 300 1234567",
    address: "Islamabad & Lahore, Pakistan",
  },
  platform: {
    allowRegistration: true,
    maintenanceMode: false,
    announcementBanner: "MDCAT & ECAT 2026 Test Series is Now Live!",
  },
  examination: {
    defaultTestDuration: 30,
    passingScorePercentage: 50,
    allowTestRetakes: true,
    showExplanationsImmediately: true,
  },
  content: {
    defaultQuestionStatus: "published",
    enableQuestionReporting: true,
    maxQuestionsPerCustomTest: 100,
  },
  updatedAt: new Date().toISOString(),
};

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const db = await getMongoDb();
  let doc = await db
    .collection<SettingsDoc>(COLLECTIONS.SETTINGS)
    .findOne({ id: "default" });

  if (!doc) {
    // Initialize default singleton settings in database
    await db.collection<SettingsDoc>(COLLECTIONS.SETTINGS).insertOne({
      ...DEFAULT_SETTINGS,
      _id: undefined,
    } as SettingsDoc);
    doc = await db
      .collection<SettingsDoc>(COLLECTIONS.SETTINGS)
      .findOne({ id: "default" });
  }

  return toDomainEntity<PlatformSettings>(doc) || DEFAULT_SETTINGS;
}

export async function updatePlatformSettings(
  input: {
    general?: Partial<PlatformSettings["general"]>;
    platform?: Partial<PlatformSettings["platform"]>;
    examination?: Partial<PlatformSettings["examination"]>;
    content?: Partial<PlatformSettings["content"]>;
  },
  updatedBy?: string
): Promise<PlatformSettings> {
  const db = await getMongoDb();
  const current = await getPlatformSettings();
  const now = new Date().toISOString();

  const updated: PlatformSettings = {
    id: "default",
    general: {
      ...current.general,
      ...(input.general || {}),
    },
    platform: {
      ...current.platform,
      ...(input.platform || {}),
    },
    examination: {
      ...current.examination,
      ...(input.examination || {}),
    },
    content: {
      ...current.content,
      ...(input.content || {}),
    },
    updatedAt: now,
    updatedBy: updatedBy || "admin",
  };

  await db.collection<SettingsDoc>(COLLECTIONS.SETTINGS).updateOne(
    { id: "default" },
    { $set: updated },
    { upsert: true }
  );

  return updated;
}
