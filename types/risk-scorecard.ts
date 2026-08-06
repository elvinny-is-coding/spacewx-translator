// types/risk-scorecard.ts

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type OperationalSystem =
  | "HF Communications"
  | "GNSS"
  | "LEO Satellite Drag"
  | "Power Grid"
  | "Polar Aviation";

export interface RiskAssessment {
  system: OperationalSystem;
  riskLevel: RiskLevel;
  recommendation: string;
}

export interface RiskScorecardResponse {
  assessments: RiskAssessment[];
  generatedAt: string;
}
