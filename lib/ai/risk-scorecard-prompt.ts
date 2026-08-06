// lib/ai/risk-scorecard-prompt.ts

import type { SpaceWeatherData } from "@/types/spacewx";
import { severityFromKp } from "@/config/constants";

function formatScales(data: SpaceWeatherData): string {
  const parts: string[] = [];
  if (data.noaaScaleG !== null) parts.push(`G-scale: G${data.noaaScaleG}`);
  if (data.noaaScaleR !== null) parts.push(`R-scale: R${data.noaaScaleR}`);
  if (data.noaaScaleS !== null) parts.push(`S-scale: S${data.noaaScaleS}`);
  return parts.length > 0 ? parts.join(", ") : "No scales active";
}

function formatAlerts(data: SpaceWeatherData): string {
  if (data.alerts.length === 0) return "No active alerts";
  return data.alerts
    .slice(0, 5)
    .map((a) => a.message.slice(0, 120))
    .join("; ");
}

/**
 * Builds a prompt that asks the AI for five short, plain‑language
 * operational recommendations — one per system.
 * The risk level and driver are computed deterministically elsewhere;
 * the AI only fills in the natural‑language "recommendation" text.
 */
export function buildRiskRecommendationsPrompt(data: SpaceWeatherData): string {
  const kpInfo =
    data.kp !== null ? `Kp ${data.kp.toFixed(1)}` : "Kp unavailable";
  const { label: kpLabel } = severityFromKp(data.kp);
  const windSpeed = data.solarWind?.speed ?? null;
  const bz = data.solarWind?.bz ?? null;
  const windInfo = windSpeed !== null ? `${windSpeed} km/s` : "unavailable";
  const bzInfo = bz !== null ? `${bz.toFixed(1)} nT` : "unavailable";

  const flareInfo =
    data.flares.length > 0
      ? data.flares.map((f) => f.classType).join(", ")
      : "none";

  const facts = [
    `Current Kp index: ${kpInfo} (${kpLabel})`,
    `Active NOAA scales: ${formatScales(data)}`,
    `Solar wind speed: ${windInfo}, Bz: ${bzInfo}`,
    `Recent flares (24h): ${flareInfo}`,
    `Alerts summary: ${formatAlerts(data)}`,
  ].join("\n");

  return [
    "System: You are a space weather risk analyst. Based on the data below, write one short, actionable operational recommendation for each of these five systems.",
    "Write exactly ONE sentence per system. Keep each sentence under 25 words. Do NOT use JSON, bullet points, or markdown.",
    "",
    "Systems: HF Communications, GNSS, LEO Satellite Drag, Power Grid, Polar Aviation",
    "",
    "Example (do not copy, write fresh for the current data):",
    "HF Communications: Shift to NVIS or SATCOM backup due to R2 blackout on the sunlit hemisphere.",
    "GNSS: Add 2 m margin to positioning solutions; ionospheric scintillation likely.",
    "LEO Satellite Drag: Schedule orbit maintenance within 24h; G2 storm increasing drag by ~15%.",
    "Power Grid: No action required; Bz northward and G-scale quiet.",
    "Polar Aviation: Activate polar route contingency plan; S2 radiation storm in progress.",
    "",
    "Current space weather data:",
    facts,
    "",
    "Recommendations:",
  ].join("\n");
}
