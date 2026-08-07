// lib/ai/polar-route-brief-prompt.ts

import type { SpaceWeatherData } from "@/types/spacewx";

/**
 * Build a prompt that asks the AI to produce a dispatcher‑facing route brief
 * as structured JSON. The AI considers the selected route, any active ICAO
 * advisories (already fetched and passed as plain text), and current NOAA
 * G/R/S scales to determine route status, hazard type, valid window,
 * operational alternatives, and a short summary.
 */
export function buildPolarRouteBriefPrompt(
  routeLabel: string,
  origin: string,
  destination: string,
  icaoAdvisoryText: string | null,
  data: SpaceWeatherData,
): string {
  const gScale = data.noaaScaleG !== null ? `G${data.noaaScaleG}` : "G0";
  const rScale = data.noaaScaleR !== null ? `R${data.noaaScaleR}` : "R0";
  const sScale = data.noaaScaleS !== null ? `S${data.noaaScaleS}` : "S0";
  const kp = data.kp !== null ? data.kp.toFixed(1) : "?";
  const windSpeed = data.solarWind?.speed ?? "?";
  const bz = data.solarWind?.bz ?? "?";

  const advisoryBlock = icaoAdvisoryText
    ? `Active ICAO advisory:\n${icaoAdvisoryText}`
    : "No active ICAO advisory.";

  const facts = [
    `Route: ${origin} → ${destination}`,
    `Current NOAA scales: ${gScale} / ${rScale} / ${sScale}`,
    `Kp index: ${kp}, Solar wind: ${windSpeed} km/s, Bz: ${bz} nT`,
    advisoryBlock,
  ].join("\n");

  return [
    "System: You are an aviation operations analyst. Given the route, current space weather conditions, and any active ICAO advisories, produce a dispatcher‑facing route brief.",
    "",
    "Provide:",
    "- status: one of 'OPEN', 'CONDITIONAL', or 'AVOID'",
    "- hazardType: the primary space weather concern for this route (e.g., 'HF blackout', 'Radiation storm', 'Geomagnetic storm', 'None')",
    "- validWindow: if conditions are time‑limited, provide a short time window when the route is safest (e.g., 'until 09:00 UTC'), or null if no time limit",
    "- alternatives: an array of 1‑2 alternative route suggestions if the route should be avoided or is conditional (e.g., ['Use lower‑latitude track via Anchorage', 'Delay departure by 2 hours']). If status is OPEN, return an empty array.",
    "- summary: a 2‑3 sentence plain‑language explanation for a dispatcher",
    "",
    "Respond ONLY with valid JSON in this exact structure:",
    '{ "status": "...", "hazardType": "...", "validWindow": "...", "alternatives": [...], "summary": "..." }',
    "",
    "Current data:",
    facts,
  ].join("\n");
}
