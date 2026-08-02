export interface OvationData {
  /** ISO‑formatted forecast time from NOAA */
  "Forecast Time": string;
  /** Flat array of triples: [longitude, latitude, probability] (0‑100) */
  coordinates: [number, number, number][];
}

export interface OvationGrid {
  /** 360 columns (longitude 0‑359) */
  cols: number;
  /** 181 rows (latitude 90 to -90) */
  rows: number;
  /** 2D array of probability values (rows × cols), column‑major order */
  grid: number[][];
  /** The original forecast time */
  forecastTime: string;
}
