// lib/ai/mission-advisory-prompt.ts

import type { SpaceWeatherData } from "@/types/spacewx";
import type { MissionType } from "@/types/mission-advisory";
import { severityFromKp } from "@/config/constants";

function formatScales(data: SpaceWeatherData): string {
  const parts: string[] = [];
  if (data.noaaScaleG !== null) parts.push(`G-scale: G${data.noaaScaleG}`);
  if (data.noaaScaleR !== null) parts.push(`R-scale: R${data.noaaScaleR}`);
  if (data.noaaScaleS !== null) parts.push(`S-scale: S${data.noaaScaleS}`);
  return parts.length > 0 ? parts.join(", ") : "No scales active";
}

function formatForecast(data: SpaceWeatherData): string {
  if (!data.kpForecast || data.kpForecast.length === 0)
    return "No forecast data available";
  const points = data.kpForecast
    .map(
      (p) =>
        `${new Date(p.time).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}: Kp ${p.kp}`,
    )
    .join("; ");
  return points;
}

const MISSION_GUIDANCE: Record<MissionType, string> = {
  "CubeSat Launch":
    "A CubeSat launch requires Kp < 5 for safe deployment and minimal atmospheric drag during early orbit. G‑scale should be G0 or G1. No active radiation storms (S‑scale must be S0). Any X‑class flare in the past 24h is a no‑go.",
  "HF Operation":
    "HF radio operations need Kp < 4 for reliable propagation. R‑scale should be R0. Southward Bz (< 0) can enhance auroral propagation but also cause absorption. Solar flares cause shortwave fadeouts on the sunlit side.",
  "Balloon Flight":
    "High‑altitude balloon flights need Kp < 5 and no active radiation storm (S‑scale must be S0). Proton flux above 10 pfu is a hard no‑go. Solar wind speed > 600 km/s may indicate CME arrival and increased risk.",
  "Aurora Photography":
    "Aurora photography benefits from Kp ≥ 4 for better displays at mid‑latitudes. Southward Bz (< -5) is ideal. Clear skies assumed. No critical radiation or radio blackout concerns — this is the least restrictive mission type.",
};

export function buildMissionAdvisoryPrompt(
  missionType: MissionType,
  data: SpaceWeatherData,
): string {
  const { label: kpLabel } = severityFromKp(data.kp);
  const kpInfo =
    data.kp !== null
      ? `Kp ${data.kp.toFixed(1)} (${kpLabel})`
      : "Kp unavailable";
  const windSpeed = data.solarWind?.speed ?? null;
  const bz = data.solarWind?.bz ?? null;
  const windInfo = windSpeed !== null ? `${windSpeed} km/s` : "unavailable";
  const bzInfo = bz !== null ? `${bz.toFixed(1)} nT` : "unavailable";

  const flareInfo =
    data.flares.length > 0
      ? data.flares.map((f) => f.classType).join(", ")
      : "none";

  const facts = [
    `Mission type: ${missionType}`,
    `Current Kp index: ${kpInfo}`,
    `Active NOAA scales: ${formatScales(data)}`,
    `Solar wind speed: ${windInfo}, Bz: ${bzInfo}`,
    `Recent flares (24h): ${flareInfo}`,
    `72‑hour Kp forecast: ${formatForecast(data)}`,
    `Mission‑specific guidance: ${MISSION_GUIDANCE[missionType]}`,
  ].join("\n");

  return [
    "System: You are a space mission planner. Given the current space weather conditions and forecast, provide a go/no‑go recommendation for the specified mission type.",
    "",
    "Consider the mission‑specific guidance carefully. Provide:",
    "- verdict: 'GO', 'CONDITIONAL GO', or 'NO GO'",
    "- summary: a 2‑3 sentence explanation for your verdict, referencing specific data points",
    "- earliestSafeWindow: if the verdict is not 'GO', provide the earliest time from the forecast when conditions are likely to improve, or null if no improvement is expected",
    "",
    "Respond ONLY with valid JSON in this exact structure:",
    '{ "advisory": { "missionType": "' +
      missionType +
      '", "verdict": "...", "summary": "...", "earliestSafeWindow": "..." } }',
    "",
    "Current space weather data:",
    facts,
  ].join("\n");
}
