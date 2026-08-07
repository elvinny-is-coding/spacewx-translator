// lib/ai/mission-impact-prompt.ts

import type { SpaceWeatherData } from "@/types/spacewx";
import type {
  MissionImpactRequest,
  ToleranceLevel,
} from "@/types/mission-impact";
import { MISSION_GUIDANCE } from "@/lib/ai/mission-advisory-prompt";
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

function toleranceDescription(t: ToleranceLevel): string {
  switch (t) {
    case "strict":
      return "Strict — only go if conditions are well within safe limits. Any moderate risk is a no‑go.";
    case "moderate":
      return "Moderate — accept moderate risks if mitigations are available and feasible.";
    case "flexible":
      return "Flexible — proceed unless a critical risk is present. Accept higher uncertainty.";
  }
}

export function buildMissionImpactPrompt(
  request: MissionImpactRequest,
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

  const altitudeInfo =
    request.altitudeKm != null ? `${request.altitudeKm} km` : "not specified";

  const timeWindow = `${new Date(request.timeWindowStart).toLocaleString("en-US")} to ${new Date(request.timeWindowEnd).toLocaleString("en-US")}`;

  const missionGuidance =
    MISSION_GUIDANCE[request.missionType] || "No specific guidance available.";

  const facts = [
    `Mission type: ${request.missionType}`,
    `Planned window: ${timeWindow}`,
    `Altitude: ${altitudeInfo}`,
    `Risk tolerance: ${toleranceDescription(request.tolerance)}`,
    `Current Kp index: ${kpInfo}`,
    `Active NOAA scales: ${formatScales(data)}`,
    `Solar wind speed: ${windInfo}, Bz: ${bzInfo}`,
    `Recent flares (24h): ${flareInfo}`,
    `72‑hour Kp forecast: ${formatForecast(data)}`,
    `Mission‑specific guidance: ${missionGuidance}`,
  ].join("\n");

  return [
    "System: You are a space mission impact analyst. Given the user's detailed mission profile and current space weather conditions, provide a structured impact assessment.",
    "",
    "Provide:",
    "- verdict: 'GO', 'CONDITIONAL GO', or 'NO GO'",
    "- confidence: a number from 0.0 to 1.0 indicating how confident you are in the verdict",
    "- risks: an array of 2‑4 specific risks, each with a name, severity ('low', 'medium', 'high', 'critical'), and a one‑sentence description",
    "- mitigations: an array of 1‑3 actionable recommendations to reduce risk (can be empty if GO)",
    "- changeCondition: a single sentence describing what would change the verdict (e.g., 'If Kp drops below 4, becomes GO')",
    "- summary: a 2‑3 sentence plain‑language explanation of the overall assessment",
    "",
    "Respond ONLY with valid JSON in this exact structure:",
    '{ "verdict": "...", "confidence": 0.85, "risks": [ { "name": "...", "severity": "...", "description": "..." } ], "mitigations": [...], "changeCondition": "...", "summary": "..." }',
    "",
    "Current data:",
    facts,
  ].join("\n");
}
