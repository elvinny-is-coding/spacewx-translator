// types/postmortem.ts

export interface StormReport {
  id: string;
  storm_start: string; // ISO timestamp
  storm_end: string; // ISO timestamp
  peak_kp: number | null;
  duration_hours: number | null;
  precursor_flares: { classType: string; time: string }[] | null;
  precursor_cmes: { speed: number; time: string }[] | null;
  report_text: string;
  generated_at: string;
}
