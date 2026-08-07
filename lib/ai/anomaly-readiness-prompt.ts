// lib/ai/anomaly-readiness-prompt.ts

import type { SpaceWeatherData } from "@/types/spacewx";
import { severityFromKp } from "@/config/constants";

function formatScales(data: SpaceWeatherData): string {
  const parts: string[] = [];
  if (data.noaaScaleG !== null) parts.push(`G-scale: G${data.noaaScaleG}`);
  if (data.noaaScaleR !== null) parts.push(`R-scale: R${data.noaaScaleR}`);
  if (data.noaaScaleS !== null) parts.push(`S-scale: S${data.noaaScaleS}`);
  return parts.length > 0 ? parts.join(", ") : "No scales active";
}

/**
 * Build a prompt asking the AI to provide a short operational recommendation
 * for each of five spacecraft subsystems. The risk level and driver are
 * computed deterministically elsewhere; the AI only fills in the
 * natural‑language "recommendation" text.
 */
export function buildAnomalyReadinessPrompt(data: SpaceWeatherData): string {
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
  ].join("\n");

  return [
    "System: You are a spacecraft operations analyst. Based on the current space weather conditions, write one short, actionable operational recommendation for each of these five satellite subsystems.",
    "Write exactly ONE sentence per subsystem. Keep each sentence under 25 words. Do NOT use JSON, bullet points, or markdown.",
    "",
    "Subsystems: GNSS, Star Tracker, Communications, Satellite Drag, Radiation SEU",
    "",
    "Example (do not copy, write fresh for the current data):",
    "GNSS: Add 2 m margin to positioning solutions; ionospheric scintillation likely.",
    "Star Tracker: Increased noise at high latitudes; consider attitude hold mode.",
    "Communications: HF blackout on sunlit side; switch to UHF relay.",
    "Satellite Drag: Schedule orbit maintenance within 24h; G2 storm increasing drag by ~15%.",
    "Radiation SEU: Monitor for single-event upsets during S2 radiation storm.",
    "",
    "Current space weather data:",
    facts,
    "",
    "Recommendations:",
  ].join("\n");
}
