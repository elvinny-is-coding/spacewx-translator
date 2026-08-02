export type ThresholdParameter = "kp" | "solarWindSpeed" | "solarWindBz";

export type ThresholdOperator = ">" | "<" | ">=" | "<=" | "=";

export interface Threshold {
  id: string;
  parameter: ThresholdParameter;
  operator: ThresholdOperator;
  value: number;
  label?: string; // optional user‑friendly name
}

export interface ThresholdAlert {
  threshold: Threshold;
  currentValue: number;
  message: string;
}
