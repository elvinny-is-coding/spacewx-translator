export interface ForecastPoint {
  time: string; // ISO 8601 or NOAA’s own time format
  kp: number;
}

export interface SolarWind {
  speed: number | null;
  bz: number | null;
}

export interface Flare {
  id: string;
  classType: string; // e.g. "X1.2"
  beginTime: string;
  peakTime: string;
  endTime: string | null;
  sourceLocation: string | null;
  activeRegionNum: number | null;
}

export interface CME {
  id: string;
  startTime: string;
  speed: number | null; // km/s
  halfAngle: number | null;
  note: string | null;
  instruments: string[] | null;
}

export interface Alert {
  id: string;
  productId: string;
  issueTime: string;
  message: string;
}

export interface SpaceWeatherData {
  /** Planetary K-index (current) – null if unavailable */
  kp: number | null;
  /** Array of forecast Kp points – null if unavailable */
  kpForecast: ForecastPoint[] | null;
  /** Solar wind plasma (speed + Bz) – null if unavailable */
  solarWind: SolarWind | null;
  /** Active alerts / watches / warnings */
  alerts: Alert[];
  /** Flare list from DONKI – empty if fetch failed or none */
  flares: Flare[];
  /** CME list from DONKI – empty if fetch failed or none */
  cmes: CME[];
  /** NOAA G-scale (1–5) – null if unavailable */
  noaaScaleG: number | null;
  /** ISO timestamp of when this object was assembled */
  lastUpdated: string;
  /** Human-readable warnings about missing data sources */
  warnings: string[];
}
