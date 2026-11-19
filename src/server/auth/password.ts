import "server-only";

/**
 * Cryptographic Password Hashing & Verification — PakSeekers Phase 2.
 *
 * Implements password hashing using Node.js scrypt with a cryptographically
 * random salt, and timing-safe hash comparison.
 *
 * Compatible with existing user records:
 * Format: `${salt}:${derivedKeyHex}`
 * - Salt: 16 bytes (32 hex characters)
 * - Derived Key: 64 bytes (128 hex characters)
 */

import crypto from "crypto";

const SALT_BYTES = 16;
const KEY_BYTES = 64;

/**
 * Hashes a plaintext password using scrypt with a random 16-byte salt.
 */
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(SALT_BYTES).toString("hex");
    crypto.scrypt(password, salt, KEY_BYTES, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

/**
 * Synchronous password hashing helper for scripts / seeds.
 */
export function hashPasswordSync(password: string): string {
  const salt = crypto.randomBytes(SALT_BYTES).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, KEY_BYTES);
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verifies a plaintext password against a stored combined hash (`${salt}:${key}`).
 * Uses constant-time comparison (crypto.timingSafeEqual) to prevent timing attacks.
 */
export async function verifyPassword(
  password: string,
  combinedHash: string
): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      if (!password || !combinedHash) return resolve(false);

      const parts = combinedHash.split(":");
      if (parts.length !== 2) return resolve(false);

      const [salt, key] = parts;
      if (!salt || !key) return resolve(false);

      const keyBuffer = Buffer.from(key, "hex");
      if (keyBuffer.length !== KEY_BYTES) return resolve(false);

      crypto.scrypt(password, salt, KEY_BYTES, (err, derivedKey) => {
        if (err) return resolve(false);
        resolve(crypto.timingSafeEqual(keyBuffer, derivedKey));
      });
    } catch {
      resolve(false);
    }
  });
}

/**
 * Synchronous password verification helper.
 */
export function verifyPasswordSync(
  password: string,
  combinedHash: string
): boolean {
  try {
    if (!password || !combinedHash) return false;

    const parts = combinedHash.split(":");
    if (parts.length !== 2) return false;

    const [salt, key] = parts;
    if (!salt || !key) return false;

    const keyBuffer = Buffer.from(key, "hex");
    if (keyBuffer.length !== KEY_BYTES) return false;

    const derivedKey = crypto.scryptSync(password, salt, KEY_BYTES);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}
