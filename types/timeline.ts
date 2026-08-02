export type TimelineEventSource = "donki" | "supabase";

export type TimelineEventType =
  | "flare"
  | "cme"
  | "geomagnetic_storm"
  | "radiation_storm"
  | "alert"
  | "kp_spike";

export interface TimelineEvent {
  id: string;
  source: TimelineEventSource;
  type: TimelineEventType;
  time: string; // ISO timestamp for sorting and display
  label: string; // short human‑readable title
  description: string; // 1–2 sentence explanation
  color: string; // tailwind color token name (e.g., "solar-amber")
  raw: Record<string, unknown> | null; // original data for future use
}
