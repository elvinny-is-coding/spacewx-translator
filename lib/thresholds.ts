import type {
  Threshold,
  ThresholdAlert,
  ThresholdOperator,
} from "@/types/threshold";
import type { SpaceWeatherData } from "@/types/spacewx";

const STORAGE_KEY = "spacewx-thresholds";

/** Generate a simple unique id (no crypto required). */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Create a new threshold with a generated id. */
export function createThreshold(
  parameter: Threshold["parameter"],
  operator: Threshold["operator"],
  value: number,
  label?: string,
): Threshold {
  return { id: generateId(), parameter, operator, value, label };
}

/** Validate a threshold. Returns null if valid, else error message. */
export function validateThreshold(t: Threshold): string | null {
  if (t.value == null || !Number.isFinite(t.value))
    return "Value must be a finite number.";
  if (t.parameter === "kp" && (t.value < 0 || t.value > 9))
    return "Kp must be between 0 and 9.";
  if (t.parameter === "solarWindSpeed" && t.value < 0)
    return "Speed cannot be negative.";
  if (!["kp", "solarWindSpeed", "solarWindBz"].includes(t.parameter))
    return "Invalid parameter.";
  if (![">", "<", ">=", "<=", "="].includes(t.operator))
    return "Invalid operator.";
  return null;
}

/** Load thresholds from localStorage. Returns an empty array if none or corrupted. */
export function loadThresholds(): Threshold[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Filter out obviously malformed entries
    return parsed.filter(
      (t: any) =>
        typeof t.id === "string" &&
        typeof t.parameter === "string" &&
        typeof t.operator === "string" &&
        typeof t.value === "number",
    );
  } catch {
    return [];
  }
}

/** Save thresholds to localStorage. */
export function saveThresholds(thresholds: Threshold[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(thresholds));
}

/** Evaluate all thresholds against current space weather data.
 *  Returns an array of breached threshold alerts.
 */
export function evaluateThresholds(
  thresholds: Threshold[],
  data: SpaceWeatherData,
): ThresholdAlert[] {
  const alerts: ThresholdAlert[] = [];

  for (const t of thresholds) {
    let currentValue: number | null = null;
    switch (t.parameter) {
      case "kp":
        currentValue = data.kp;
        break;
      case "solarWindSpeed":
        currentValue = data.solarWind?.speed ?? null;
        break;
      case "solarWindBz":
        currentValue = data.solarWind?.bz ?? null;
        break;
    }

    if (currentValue === null) continue; // can't evaluate without data

    const breached = checkCondition(currentValue, t.operator, t.value);
    if (breached) {
      const label = t.label || `${t.parameter} ${t.operator} ${t.value}`;
      alerts.push({
        threshold: t,
        currentValue,
        message: `${label} (currently ${currentValue})`,
      });
    }
  }

  return alerts;
}

function checkCondition(a: number, op: ThresholdOperator, b: number): boolean {
  switch (op) {
    case ">":
      return a > b;
    case "<":
      return a < b;
    case ">=":
      return a >= b;
    case "<=":
      return a <= b;
    case "=":
      return a === b;
    default:
      return false;
  }
}
