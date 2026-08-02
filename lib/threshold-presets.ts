import type { ThresholdParameter, ThresholdOperator } from "@/types/threshold";

export interface PresetThreshold {
  parameter: ThresholdParameter;
  operator: ThresholdOperator;
  value: number;
  label: string;
  description: string;
}

export const THRESHOLD_PRESETS: PresetThreshold[] = [
  // ── Kp ──
  {
    parameter: "kp",
    operator: ">=",
    value: 5,
    label: "Active geomagnetic storm (G1)",
    description:
      "Kp ≥ 5 indicates a minor geomagnetic storm. Aurora may become visible at higher latitudes (e.g., Scotland, southern Scandinavia). Satellite operations can experience minor anomalies.",
  },
  {
    parameter: "kp",
    operator: ">=",
    value: 7,
    label: "Strong storm (G3)",
    description:
      "Kp ≥ 7 means a strong geomagnetic storm. Aurora likely visible at mid-latitudes (e.g., northern US, central Europe). Possible power grid voltage corrections and satellite navigation errors.",
  },
  {
    parameter: "kp",
    operator: ">=",
    value: 8,
    label: "Severe storm (G4)",
    description:
      "Kp ≥ 8 indicates a severe storm. Aurora may be seen as far south as Texas or Italy. Widespread voltage control problems, HF radio blackouts, and increased satellite drag.",
  },
  {
    parameter: "kp",
    operator: ">=",
    value: 9,
    label: "Extreme storm (G5)",
    description:
      "Kp = 9 is the highest category. Aurora could be visible near the equator. Power grid instability, complete HF radio blackouts, and satellite navigation errors may occur for days.",
  },

  // ── Solar Wind Speed ──
  {
    parameter: "solarWindSpeed",
    operator: ">=",
    value: 500,
    label: "High solar wind speed",
    description:
      "Solar wind speed ≥ 500 km/s is elevated and often associated with coronal hole high-speed streams. Sustained high speed can cause prolonged geomagnetic activity and aurora.",
  },
  {
    parameter: "solarWindSpeed",
    operator: ">=",
    value: 700,
    label: "Very high solar wind speed",
    description:
      "Speeds above 700 km/s are rare and typically linked to CME arrivals. Expect strong geomagnetic storms and increased risk to satellite electronics and HF communications.",
  },

  // ── Bz (IMF) ──
  {
    parameter: "solarWindBz",
    operator: "<=",
    value: -10,
    label: "Strong southward IMF",
    description:
      "Bz ≤ -10 nT means the interplanetary magnetic field is strongly southward, coupling efficiently with Earth's magnetosphere. This is excellent for aurora viewing but increases the risk of satellite and power grid anomalies.",
  },
  {
    parameter: "solarWindBz",
    operator: "<=",
    value: -20,
    label: "Extreme southward IMF",
    description:
      "Bz ≤ -20 nT is rare and extremely geoeffective. Combined with high speed, it can produce severe storms. Expect bright aurora, possible GPS degradation, and power grid disruptions.",
  },
];
