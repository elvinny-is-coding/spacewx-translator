// types/hf-advisory.ts

export type BandName =
  | "160m"
  | "80m"
  | "60m"
  | "40m"
  | "30m"
  | "20m"
  | "17m"
  | "15m"
  | "12m"
  | "10m"
  | "6m"
  | "2m";

export type BandCondition = "good" | "fair" | "poor" | "closed";

export interface BandRecommendation {
  band: BandName;
  condition: BandCondition;
  recommendation: string;
}

export interface HfAdvisoryResponse {
  qth: string;
  target: string;
  bands: BandRecommendation[];
  summary: string;
  generatedAt: string;
}
