import { AI_CACHE_TTL_MS } from "@/config/constants";

interface CacheEntry {
  value: string;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function hashKey(data: unknown, audience: string): string {
  // Simple deterministic hash from JSON representation
  const str = JSON.stringify(data) + "|" + audience;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return String(hash);
}

export function getCachedSummary(
  data: unknown,
  audience: string,
): string | null {
  const key = hashKey(data, audience);
  const entry = cache.get(key);
  if (entry && entry.expiresAt > Date.now()) {
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
  cache.set(key, {
    value: summary,
    expiresAt: Date.now() + AI_CACHE_TTL_MS,
  });
}
