// lib/ai/hf-advisory-prompt.ts

import type { SpaceWeatherData } from "@/types/spacewx";

function formatScales(data: SpaceWeatherData): string {
  const parts: string[] = [];
  if (data.noaaScaleG !== null) parts.push(`G-scale: G${data.noaaScaleG}`);
  if (data.noaaScaleR !== null) parts.push(`R-scale: R${data.noaaScaleR}`);
  if (data.noaaScaleS !== null) parts.push(`S-scale: S${data.noaaScaleS}`);
  return parts.length > 0 ? parts.join(", ") : "No scales active";
}

export function buildHfAdvisoryPrompt(
  qth: string,
  target: string,
  data: SpaceWeatherData,
): string {
  const kpInfo =
    data.kp !== null ? `Kp ${data.kp.toFixed(1)}` : "Kp unavailable";
  const windSpeed = data.solarWind?.speed ?? null;
  const bz = data.solarWind?.bz ?? null;
  const windInfo = windSpeed !== null ? `${windSpeed} km/s` : "unavailable";
  const bzInfo = bz !== null ? `${bz.toFixed(1)} nT` : "unavailable";

  const flareInfo =
    data.flares.length > 0
      ? data.flares.map((f) => f.classType).join(", ")
      : "none";

  const facts = [
    `Operator QTH: ${qth}`,
    `Target region: ${target}`,
    `Current Kp index: ${kpInfo}`,
    `Active NOAA scales: ${formatScales(data)}`,
    `Solar wind speed: ${windInfo}, Bz: ${bzInfo}`,
    `Recent flares (24h): ${flareInfo}`,
    `Alerts: ${data.alerts.length > 0 ? data.alerts.map((a) => a.message.slice(0, 100)).join("; ") : "none"}`,
  ].join("\n");

  const ranges = ["10-15m", "17-20m", "30-40m", "60-80m", "160m+"];

  return [
    "System: You are an HF radio propagation analyst. Given the operator's location, target region, and current space weather conditions, provide a grouped band-range propagation assessment.",
    "",
    "Consider:",
    "- R-scale (radio blackout): R1+ means HF blackouts on the sunlit side",
    "- Kp index: higher Kp causes absorption at high latitudes, especially on lower bands",
    "- Solar wind speed and Bz: southward Bz can enhance auroral propagation on higher bands but degrade lower ones",
    "- Flares: recent X-class or M-class flares cause shortwave fadeouts",
    "",
    "For each band range, provide:",
    "- range: one of the band range names listed below",
    "- status: one of 'good', 'fair', 'poor', 'blackout'",
    "- note: a short, actionable one-line tip for the operator",
    "",
    "Also provide a 2-3 sentence summary with your overall assessment.",
    "",
    "Respond ONLY with valid JSON in this exact structure:",
    '{ "qth": "' +
      qth +
      '", "target": "' +
      target +
      '", "bands": [ { "range": "10-15m", "status": "...", "note": "..." }, ... ], "summary": "..." }',
    "",
    "Current conditions:",
    facts,
    "",
    "Band ranges to include: " + ranges.join(", "),
  ].join("\n");
}
