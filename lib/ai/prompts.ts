import type { SpaceWeatherData } from "@/types/spacewx";
import type { Audience } from "@/types/audience";
import { severityFromKp } from "@/config/constants";

// ── Shared audience personas (single source of truth) ──

const AUDIENCE_PERSONA: Record<Audience, string> = {
  general: "a friendly space weather guide writing for the general public",
  educator:
    "a space weather educator writing for a high-school or undergraduate science class",
  technical:
    "a space weather analyst writing an operational brief for satellite operators, pilots, and radio engineers",
};

// ── Legacy prompt (kept only as a fallback if structured input isn't available) ──

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
      "Explain current conditions in 2-3 simple sentences a non-scientist can understand. Mention if aurora might be visible and where. Use analogies if helpful. Do not invent data.",
    educator:
      "Explain current conditions in 2-3 sentences suitable for a science class. Include the scientific cause (e.g., CME, solar wind, Bz) and potential observable effects. Be accurate but engaging.",
    technical:
      "Provide a concise 2-3 sentence technical summary. Include Kp, G-scale, solar wind speed, Bz if available, and any active alerts. Mention potential impacts on HF communications, GNSS, or satellite operations. Be precise; do not embellish.",
  };

  return `System: You are ${AUDIENCE_PERSONA[audience]}. ${instructions[audience]}\n\nCurrent space weather data:\n${dataBlock}${warningsText}\n\nSummary:`;
}

// ── Structured input for the daily briefing ──

export interface NotableEvent {
  /** e.g. "X1.3" for a flare, or a short CME description */
  label: string;
  time: string;
}

export interface DailyBriefingInput {
  kp: number | null;
  gScale: number | null; // Geomagnetic storm scale
  rScale: number | null; // Radio blackout scale
  sScale: number | null; // Solar radiation storm scale
  solarWindSpeed: number | null;
  solarWindBz: number | null;
  /** Only notable flares: M5+ and X-class, with time and class */
  notableFlares: NotableEvent[];
  /** Count of all other (background) flares */
  backgroundFlareCount: number;
  /** Notable CMEs: fast (>800 km/s) or explicitly Earth-directed */
  notableCMEs: NotableEvent[];
  /** Count of all other (background) CMEs */
  backgroundCMECount: number;
  /** Pre-synthesized active alert context (NOAA scales + alert text), not raw messages */
  alertSummary: string;
}

// ── Shared guardrails, applied to every audience ──

export const COMMON_GUIDANCE = `
IMPORTANT RULES:
- If an X-class flare is present, NEVER say "no significant impacts" — it causes HF blackouts.
- If S-scale >= 1, mention the radiation storm and its effects on polar-route aviation / high-latitude HF.
- If G-scale >= 1, mention the geomagnetic storm and possible aurora / satellite drag.
- If R-scale >= 1, mention the radio blackout and affected frequency bands / regions (sunlit side).
- If a notable (fast or Earth-directed) CME is present, mention it and note that geomagnetic effects may arrive in 1-3 days.
- Reconcile apparently contradictory facts explicitly — e.g., quiet Kp but an active radiation storm are different physical phenomena; say so.
- Only state facts present in the data below. Do not invent numbers, times, or effects not listed.
- Do NOT list raw data verbatim; synthesize meaning.
`.trim();

function formatFactBlock(input: DailyBriefingInput): string {
  const parts: string[] = [];

  if (input.kp !== null) parts.push(`Kp: ${input.kp.toFixed(1)}`);
  if (input.gScale !== null) parts.push(`G-scale: G${input.gScale}`);
  if (input.rScale !== null) parts.push(`R-scale: R${input.rScale}`);
  if (input.sScale !== null) parts.push(`S-scale: S${input.sScale}`);

  const windParts: string[] = [];
  windParts.push(
    input.solarWindSpeed !== null
      ? `${input.solarWindSpeed} km/s`
      : "speed unavailable",
  );
  windParts.push(
    input.solarWindBz !== null
      ? `Bz ${input.solarWindBz} nT`
      : "Bz unavailable",
  );
  parts.push(`Solar wind: ${windParts.join(", ")}`);

  if (input.notableFlares.length > 0) {
    parts.push(
      `Notable flares: ${input.notableFlares.map((f) => `${f.label} at ${f.time}`).join(", ")}`,
    );
  }
  parts.push(`Background flares: ${input.backgroundFlareCount} (C/M<5)`);

  if (input.notableCMEs.length > 0) {
    parts.push(
      `Notable CMEs: ${input.notableCMEs.map((c) => `${c.label} at ${c.time}`).join(", ")}`,
    );
  }
  parts.push(`Background CMEs: ${input.backgroundCMECount}`);

  parts.push(`Alert context: ${input.alertSummary}`);

  return parts.join("\n");
}

export function buildDailyBriefingPrompt(
  audience: Audience,
  input: DailyBriefingInput,
): string {
  const factBlock = formatFactBlock(input);

  const taskInstructions: Record<Audience, string> = {
    general:
      "Based on the facts below, write 3-4 sentences (max ~80 words) in plain, friendly language. " +
      "Mention if aurora might be visible anywhere unusual. Highlight any real-world impacts (GPS, power, flights) simply. " +
      "If there's an active radiation storm despite quiet geomagnetic activity, explain that these are different things.",

    educator:
      "Based on the facts below, write a 3-4 sentence briefing (max ~100 words) suitable for a science class. " +
      "Pick the single most pedagogically interesting event of the day (e.g., an X-class flare, a radiation storm, or a contrast between quiet Kp and active Sun) " +
      "and build a short explanation around it, ending with a discussion question for students. " +
      "Use the flare class logarithmic scale (C/M/X, 10x between letters) as a hook if notable flares are present. " +
      "Do not simply list data; create a mini-lesson.",

    technical:
      "Based on the facts below, produce a structured operational brief (max ~120 words total) with these sections: " +
      "1) Geomagnetic (Kp/G-scale) - impacts on GNSS, satellite drag. " +
      "2) Solar wind - notable speed/Bz. " +
      "3) Flare activity - significant flares and expected R-scale blackouts. " +
      "4) Radiation environment - S-scale, polar-route aviation, single-event-upset risk. " +
      "Reconcile all active scales and the flare/CME list against the quoted Kp. Be concise and precise.",
  };

  const system = `You are ${AUDIENCE_PERSONA[audience]}.\n\n${taskInstructions[audience]}\n\n${COMMON_GUIDANCE}`;

  return `System: ${system}\n\nFacts:\n${factBlock}\n\nBriefing:`;
}

// ── Alert triage prompt (for the raw-alert-list path, if still used independently) ──

export function buildAlertTriagePrompt(
  audience: Audience,
  alertMessages: string[],
): string {
  const joinedAlerts = alertMessages
    .slice(0, 30)
    .map((msg, i) => `[Alert ${i + 1}] ${msg.slice(0, 300)}`)
    .join("\n---\n");

  const taskInstructions: Record<Audience, string> = {
    general:
      "Read the list of active NOAA alerts below. Group related or redundant alerts and ignore minor, purely technical ones. " +
      "In 2-3 short sentences, explain what is currently happening, whether it might affect things like satellite TV, GPS, or power grids, " +
      "and if aurora might be visible somewhere unusual. Use plain, friendly language, no jargon.",
    educator:
      "Read the list of active NOAA alerts below. Group related alerts, highlight any escalating conditions, and explain the chain of cause and effect " +
      "(solar flare -> CME -> geomagnetic storm) where relevant. In 2-3 sentences, summarize the current space weather and its potential observable effects, " +
      "at a level suitable for a high-school science class.",
    technical:
      "Read the list of active NOAA alerts below. Deduplicate redundant alerts, rank by operational significance, and note any warnings that are new or escalating. " +
      "In 2-3 sentences, summarize the operational impacts: affected frequency bands, GNSS degradation risk, satellite drag, and radiation environment. Be concise and precise.",
  };

  const system = `You are ${AUDIENCE_PERSONA[audience]}.\n\n${taskInstructions[audience]}\n\n${COMMON_GUIDANCE}`;

  return `System: ${system}\n\nActive NOAA space weather alerts:\n${joinedAlerts}\n\nBriefing:`;
}
