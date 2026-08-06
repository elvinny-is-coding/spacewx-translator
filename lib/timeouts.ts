// lib/timeouts.ts

export const TIMEOUTS = {
  // NOAA API timeouts (generally reliable)
  NOAA_KP_INDEX: 5000,
  NOAA_KP_FORECAST: 5000,
  NOAA_SOLAR_WIND: 5000,
  NOAA_ALERTS: 5000,
  NOAA_SCALES: 5000,

  // NASA DONKI (can be slower)
  NASA_DONKI: 8000,

  // OVATION aurora data (large file)
  OVATION: 15000,

  // AI API calls
  CLOUDFLARE_AI: 30000,
  GRANITE_AI: 30000,

  // Database operations
  SUPABASE_QUERY: 10000,
  SUPABASE_INSERT: 15000,
} as const;

export function getTimeoutForEndpoint(endpoint: string): number {
  if (endpoint.includes("ovation")) return TIMEOUTS.OVATION;
  if (endpoint.includes("donki") || endpoint.includes("nasa"))
    return TIMEOUTS.NASA_DONKI;
  if (endpoint.includes("noaa")) return TIMEOUTS.NOAA_KP_INDEX;
  return TIMEOUTS.NOAA_KP_INDEX; // Default
}
