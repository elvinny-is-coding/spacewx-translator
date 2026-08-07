// types/classroom.ts

export type MissionRole =
  | "Satellite Operator"
  | "Polar Flight Dispatcher"
  | "Mission Planner"
  | "Ham Radio Operator"
  | "ISS EVA Planner";

export interface RoleConfig {
  id: MissionRole;
  label: string;
  icon: string; // emoji or icon name for display
  description: string;
  decisionPrompt: string; // the question the student answers
  choices: string[]; // possible choices (e.g., ["Proceed", "Delay", "Divert"])
}

export interface ScenarioSnapshot {
  kp: number | null;
  noaaScaleG: number | null;
  noaaScaleR: number | null;
  noaaScaleS: number | null;
  solarWindSpeed: number | null;
  solarWindBz: number | null;
  flares: { classType: string; beginTime: string }[];
  cmes: { speed: number | null; note: string | null; startTime: string }[];
}

export interface ScenarioFixture {
  id: string;
  title: string;
  date: string; // ISO date the scenario is based on
  description: string; // one‑line teaser
  snapshot: ScenarioSnapshot;
  deterministicVerdict: string; // computed once during fixture creation
  historicalOutcome?: string; // optional real‑world outcome
}

export interface StudentChoice {
  role: MissionRole;
  choice: string; // one of the role's defined choices
}

export interface Evaluation {
  role: MissionRole;
  scenarioId: string;
  studentChoice: string;
  deterministicVerdict: string;
  match: boolean;
  narrative: string; // AI‑generated explanation of why
  historicalOutcome?: string;
}
