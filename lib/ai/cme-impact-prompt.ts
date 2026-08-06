// lib/ai/cme-impact-prompt.ts

import type { SpaceWeatherData } from "@/types/spacewx";
import { severityFromKp } from "@/config/constants";

/**
 * Build a prompt that asks the AI to write a 2‑3 sentence narrative
 * describing the expected impact of a specific CME, given the current
 * space‑weather conditions.
 *
 * @param cmeSpeed    CME speed in km/s
 * @param halfAngle   CME half‑angle (degrees) or null
 * @param isEarthDirected Whether the CME is Earth‑directed
 * @param estArrival  Estimated arrival time as a human‑readable string
 * @param data        Current space‑weather data
 */
export function buildCmeImpactPrompt(
  cmeSpeed: number,
  halfAngle: number | null,
  isEarthDirected: boolean,
  estArrival: string,
  data: SpaceWeatherData,
): string {
  const kpInfo =
    data.kp !== null ? `Kp ${data.kp.toFixed(1)}` : "Kp unavailable";
  const { label: kpLabel } = severityFromKp(data.kp);
  const gScale =
    data.noaaScaleG !== null ? `G${data.noaaScaleG}` : "no G‑scale active";
  const windSpeed = data.solarWind?.speed ?? null;
  const bz = data.solarWind?.bz ?? null;
  const windInfo = windSpeed !== null ? `${windSpeed} km/s` : "unavailable";
  const bzInfo = bz !== null ? `${bz.toFixed(1)} nT` : "unavailable";

  const facts = [
    `CME speed: ${cmeSpeed} km/s`,
    halfAngle !== null
      ? `CME half-angle: ${halfAngle}°`
      : "CME half-angle: unknown",
    isEarthDirected
      ? "The CME is Earth-directed."
      : "The CME may have a glancing impact.",
    `Estimated arrival: ${estArrival}`,
    `Current Kp index: ${kpInfo} (${kpLabel})`,
    `Current G-scale: ${gScale}`,
    `Solar wind speed: ${windInfo}, Bz: ${bzInfo}`,
  ].join("\n");

  return [
    "System: You are a space weather analyst. Write 2‑3 concise, plain‑language sentences describing what operators and aurora chasers should expect from this CME impact.",
    "",
    "Mention:",
    "- The likely geomagnetic storm intensity if it arrives (G1–G5).",
    "- Whether aurora may be visible at lower latitudes.",
    "- Any operational concerns for HF radio, GNSS, or satellite drag.",
    "- Use phrases like 'estimated', 'may produce', 'likely to cause' to convey uncertainty.",
    "",
    "Return ONLY the narrative text, no JSON, no markdown, no bullet points.",
    "",
    "CME data:",
    facts,
  ].join("\n");
}
