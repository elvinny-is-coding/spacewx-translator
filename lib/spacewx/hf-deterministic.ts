// lib/spacewx/hf-deterministic.ts

import type {
  BandRecommendation,
  BandRange,
  BandStatus,
} from "@/types/hf-advisory";

/**
 * Compute band propagation statuses from NOAA scales alone.
 * Used as a fallback when the AI advisory is unavailable.
 *
 * Rules of thumb:
 * - R-scale (radio blackout): R1+ degrades higher bands (10-20m) on the sunlit side.
 * - Kp index: higher Kp causes absorption at high latitudes, especially on lower bands (60-160m).
 * - Both elevated: mid bands (30-40m) become the most reliable.
 */
export function computeDeterministicBands(
  rScale: number | null,
  kp: number | null,
): BandRecommendation[] {
  const r = rScale ?? 0;
  const k = kp ?? 0;

  const ranges: BandRange[] = ["10-15m", "17-20m", "30-40m", "60-80m", "160m+"];

  return ranges.map((range) => {
    let status: BandStatus;
    let driver: string;
    let note: string;

    switch (range) {
      case "10-15m":
        if (r >= 2) {
          status = "blackout";
          driver = `R${r} blackout`;
          note = "Complete blackout on sunlit side. No usable propagation.";
        } else if (r >= 1) {
          status = "poor";
          driver = `R${r} blackout`;
          note = "Heavy D-layer absorption. Weak signals only.";
        } else if (k >= 5) {
          status = "fair";
          driver = `Kp ${k.toFixed(1)}`;
          note =
            "Elevated absorption at high latitudes. Mid-latitude paths usable.";
        } else {
          status = "good";
          driver = "Quiet conditions";
          note = "Strong daytime propagation. Good for DX.";
        }
        break;

      case "17-20m":
        if (r >= 2) {
          status = "poor";
          driver = `R${r} blackout`;
          note = "Significant absorption. Sporadic openings only.";
        } else if (r >= 1) {
          status = "fair";
          driver = `R${r} blackout`;
          note = "Moderate absorption. Gray-line may offer brief openings.";
        } else if (k >= 5) {
          status = "fair";
          driver = `Kp ${k.toFixed(1)}`;
          note = "Some auroral absorption at high latitudes. Otherwise usable.";
        } else {
          status = "good";
          driver = "Quiet conditions";
          note = "Reliable daytime and nighttime propagation.";
        }
        break;

      case "30-40m":
        if (r >= 3) {
          status = "poor";
          driver = `R${r} blackout`;
          note = "Extended blackout. Wait for conditions to improve.";
        } else if (r >= 1 || k >= 7) {
          status = "fair";
          driver = r >= 1 ? `R${r} blackout` : `Kp ${k.toFixed(1)}`;
          note = "Some absorption. Nighttime paths remain usable.";
        } else if (k >= 5) {
          status = "good";
          driver = `Kp ${k.toFixed(1)}`;
          note =
            "Good nighttime propagation. Daytime may have slight absorption.";
        } else {
          status = "good";
          driver = "Quiet conditions";
          note = "Excellent all-around band. Reliable day and night.";
        }
        break;

      case "60-80m":
        if (k >= 7) {
          status = "poor";
          driver = `Kp ${k.toFixed(1)}`;
          note = "Heavy auroral absorption. Signals significantly attenuated.";
        } else if (k >= 5) {
          status = "fair";
          driver = `Kp ${k.toFixed(1)}`;
          note =
            "Some auroral noise and absorption. Regional paths still usable.";
        } else if (r >= 2) {
          status = "fair";
          driver = `R${r} blackout`;
          note = "Minor daytime absorption. Nighttime paths unaffected.";
        } else {
          status = "good";
          driver = "Quiet conditions";
          note = "Excellent nighttime regional propagation. Low noise floor.";
        }
        break;

      case "160m+":
        if (k >= 7) {
          status = "blackout";
          driver = `Kp ${k.toFixed(1)}`;
          note = "Severe auroral absorption. Band effectively closed.";
        } else if (k >= 5) {
          status = "poor";
          driver = `Kp ${k.toFixed(1)}`;
          note = "High auroral noise. Weak signals may be unreadable.";
        } else if (r >= 2) {
          status = "fair";
          driver = `R${r} blackout`;
          note = "Daytime absorption only. Nighttime paths remain clear.";
        } else {
          status = "good";
          driver = "Quiet conditions";
          note = "Deep nighttime propagation. Excellent for regional nets.";
        }
        break;

      default:
        status = "fair";
        driver = "Unknown";
        note = "No assessment available.";
    }

    return { range, status, driver, note };
  });
}
