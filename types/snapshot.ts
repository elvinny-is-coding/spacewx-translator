export interface SpaceWeatherSnapshot {
  id: string;
  timestamp: string;
  kp: number | null;
  solar_wind_speed: number | null;
  solar_wind_bz: number | null;
  alert_count: number | null;
  raw_data: {
    flares: import("./spacewx").Flare[];
    cmes: import("./spacewx").CME[];
    alerts: import("./spacewx").Alert[];
  } | null;
}
