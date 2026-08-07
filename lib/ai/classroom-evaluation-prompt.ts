// lib/ai/classroom-evaluation-prompt.ts

import type {
  MissionRole,
  ScenarioFixture,
  StudentChoice,
} from "@/types/classroom";

/**
 * Build a prompt that asks the AI to write a short evaluation narrative
 * comparing the student's choice to the deterministic verdict.
 * The AI explains *why* the correct answer is what it is, not whether
 * the student was "right" or "wrong."
 */
export function buildClassroomEvaluationPrompt(
  role: MissionRole,
  scenario: ScenarioFixture,
  studentChoice: string,
  deterministicVerdict: string,
  match: boolean,
): string {
  const roleDescriptions: Record<MissionRole, string> = {
    "Satellite Operator":
      "You are a satellite operator responsible for deciding whether to proceed with normal operations, enter safe mode, or delay a planned maneuver based on space weather conditions.",
    "Polar Flight Dispatcher":
      "You are an airline dispatcher deciding whether to route a flight via the polar corridor (saving fuel) or divert southward (safer, but more expensive) based on space weather conditions.",
    "Mission Planner":
      "You are a launch or deployment mission planner deciding whether conditions are safe to proceed with a scheduled launch or deployment.",
    "Ham Radio Operator":
      "You are an amateur radio operator deciding whether to operate during a contest or event, knowing space weather affects HF propagation.",
    "ISS EVA Planner":
      "You are an ISS mission planner deciding whether to proceed with a scheduled extravehicular activity (spacewalk) based on radiation and communication conditions.",
  };

  const roleDescription = roleDescriptions[role];

  const dataSummary = [
    `Kp index: ${scenario.snapshot.kp ?? "?"}`,
    `G-scale: G${scenario.snapshot.noaaScaleG ?? "?"}`,
    `R-scale: R${scenario.snapshot.noaaScaleR ?? "?"}`,
    `S-scale: S${scenario.snapshot.noaaScaleS ?? "?"}`,
    `Solar wind speed: ${scenario.snapshot.solarWindSpeed ?? "?"} km/s`,
    `Bz: ${scenario.snapshot.solarWindBz ?? "?"} nT`,
    `Flares: ${scenario.snapshot.flares.map((f) => f.classType).join(", ") || "none"}`,
    `CMEs: ${scenario.snapshot.cmes.length > 0 ? scenario.snapshot.cmes.map((c) => `${c.speed} km/s${c.note ? ` (${c.note})` : ""}`).join("; ") : "none"}`,
  ].join("\n");

  const historicalNote = scenario.historicalOutcome
    ? `\nHistorical outcome: ${scenario.historicalOutcome}`
    : "";

  return [
    `System: ${roleDescription}`,
    "",
    "You are evaluating a student's operational decision in a space weather scenario.",
    "",
    `Scenario: ${scenario.title} (${scenario.date})`,
    `Scenario description: ${scenario.description}`,
    "",
    "Space weather conditions at the time:",
    dataSummary,
    historicalNote,
    "",
    `The student chose: "${studentChoice}"`,
    `The correct operational recommendation based on deterministic NOAA scale analysis is: "${deterministicVerdict}"`,
    `The student's choice ${match ? "matches" : "does not match"} the deterministic recommendation.`,
    "",
    "Write a 3‑4 sentence evaluation that:",
    "- Explains WHY the deterministic recommendation is what it is, referencing specific scale values",
    "- If the student was correct, reinforces their reasoning",
    "- If the student was incorrect, explains what they may have missed and what the real‑world consequence could have been",
    "- Uses the historical outcome (if provided) to add context",
    "- Keeps a supportive, educational tone — this is a learning exercise, not a test",
    "- Does NOT simply say 'you were right' or 'you were wrong' — explain the reasoning",
    "",
    "Return ONLY the evaluation text, no JSON, no markdown, no bullet points.",
  ].join("\n");
}
