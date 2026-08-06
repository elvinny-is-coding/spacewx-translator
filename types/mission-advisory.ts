// types/mission-advisory.ts

export type MissionType =
  | "CubeSat Launch"
  | "HF Operation"
  | "Balloon Flight"
  | "Aurora Photography";

export type MissionVerdict = "GO" | "CONDITIONAL GO" | "NO GO";

export interface MissionAdvisory {
  missionType: MissionType;
  verdict: MissionVerdict;
  summary: string;
  earliestSafeWindow: string | null; // ISO timestamp or human-readable
}

export interface MissionAdvisoryResponse {
  advisory: MissionAdvisory;
  generatedAt: string;
}
