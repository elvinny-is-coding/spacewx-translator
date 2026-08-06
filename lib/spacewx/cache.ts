// lib/spacewx/cache.ts
import { AI_CACHE_TTL_MS } from "@/config/constants";

interface CacheEntry {
  value: string;
  expiresAt: number;
  accessTime: number;
}

const MAX_CACHE_SIZE = 1000;
const cache = new Map<string, CacheEntry>();

function hashKey(data: unknown, audience: string): string {
  const str = JSON.stringify(data) + "|" + audience;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return String(hash);
}

function evictIfNecessary() {
  if (cache.size <= MAX_CACHE_SIZE) return;

  // LRU eviction: remove least recently used entries
  const entries = Array.from(cache.entries());
  entries.sort((a, b) => a[1].accessTime - b[1].accessTime);

  const toRemove = entries.slice(0, Math.floor(MAX_CACHE_SIZE * 0.1));
  for (const [key] of toRemove) {
    cache.delete(key);
  }
}

export function getCachedSummary(
  data: unknown,
  audience: string,
): string | null {
  const key = hashKey(data, audience);
  const entry = cache.get(key);
  const now = Date.now();

  if (entry && entry.expiresAt > now) {
    entry.accessTime = now; // Update access time for LRU
    return entry.value;
  }

  // Clean up expired entry
  if (entry) {
    cache.delete(key);
  }

  return null;
}

export function setCachedSummary(
  data: unknown,
  audience: string,
  summary: string,
): void {
  const key = hashKey(data, audience);
  const now = Date.now();

  evictIfNecessary();

  cache.set(key, {
    value: summary,
    expiresAt: now + AI_CACHE_TTL_MS,
    accessTime: now,
  });
}

export function clearExpiredCache(): void {
  const now = Date.now();
  let cleared = 0;

  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt < now) {
      cache.delete(key);
      cleared++;
    }
  }

  if (cleared > 0) {
    console.log(`Cleared ${cleared} expired cache entries`);
  }
}

// Periodic cleanup
if (typeof setInterval !== "undefined") {
  setInterval(clearExpiredCache, 5 * 60 * 1000); // Every 5 minutes
}
