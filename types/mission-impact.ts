// types/mission-impact.ts

import type { MissionType } from "@/types/mission-advisory";

/** User‑defined tolerance level for go/no‑go decisions */
export type ToleranceLevel = "strict" | "moderate" | "flexible";

export interface MissionImpactRequest {
  /** The mission type (reused from the existing advisor) */
  missionType: MissionType;
  /** ISO timestamp for the planned mission window start */
  timeWindowStart: string;
  /** ISO timestamp for the planned mission window end */
  timeWindowEnd: string;
  /** Approximate altitude in km (optional, for LEO/GEO context) */
  altitudeKm?: number;
  /** User's risk tolerance */
  tolerance: ToleranceLevel;
}

export interface MissionRisk {
  /** Short label for the risk (e.g., "HF blackout") */
  name: string;
  /** Severity: low, medium, high, critical */
  severity: "low" | "medium" | "high" | "critical";
  /** One‑sentence description of the risk and its impact */
  description: string;
}

export interface MissionImpactResponse {
  /** Overall go/no‑go verdict */
  verdict: "GO" | "CONDITIONAL GO" | "NO GO";
  /** Confidence in the verdict (0.0 – 1.0) */
  confidence: number;
  /** Top risks identified for this mission profile */
  risks: MissionRisk[];
  /** Recommended mitigations (can be empty) */
  mitigations: string[];
  /** A note on what would change the verdict (e.g., "If Kp drops below 4") */
  changeCondition: string;
  /** Plain‑language summary of the assessment */
  summary: string;
  /** ISO timestamp of generation */
  generatedAt: string;
}
