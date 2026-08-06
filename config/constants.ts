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

// Severity thresholds for Kp index (aligned with NOAA G-scale definitions)
// NOAA G-scale: G1=Kp5, G2=Kp6, G3=Kp7, G4=Kp8, G5=Kp9
export const SEVERITY_LEVELS: Record<
  string,
  {
    label: string;
    color: string;
    minKp: number;
    maxKp: number;
    gScale?: string;
  }
> = {
  quiet: {
    label: "Quiet",
    color: "aurora-green",
    minKp: 0,
    maxKp: 4,
    gScale: "G0",
  },
  unsettled: {
    label: "Unsettled",
    color: "aurora-green",
    minKp: 4,
    maxKp: 4.99,
    gScale: "G0",
  },
  active: {
    label: "Minor Storm",
    color: "aurora-violet",
    minKp: 5,
    maxKp: 6.99,
    gScale: "G1-G2",
  },
  storm: {
    label: "Major Storm",
    color: "solar-amber",
    minKp: 7,
    maxKp: 9,
    gScale: "G3-G5",
  },
};

export function severityFromKp(kp: number | null): {
  label: string;
  color: string;
  gScale?: string;
} {
  if (kp === null) return { label: "Unknown", color: "faint-star" };
  if (kp < 4) return SEVERITY_LEVELS.quiet;
  if (kp < 5) return SEVERITY_LEVELS.unsettled;
  if (kp < 7) return SEVERITY_LEVELS.active;
  return SEVERITY_LEVELS.storm;
}

// Add function to get exact G-scale from Kp
export function kpToGScale(kp: number | null): string {
  if (kp === null) return "G0";
  if (kp < 5) return "G0";
  if (kp < 6) return "G1";
  if (kp < 7) return "G2";
  if (kp < 8) return "G3";
  if (kp < 9) return "G4";
  return "G5";
}

export const AI_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
