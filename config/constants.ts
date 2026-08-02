// NASA DONKI base – append endpoint + ?api_key=…
export const NASA_DONKI_BASE = "https://api.nasa.gov/DONKI";
export const NASA_API_KEY = process.env.NASA_API_KEY ?? "DEMO_KEY";

// NOAA SWPC product endpoints (all public, no API key)
export const NOAA_KP_INDEX =
  "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json";
export const NOAA_KP_FORECAST =
  "https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json";

// Solar wind — new RTSW product set (effective April 30, 2026)
export const NOAA_SOLAR_WIND_PLASMA =
  "https://services.swpc.noaa.gov/json/rtsw/rtsw_wind_1m.json";
export const NOAA_SOLAR_WIND_MAG =
  "https://services.swpc.noaa.gov/json/rtsw/rtsw_mag_1m.json";

export const NOAA_ALERTS =
  "https://services.swpc.noaa.gov/products/alerts.json";
export const NOAA_SCALES =
  "https://services.swpc.noaa.gov/products/noaa-scales.json";

// Severity thresholds for Kp index (used by gauge + AI)
export const SEVERITY_LEVELS: Record<
  string,
  { label: string; color: string; minKp: number; maxKp: number }
> = {
  quiet: { label: "Quiet", color: "aurora-green", minKp: 0, maxKp: 1.99 },
  unsettled: {
    label: "Unsettled",
    color: "aurora-green",
    minKp: 2,
    maxKp: 3.99,
  },
  active: { label: "Active", color: "aurora-violet", minKp: 4, maxKp: 5.99 },
  storm: { label: "Storm", color: "solar-amber", minKp: 6, maxKp: 9 },
};

export function severityFromKp(kp: number | null): {
  label: string;
  color: string;
} {
  if (kp === null) return { label: "Unknown", color: "faint-star" };
  if (kp < 2) return SEVERITY_LEVELS.quiet;
  if (kp < 4) return SEVERITY_LEVELS.unsettled;
  if (kp < 6) return SEVERITY_LEVELS.active;
  return SEVERITY_LEVELS.storm;
}

export const AI_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
