// types/hf-advisory.ts

export type BandRange = "10-15m" | "17-20m" | "30-40m" | "60-80m" | "160m+";

export type BandStatus = "good" | "fair" | "poor" | "blackout";

export interface BandRecommendation {
  range: BandRange;
  status: BandStatus;
  driver?: string;
  note: string;
}

export interface HfAdvisoryResponse {
  qth: string;
  target: string;
  bands: BandRecommendation[];
  summary: string;
  generatedAt: string;
}
