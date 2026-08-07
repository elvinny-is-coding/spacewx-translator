// types/anomaly-readiness.ts

export type Subsystem =
  | "GNSS"
  | "Star Tracker"
  | "Communications"
  | "Satellite Drag"
  | "Radiation SEU";

export type ReadinessLevel = "low" | "medium" | "high" | "critical";

export interface ReadinessAssessment {
  subsystem: Subsystem;
  level: ReadinessLevel;
  driver: string; // e.g., "Kp 5.2", "S2 radiation storm"
  recommendation: string; // AI‑generated one‑liner
}

export interface ReadinessResponse {
  assessments: ReadinessAssessment[];
  generatedAt: string;
}
