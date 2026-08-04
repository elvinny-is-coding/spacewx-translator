// lib/suggested-prompts.ts
import type { SpaceWeatherData } from "@/types/spacewx";
import type { Audience } from "@/types/audience";

/**
 * Return 2‑3 context‑aware follow‑up prompts for the given audience.
 * Prompts are ordered by relevance to the current conditions.
 */
export function getSuggestedPrompts(
  data: SpaceWeatherData,
  audience: Audience,
): string[] {
  const kp = data.kp ?? 0;
  const hasXFlare = data.flares.some((f) =>
    f.classType.toUpperCase().startsWith("X"),
  );
  const hasNotableFlare = data.flares.some((f) => {
    const m = f.classType.match(/^([CXM])(\d+\.?\d*)$/i);
    if (!m) return false;
    const letter = m[1].toUpperCase();
    const num = parseFloat(m[2]);
    return letter === "X" || (letter === "M" && num >= 5);
  });
  const hasProtonStorm = data.alerts.some((a) =>
    a.message.toLowerCase().includes("proton"),
  );
  const hasHighSolarWind = (data.solarWind?.speed ?? 0) > 500;
  const hasSouthwardBz = (data.solarWind?.bz ?? 0) < -5;
  const hasCME = data.cmes.length > 0;
  const alertCount = data.alerts.length;

  const prompts: string[] = [];

  // ── General ──────────────────────────────────────────
  if (audience === "general") {
    if (kp >= 5) {
      prompts.push("Will I be able to see the aurora tonight where I live?");
      prompts.push("Is this storm dangerous for people on the ground?");
    }
    if (hasXFlare) {
      prompts.push("What does an X‑class solar flare mean for me?");
    }
    if (hasProtonStorm) {
      prompts.push("Should I worry about radiation from the Sun right now?");
    }
    if (hasSouthwardBz) {
      prompts.push("What's happening with Earth's magnetic field right now?");
    }
    if (prompts.length < 2) {
      prompts.push("Where are the Northern Lights usually visible?");
      prompts.push("How often do solar storms happen?");
    }
  }

  // ── Educator ─────────────────────────────────────────
  if (audience === "educator") {
    if (hasXFlare && hasProtonStorm) {
      prompts.push(
        "Explain how an X‑class flare can trigger a radiation storm — what's the chain of events?",
      );
    } else if (hasNotableFlare) {
      prompts.push(
        "How would you explain the difference between C‑, M‑, and X‑class flares to a student?",
      );
    }
    if (kp >= 4 && hasSouthwardBz) {
      prompts.push(
        "Why does a southward‑pointing IMF make aurora more likely?",
      );
    }
    if (hasCME) {
      prompts.push(
        "How do scientists predict when a CME will arrive at Earth?",
      );
    }
    if (kp < 2 && !hasNotableFlare && !hasCME) {
      prompts.push(
        "What phase of the solar cycle are we in, and how does that affect space weather right now?",
      );
    }
    if (prompts.length < 2) {
      prompts.push(
        "What's a good classroom demonstration to explain the solar wind?",
      );
      prompts.push("How do space weather events affect astronauts on the ISS?");
    }
  }

  // ── Technical ─────────────────────────────────────────
  if (audience === "technical") {
    if (kp >= 5) {
      prompts.push(
        "What are the expected GNSS positioning errors during a G3+ storm?",
      );
    }
    if (hasSouthwardBz) {
      prompts.push(
        "What is the current Kp‑to‑G‑scale mapping, and what HF frequencies are affected?",
      );
    }
    if (hasHighSolarWind) {
      prompts.push(
        "What's the estimated satellite drag increase at this solar wind speed?",
      );
    }
    if (hasXFlare) {
      prompts.push(
        "What R‑scale blackout should I expect from this X‑class flare, and for how long?",
      );
    }
    if (hasProtonStorm) {
      prompts.push(
        "What is the current >10 MeV proton flux and how does it affect polar‑route aviation?",
      );
    }
    if (alertCount > 20) {
      prompts.push(
        "Summarize the active NOAA alerts by type — which are most operationally significant?",
      );
    }
    if (prompts.length < 2) {
      prompts.push(
        "What are the current Kp, G‑scale, R‑scale, and S‑scale values?",
      );
      prompts.push("How does the current solar wind Bz affect HF propagation?");
    }
  }

  // Return top 2‑3, avoid duplicates
  return [...new Set(prompts)].slice(0, 3);
}
