import "server-only";

/**
 * Cryptographic Token Generation & Hashing — PakSeekers Phase 2.
 *
 * Implements secure session token generation and SHA-256 token hashing.
 * Raw session tokens are stored ONLY in the client's HTTP-only cookie.
 * The database stores only the SHA-256 hash of the token to prevent
 * session hijacking in the event of a database compromise.
 */

import crypto from "crypto";

/**
 * Generates a cryptographically secure, unpredictable random session token.
 * Yields 256 bits (32 bytes) of entropy represented as a 64-character hex string.
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Computes the SHA-256 digest of a session token for secure database persistence and lookup.
 */
export function hashSessionToken(token: string): string {
  if (!token || typeof token !== "string") {
    throw new Error("Cannot hash invalid or empty session token.");
  }
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Generates a cryptographically secure, unpredictable random email verification token.
 * Yields 256 bits (32 bytes) of entropy represented as a 64-character hex string.
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Computes the SHA-256 digest of an email verification token for secure database persistence and lookup.
 */
export function hashVerificationToken(token: string): string {
  if (!token || typeof token !== "string") {
    throw new Error("Cannot hash invalid or empty verification token.");
  }
  return crypto.createHash("sha256").update(token).digest("hex");
}
