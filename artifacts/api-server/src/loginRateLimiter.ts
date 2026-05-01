import type { Request } from "express";

/**
 * In-memory brute-force protection for the login endpoint.
 *
 * We track failed login attempts independently by username and by client
 * IP. Once either key crosses MAX_FAILURES inside a sliding window, the
 * key is "locked" — every further login attempt for that key is rejected
 * with HTTP 429 *before* any password check runs, so the attacker cannot
 * use the endpoint as a password oracle.
 *
 * Successful logins clear both the username and IP counters so a user
 * who simply mistyped once is not punished after they get it right.
 *
 * Keying by both username and IP matters:
 *   - The username key stops an attacker who tries one password against
 *     `admin` from many IPs.
 *   - The IP key stops an attacker who tries many usernames from one IP
 *     (credential stuffing, username enumeration).
 *
 * Lockout duration grows exponentially with each additional failure
 * past the threshold, capped at MAX_LOCKOUT_MS, so a determined attacker
 * is slowed to a crawl while a real user only sees the base lockout.
 *
 * State lives in process memory. That is intentional: the deployment is
 * a single API server, and an in-memory limiter has no extra dependency
 * and resets on restart, which is the desired behaviour for an honest
 * operator. If this is ever scaled horizontally, swap the Map for a
 * shared store (Redis, Postgres) behind the same interface.
 */

const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const BASE_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes
const MAX_LOCKOUT_MS = 60 * 60 * 1000; // cap at 1 hour
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

interface AttemptRecord {
  failures: number;
  windowStart: number;
  lockedUntil: number;
}

const records = new Map<string, AttemptRecord>();

function getRecord(key: string, now: number): AttemptRecord {
  let r = records.get(key);
  if (!r) {
    r = { failures: 0, windowStart: now, lockedUntil: 0 };
    records.set(key, r);
    return r;
  }
  // If the failure window has rolled over and the key is no longer
  // locked, reset the counter so a user who failed twice yesterday
  // doesn't start today already partway to a lockout.
  if (now - r.windowStart > WINDOW_MS && now >= r.lockedUntil) {
    r.failures = 0;
    r.windowStart = now;
    r.lockedUntil = 0;
  }
  return r;
}

export interface LockoutCheckResult {
  locked: boolean;
  retryAfterSec: number;
}

/**
 * Build the keys we want to rate-limit a login attempt against. Username
 * is lowercased so `Admin` and `admin` are treated as the same account.
 * If the username is missing (malformed request) we still rate-limit by
 * IP so the endpoint can't be used as an unbounded throttle-free probe.
 */
export function loginKeysFor(req: Request, username: unknown): string[] {
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  const keys = [`ip:${ip}`];
  if (typeof username === "string" && username.length > 0) {
    keys.push(`user:${username.toLowerCase()}`);
  }
  return keys;
}

/**
 * Returns whether any of the supplied keys is currently locked out, and
 * the longest remaining lockout in seconds. Callers should reject with
 * HTTP 429 and a `Retry-After` header when `locked` is true, *before*
 * performing any credential check.
 */
export function checkLocked(keys: string[]): LockoutCheckResult {
  const now = Date.now();
  let longestRemainingMs = 0;
  for (const key of keys) {
    const r = records.get(key);
    if (r && r.lockedUntil > now) {
      const remaining = r.lockedUntil - now;
      if (remaining > longestRemainingMs) {
        longestRemainingMs = remaining;
      }
    }
  }
  return {
    locked: longestRemainingMs > 0,
    retryAfterSec: Math.ceil(longestRemainingMs / 1000),
  };
}

/**
 * Record a failed login attempt against every supplied key. Once a key
 * crosses MAX_FAILURES the key is locked; each further failure
 * exponentially extends its lockout (15m, 30m, 60m, 60m, ...).
 */
export function recordFailure(keys: string[]): void {
  const now = Date.now();
  for (const key of keys) {
    const r = getRecord(key, now);
    r.failures += 1;
    if (r.failures >= MAX_FAILURES) {
      const excess = r.failures - MAX_FAILURES;
      const lockoutMs = Math.min(
        BASE_LOCKOUT_MS * Math.pow(2, excess),
        MAX_LOCKOUT_MS,
      );
      r.lockedUntil = now + lockoutMs;
    }
  }
}

/**
 * How many more failed login attempts the supplied keys can absorb
 * before the most-restrictive key crosses MAX_FAILURES and is locked.
 *
 * Returns the *minimum* across all supplied keys, so the value matches
 * the worst-case experience the user is about to have. A fresh key with
 * no record contributes the full MAX_FAILURES budget. A key whose
 * window has already rolled over is treated as having zero failures so
 * we don't under-report the remaining budget.
 *
 * Callers should fold this into the 401 response (e.g. as an
 * `attemptsRemaining` field) so the login UI can warn the user before
 * they accidentally tip themselves into a 15-minute lockout. Returns 0
 * when one of the keys has already hit the failure threshold — at that
 * point the next call to `checkLocked` will refuse the request anyway.
 */
export function remainingAttempts(keys: string[]): number {
  const now = Date.now();
  let min = MAX_FAILURES;
  for (const key of keys) {
    const r = records.get(key);
    if (!r) continue;
    let failures = r.failures;
    if (now - r.windowStart > WINDOW_MS && now >= r.lockedUntil) {
      failures = 0;
    }
    const remaining = Math.max(0, MAX_FAILURES - failures);
    if (remaining < min) min = remaining;
  }
  return min;
}

/**
 * Clear every supplied key. Called after a successful login so an honest
 * user who fat-fingered their password isn't kept partway to a lockout.
 */
export function recordSuccess(keys: string[]): void {
  for (const key of keys) {
    records.delete(key);
  }
}

/**
 * Test-only helper. Lets unit tests start from a clean slate without
 * having to wait out lockout windows or restart the process.
 */
export function _resetForTests(): void {
  records.clear();
}

// Periodic cleanup keeps the Map from growing without bound on a server
// that sees many distinct usernames/IPs over its lifetime. We only drop
// records whose window has expired AND that aren't currently locked.
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, r] of records) {
    if (r.lockedUntil <= now && now - r.windowStart > WINDOW_MS) {
      records.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS);
// Don't keep the event loop alive solely for cleanup.
if (typeof cleanupTimer.unref === "function") {
  cleanupTimer.unref();
}
