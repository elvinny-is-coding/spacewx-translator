import type { OvationData, OvationGrid } from "@/types/ovation";

// ── Constants ──

/** Grid dimensions from NOAA OVATION model (fixed). */
export const OVATION_COLS = 360; // longitude steps 0–359°
export const OVATION_ROWS = 181; // latitude steps 90° to –90°

/**
 * Approximate geomagnetic north pole (centered dipole) for epoch 2025.
 * The pole drifts roughly 50–60 km/year; update this value every couple of years.
 * Source: IGRF-14 extrapolation.
 */
export const GEOMAGNETIC_NORTH_POLE = {
  lat: 80.4,
  lon: -72.6,
};

/**
 * Probability thresholds for the "Will I see the aurora?" indicator.
 * Values correspond to OVATION probability (0–100 %).
 */
export const VISIBILITY_THRESHOLDS = {
  none: 5, // < 5% → "No"
  low: 25, // 5–25% → "Low chance"
  possible: 50, // 25–50% → "Possible"
  likely: 75, // 50–75% → "Likely"
  high: 75, // > 75% → "Very likely"
};

/**
 * Base equatorward boundary latitude (geomagnetic) at Kp = 0, and the
 * rate the boundary moves equatorward per unit of Kp. Per NOAA's stated
 * Kp-oval relationship: ~66° magnetic latitude at Kp=0, down to ~48° at
 * Kp=9 (i.e. ~2° equatorward per Kp level).
 *
 * These are shared by both the oval-overlay map feature and the
 * calendar-export heuristic (lib/ics-utils.ts) so there is exactly one
 * place to correct this model if it's ever revised.
 */
export const AURORA_OVAL_BASE_LATITUDE = 66;
export const AURORA_OVAL_DEGREES_PER_KP = 2;

// ── Reshape ──

/**
 * Converts the flat OVATION coordinate array into a 2D grid.
 * NOAA stores data in column‑major (Fortran) order:
 * longitude varies fastest, then latitude.
 * grid[row][col] = probability (0–100), row = latitude index (0 = North Pole, 180 = South Pole).
 */
export function reshapeOvationGrid(data: OvationData): OvationGrid {
  const grid: number[][] = Array.from({ length: OVATION_ROWS }, () =>
    new Array(OVATION_COLS).fill(0),
  );

  for (let i = 0; i < data.coordinates.length; i++) {
    const [lon, lat, prob] = data.coordinates[i];
    // NOAA longitude: 0–359, latitude: 90 to –90 (step -1)
    const col = Math.round(lon);
    const row = Math.round(90 - lat);
    if (col >= 0 && col < OVATION_COLS && row >= 0 && row < OVATION_ROWS) {
      grid[row][col] = prob;
    }
  }

  return {
    cols: OVATION_COLS,
    rows: OVATION_ROWS,
    grid,
    forecastTime: data["Forecast Time"],
  };
}

// ── Geomagnetic Latitude ──

/**
 * Computes approximate geomagnetic latitude from geographic coordinates
 * using a centered dipole model.
 *
 * @param lat Geographic latitude in degrees (–90 to 90).
 * @param lon Geographic longitude in degrees (–180 to 180).
 * @returns Geomagnetic latitude in degrees (–90 to 90).
 */
export function getGeomagneticLatitude(lat: number, lon: number): number {
  const poleLatRad = (GEOMAGNETIC_NORTH_POLE.lat * Math.PI) / 180;
  const poleLonRad = (GEOMAGNETIC_NORTH_POLE.lon * Math.PI) / 180;
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180;

  const cosColat =
    Math.sin(latRad) * Math.sin(poleLatRad) +
    Math.cos(latRad) * Math.cos(poleLatRad) * Math.cos(lonRad - poleLonRad);

  const colatRad = Math.acos(Math.max(-1, Math.min(1, cosColat)));
  const magLatDeg = 90 - (colatRad * 180) / Math.PI;
  return magLatDeg;
}

// ── Oval Boundary ──

/**
 * Converts a Kp index to the equatorward boundary latitude (geomagnetic)
 * of the auroral oval, per NOAA's linear Kp-oval approximation.
 */
export function kpToOvalBoundaryLatitude(kp: number): number {
  const boundary = AURORA_OVAL_BASE_LATITUDE - AURORA_OVAL_DEGREES_PER_KP * kp;
  // Clamp to a sane range; the linear model isn't well-validated much
  // outside the normal Kp 0–9 range.
  return Math.max(40, Math.min(80, boundary));
}

/**
 * Given an angular distance (degrees) and bearing (degrees) from a pole,
 * returns the destination point's geographic [lat, lon]. Standard
 * spherical "destination point given distance and bearing" formula.
 */
function destinationPoint(
  poleLatDeg: number,
  poleLonDeg: number,
  angularDistanceDeg: number,
  bearingDeg: number,
): [number, number] {
  const lat1 = (poleLatDeg * Math.PI) / 180;
  const lon1 = (poleLonDeg * Math.PI) / 180;
  const d = (angularDistanceDeg * Math.PI) / 180;
  const theta = (bearingDeg * Math.PI) / 180;

  const sinLat2 =
    Math.sin(lat1) * Math.cos(d) +
    Math.cos(lat1) * Math.sin(d) * Math.cos(theta);
  const lat2 = Math.asin(Math.max(-1, Math.min(1, sinLat2)));

  const y = Math.sin(theta) * Math.sin(d) * Math.cos(lat1);
  const x = Math.cos(d) - Math.sin(lat1) * Math.sin(lat2);
  const lon2 = lon1 + Math.atan2(y, x);

  // Normalize longitude to [-180, 180]
  const lonDeg = (((lon2 * 180) / Math.PI + 540) % 360) - 180;
  return [(lat2 * 180) / Math.PI, lonDeg];
}

/**
 * Computes the equatorward auroral oval boundary for a given Kp, as a
 * closed polygon of [lat, lon] points suitable for an L.Polygon.
 *
 * Note: this renders a simplified circular oval centered on the
 * geomagnetic pole. Real auroral ovals are asymmetric (wider on the
 * nightside/midnight sector than the dayside), so this is an idealized
 * approximation intended to give a general sense of scale — not a
 * precise physical model.
 *
 * @param kp Planetary Kp index (0–9).
 * @param steps Number of points around the circle (higher = smoother).
 */
export function computeOvalBoundary(
  kp: number,
  steps = 72,
): [number, number][] {
  const boundaryMagLat = kpToOvalBoundaryLatitude(kp);
  const angularRadius = 90 - boundaryMagLat; // colatitude, in degrees

  const points: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const bearing = (360 * i) / steps;
    points.push(
      destinationPoint(
        GEOMAGNETIC_NORTH_POLE.lat,
        GEOMAGNETIC_NORTH_POLE.lon,
        angularRadius,
        bearing,
      ),
    );
  }
  return points;
}

// ── Colour Scale ──

/**
 * Maps an OVATION probability (0–100) to an RGBA colour.
 * The gradient runs from aurora-green (low) → aurora-violet → solar-amber (high).
 */
export function probabilityToColor(prob: number, alpha = 0.6): string {
  const t = Math.max(0, Math.min(100, prob)) / 100;

  // Three‑stop gradient: green → violet → amber
  if (t < 0.5) {
    const s = t / 0.5;
    const r = lerp(62, 177, s); // #3ECF8E → #B18CFF
    const g = lerp(207, 140, s);
    const b = lerp(142, 255, s);
    return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${alpha})`;
  } else {
    const s = (t - 0.5) / 0.5;
    const r = lerp(177, 245, s); // #B18CFF → #F5A623
    const g = lerp(140, 166, s);
    const b = lerp(255, 35, s);
    return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${alpha})`;
  }
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// ── Visibility Indicator ──

export interface VisibilityResult {
  /** Human‑readable label (e.g., "No", "Possible", "Likely", "Very likely") */
  label: string;
  /** Associated colour (one of our design tokens) */
  color: string;
  /** The raw probability value that was sampled */
  probability: number;
}

/**
 * Determines aurora visibility at a specific location by sampling the
 * nearest OVATION grid cell.
 *
 * @param grid The reshaped OVATION grid.
 * @param lat Geographic latitude of the location.
 * @param lon Geographic longitude of the location.
 * @returns VisibilityResult with label and colour.
 */
export function getVisibilityFromGrid(
  grid: OvationGrid,
  lat: number,
  lon: number,
): VisibilityResult {
  // Map geographic coordinates to grid indices
  const col = Math.round(((lon % 360) + 360) % 360); // normalise to 0–359
  const row = Math.round(90 - lat); // 90°N → row 0, 90°S → row 180

  const safeRow = Math.max(0, Math.min(OVATION_ROWS - 1, row));
  const safeCol = Math.max(0, Math.min(OVATION_COLS - 1, col));
  const prob = grid.grid[safeRow][safeCol] ?? 0;

  let label: string;
  let color: string;

  if (prob < VISIBILITY_THRESHOLDS.none) {
    label = "No";
    color = "faint-star";
  } else if (prob < VISIBILITY_THRESHOLDS.low) {
    label = "Low chance";
    color = "aurora-green";
  } else if (prob < VISIBILITY_THRESHOLDS.possible) {
    label = "Possible";
    color = "aurora-green";
  } else if (prob < VISIBILITY_THRESHOLDS.likely) {
    label = "Likely";
    color = "aurora-violet";
  } else {
    label = "Very likely";
    color = "solar-amber";
  }

  return { label, color, probability: prob };
}
