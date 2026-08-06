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

export function buildRiskScorecardPrompt(data: SpaceWeatherData): string {
  const kpInfo = data.kp !== null ? `Kp ${data.kp.toFixed(1)}` : "Kp unavailable";
  const { label: kpLabel } = severityFromKp(data.kp);
  const windSpeed = data.solarWind?.speed ?? null;
  const bz = data.solarWind?.bz ?? null;
  const windInfo = windSpeed !== null ? `${windSpeed} km/s` : "unavailable";
  const bzInfo = bz !== null ? `${bz.toFixed(1)} nT` : "unavailable";

  const flareInfo = data.flares.length > 0
    ? data.flares.map(f => f.classType).join(", ")
    : "none";

  const facts = [
    `Current Kp index: ${kpInfo} (${kpLabel})`,
    `Active NOAA scales: ${formatScales(data)}`,
    `Solar wind speed: ${windInfo}, Bz: ${bzInfo}`,
    `Recent flares (24h): ${flareInfo}`,
    `Alerts summary: ${formatAlerts(data)}`,
  ].join("\n");

  return [
    "System: You are a space weather risk analyst. Given the current space weather conditions, evaluate the operational risk for five key systems.",
    "",
    "For each system, provide:",
    "- riskLevel: one of 'low', 'medium', 'high', 'critical'",
    "- recommendation: a short, actionable one-line recommendation for operators",
    "",
    "Respond ONLY with valid JSON in this exact structure:",
    '{ "assessments": [ { "system": "HF Communications", "riskLevel": "...", "recommendation": "..." }, ... ] }',
    "",
    "Current space weather data:",
    facts,
  ].join("\n");
}
``````typescript
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

export function buildRiskScorecardPrompt(data: SpaceWeatherData): string {
  const kpInfo = data.kp !== null ? `Kp ${data.kp.toFixed(1)}` : "Kp unavailable";
  const { label: kpLabel } = severityFromKp(data.kp);
  const windSpeed = data.solarWind?.speed ?? null;
  const bz = data.solarWind?.bz ?? null;
  const windInfo = windSpeed !== null ? `${windSpeed} km/s` : "unavailable";
  const bzInfo = bz !== null ? `${bz.toFixed(1)} nT` : "unavailable";

  const flareInfo = data.flares.length > 0
    ? data.flares.map(f => f.classType).join(", ")
    : "none";

  const facts = [
    `Current Kp index: ${kpInfo} (${kpLabel})`,
    `Active NOAA scales: ${formatScales(data)}`,
    `Solar wind speed: ${windInfo}, Bz: ${bzInfo}`,
    `Recent flares (24h): ${flareInfo}`,
    `Alerts summary: ${formatAlerts(data)}`,
  ].join("\n");

  return [
    "System: You are a space weather risk analyst. Given the current space weather conditions, evaluate the operational risk for five key systems.",
    "",
    "For each system, provide:",
    "- riskLevel: one of 'low', 'medium', 'high', 'critical'",
    "- recommendation: a short, actionable one-line recommendation for operators",
    "",
    "Respond ONLY with valid JSON in this exact structure:",
    '{ "assessments": [ { "system": "HF Communications", "riskLevel": "...", "recommendation": "..." }, ... ] }',
    "",
    "Current space weather data:",
    facts,
  ].join("\n");
}