import type { SpaceWeatherData } from "@/types/spacewx";
import type { Audience } from "@/types/audience";
import { severityFromKp } from "@/config/constants";

export function buildPrompt(
  data: SpaceWeatherData,
  audience: Audience,
): string {
  const { label } = severityFromKp(data.kp);

  const dataBlock = [
    `Current Kp index: ${data.kp ?? "unavailable"} (${label})`,
    `NOAA G-scale: ${data.noaaScaleG ?? "unavailable"}`,
    `Solar wind speed: ${data.solarWind?.speed ?? "unavailable"} km/s`,
    `Active flares (24h): ${data.flares.length > 0 ? data.flares.map((f) => f.classType).join(", ") : "none"}`,
    `CMEs (24h): ${data.cmes.length > 0 ? data.cmes.map((c) => (c.speed ? `${c.speed} km/s` : "unknown speed")).join(", ") : "none"}`,
    `Active alerts: ${data.alerts.length > 0 ? data.alerts.map((a) => a.message.slice(0, 80)).join("; ") : "none"}`,
  ].join("\n");

  const warningsText =
    data.warnings.length > 0
      ? `\nNote: Some data sources are unavailable: ${data.warnings.join(", ")}. Explain based on available data.`
      : "";

  const instructions: Record<Audience, string> = {
    general:
      "You are a friendly space weather guide. Explain current conditions in 2-3 simple sentences a non-scientist can understand. Mention if aurora might be visible and where. Use analogies if helpful. Do not invent data.",
    educator:
      "You are a space weather educator. Explain current conditions in 2-3 sentences suitable for a high-school or undergraduate science class. Include the scientific cause (e.g., CME, solar wind, Bz) and potential observable effects. Be accurate but engaging.",
    technical:
      "You are a space weather analyst. Provide a concise 2-3 sentence technical summary for satellite operators and radio engineers. Include Kp, G-scale, solar wind speed, Bz if available, and any active alerts. Mention potential impacts on HF communications, GNSS, or satellite operations. Be precise; do not embellish.",
  };

  return `System: ${instructions[audience]}\n\nCurrent space weather data:\n${dataBlock}${warningsText}\n\nSummary:`;
}

/**
 * Builds a prompt for the LLM to triage a list of raw NOAA alert messages.
 * The model is instructed to group related alerts, ignore minor/duplicates,
 * rank by importance, and produce a short plain‑language briefing.
 */
export function buildAlertTriagePrompt(
  audience: Audience,
  alertMessages: string[],
): string {
  const joinedAlerts = alertMessages
    .slice(0, 30) // safety cap on token length
    .map((msg, i) => `[Alert ${i + 1}] ${msg.slice(0, 300)}`)
    .join("\n---\n");

  const instructions: Record<Audience, string> = {
    general:
      "You are a space weather briefer for the general public. Read the list of active NOAA alerts below. " +
      "Group related or redundant alerts together and ignore minor, technical ones. " +
      "In 2-3 short sentences, explain what is currently happening, whether it might affect things like satellite TV, GPS, or power grids, and if aurora might be visible somewhere unusual. " +
      "Use plain, friendly language. No jargon.",
    educator:
      "You are a space weather briefer for educators and students. Read the list of active NOAA alerts below. " +
      "Group related alerts, highlight any escalating conditions, and explain the chain of cause and effect (solar flare → CME → geomagnetic storm). " +
      "In 2-3 sentences, summarise the current space weather and its potential observable effects, at a level suitable for a high‑school science class.",
    technical:
      "You are a space weather briefer for satellite operators and radio engineers. Read the list of active NOAA alerts below. " +
      "Deduplicate redundant alerts, rank by operational significance, and note any warnings that are new or escalating. " +
      "In 2-3 sentences, summarise the operational impacts: affected frequency bands, GNSS degradation risk, satellite drag, and radiation environment. Be concise and precise.",
  };

  return (
    `System: ${instructions[audience]}\n\n` +
    `Active NOAA space weather alerts:\n${joinedAlerts}\n\n` +
    `Briefing:`
  );
}
