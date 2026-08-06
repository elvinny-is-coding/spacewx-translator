// lib/ai/postmortem-prompt.ts

import type { SpaceWeatherSnapshot } from "@/types/snapshot";
import type { TimelineEvent } from "@/types/timeline";

/**
 * Build a prompt that asks the AI to write a concise storm post‑mortem report.
 * The AI receives the Kp time‑series and any precursor flares/CMEs.
 */
export function buildStormPostmortemPrompt(
  snapshots: SpaceWeatherSnapshot[],
  precursorFlares: TimelineEvent[],
  precursorCMEs: TimelineEvent[],
): string {
  // Build a compact Kp time‑series
  const kpSeries = snapshots
    .filter((s) => s.kp !== null)
    .map((s) => `${s.timestamp.slice(0, 19)} Kp ${s.kp!.toFixed(1)}`)
    .join("; ");

  const flareList =
    precursorFlares.length > 0
      ? precursorFlares.map((f) => `${f.label} at ${f.time}`).join("; ")
      : "none";

  const cmeList =
    precursorCMEs.length > 0
      ? precursorCMEs.map((c) => `${c.label} at ${c.time}`).join("; ")
      : "none";

  return [
    "System: You are a space weather analyst. Write a 3‑4 paragraph incident report summarising a recent geomagnetic storm.",
    "",
    "Include:",
    "- Storm onset, peak Kp and time, and duration",
    "- The precursor chain: any flares or CMEs that likely triggered the storm",
    "- Operational impacts: HF radio, GNSS, satellite drag, power grid, aurora visibility",
    "- A short outlook or watch‑for note",
    "",
    "Use professional but accessible language. Write in full paragraphs, not bullet points.",
    "Return ONLY the report text, no JSON, no markdown fences.",
    "",
    "Data:",
    `Kp time‑series: ${kpSeries}`,
    `Precursor flares (up to 7 days before storm): ${flareList}`,
    `Precursor CMEs (up to 7 days before storm): ${cmeList}`,
  ].join("\n");
}
