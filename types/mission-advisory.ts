// types/mission-advisory.ts

export type MissionType =
  | "CubeSat Launch"
  | "HF Operation"
  | "Balloon Flight"
  | "Aurora Photography"
  | "Satellite Maintenance"
  | "Telescope Observation";

export type MissionVerdict = "GO" | "CONDITIONAL GO" | "NO GO";

export interface MissionAdvisory {
  missionType: MissionType;
  verdict: MissionVerdict;
  summary: string;
  earliestSafeWindow: string | null;
}

export interface MissionAdvisoryResponse {
  advisory: MissionAdvisory;
  generatedAt: string;
}
