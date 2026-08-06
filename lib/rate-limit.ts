// lib/rate-limit.ts

interface RateLimitEntry {
  count: number;
  resetAt: number;
  lastUpdated: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const CLEANUP_INTERVAL_MS = 60 * 1000; // Clean up every minute
const MAX_ENTRIES = 10000; // Prevent memory leaks

// Periodic cleanup of expired entries
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of rateLimitMap.entries()) {
      if (now > entry.resetAt) {
        rateLimitMap.delete(key);
        cleaned++;
      }
    }

    // Prevent unbounded growth
    if (rateLimitMap.size > MAX_ENTRIES) {
      const entries = Array.from(rateLimitMap.entries());
      entries.sort((a, b) => a[1].lastUpdated - b[1].lastUpdated);

      const toDelete = entries.slice(0, Math.floor(MAX_ENTRIES * 0.1));
      for (const [key] of toDelete) {
        rateLimitMap.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`Rate limit cleanup: removed ${cleaned} entries`);
    }
  }, CLEANUP_INTERVAL_MS);
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { windowMs: 60_000, maxRequests: 10 },
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetAt) {
    // New window
    const resetAt = now + config.windowMs;
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt,
      lastUpdated: now,
    });

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt,
    };
  }

  // Existing window
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  entry.count++;
  entry.lastUpdated = now;

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

export function getRateLimitHeaders(result: ReturnType<typeof checkRateLimit>) {
  return {
    "X-RateLimit-Limit": "10",
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": new Date(result.resetAt).toISOString(),
  };
}
