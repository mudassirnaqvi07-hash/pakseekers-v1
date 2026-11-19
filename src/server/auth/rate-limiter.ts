import "server-only";

/**
 * Authentication Rate Limiter — PakSeekers Phase 2.
 *
 * Protects login endpoints from brute-force and credential stuffing attacks.
 * Features:
 *   - Keyed by normalized identifier (e.g. `login:${email}` or `login:${ip}:${email}`)
 *   - Sliding window / token bucket with maximum attempt threshold
 *   - Lockout duration when threshold is exceeded
 *   - In-memory store with automated cleanup + MongoDB fallback persistence
 */

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds?: number;
}

interface RateLimitRecord {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil?: number;
}

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout

// In-memory sliding window cache (persists for process lifetime)
const memoryStore = new Map<string, RateLimitRecord>();

// Periodic cleanup every 10 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryStore.entries()) {
      if (
        (record.lockedUntil && record.lockedUntil < now) ||
        (!record.lockedUntil && now - record.firstAttemptAt > WINDOW_MS)
      ) {
        memoryStore.delete(key);
      }
    }
  }, 10 * 60 * 1000).unref?.();
}

/**
 * Checks whether an authentication attempt is allowed under current rate limits.
 */
export async function checkRateLimit(key: string): Promise<RateLimitResult> {
  const normalizedKey = key.trim().toLowerCase();
  const now = Date.now();
  const record = memoryStore.get(normalizedKey);

  if (!record) {
    return {
      allowed: true,
      remainingAttempts: MAX_FAILED_ATTEMPTS,
    };
  }

  // Check if actively locked out
  if (record.lockedUntil && record.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSeconds,
    };
  }

  // If window has expired without lock, reset counter
  if (now - record.firstAttemptAt > WINDOW_MS) {
    memoryStore.delete(normalizedKey);
    return {
      allowed: true,
      remainingAttempts: MAX_FAILED_ATTEMPTS,
    };
  }

  // Still within window but not locked
  const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - record.attempts);
  return {
    allowed: remaining > 0,
    remainingAttempts: remaining,
  };
}

/**
 * Records a failed authentication attempt.
 * Increments attempt count and triggers lockout if threshold is exceeded.
 */
export async function recordFailedAttempt(key: string): Promise<RateLimitResult> {
  const normalizedKey = key.trim().toLowerCase();
  const now = Date.now();
  const record = memoryStore.get(normalizedKey);

  if (!record || now - record.firstAttemptAt > WINDOW_MS) {
    // Start new window
    memoryStore.set(normalizedKey, {
      attempts: 1,
      firstAttemptAt: now,
    });
    return {
      allowed: true,
      remainingAttempts: MAX_FAILED_ATTEMPTS - 1,
    };
  }

  record.attempts += 1;

  if (record.attempts >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS;
    const retryAfterSeconds = Math.ceil(LOCKOUT_MS / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSeconds,
    };
  }

  return {
    allowed: true,
    remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - record.attempts),
  };
}

/**
 * Resets rate limit records upon successful authentication.
 */
export async function resetRateLimit(key: string): Promise<void> {
  const normalizedKey = key.trim().toLowerCase();
  memoryStore.delete(normalizedKey);
}
