import type {
  ForecastPoint,
  SolarWind,
  Flare,
  CME,
  Alert,
} from "@/types/spacewx";

export function normalizeKp(raw: unknown): number | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const latest = raw[raw.length - 1] as Record<string, unknown> | undefined;
  if (!latest || typeof latest !== "object") return null;
  const kp = parseFloat(String(latest.Kp ?? ""));
  return Number.isFinite(kp) ? kp : null;
}

export function normalizeKpForecast(raw: unknown): ForecastPoint[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const points: ForecastPoint[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const obj = item as Record<string, unknown>;
    const time = String(obj.time_tag ?? "");
    const kp = parseFloat(String(obj.kp ?? obj.Kp ?? ""));
    if (!time || !Number.isFinite(kp)) continue;
    points.push({ time, kp });
  }
  return points.length > 0 ? points : null;
}

/**
 * Merges two NOAA RTSW solar wind products.
 * `plasmaRaw` – array from rtsw_wind_1m.json  (time_tag, proton_speed, proton_density, …)
 * `magRaw`    – array from rtsw_mag_1m.json   (time_tag, bz_gsm, bt, …)
 * Returns the latest proton speed and Bz (GSM).
 */
export function normalizeSolarWind(
  plasmaRaw: unknown,
  magRaw: unknown,
): SolarWind | null {
  let speed: number | null = null;
  let bz: number | null = null;

  // Extract speed from wind array
  if (Array.isArray(plasmaRaw) && plasmaRaw.length > 0) {
    const latest = plasmaRaw[plasmaRaw.length - 1] as
      | Record<string, unknown>
      | undefined;
    if (latest && typeof latest === "object") {
      const s = parseFloat(String(latest.proton_speed ?? latest.speed ?? ""));
      if (Number.isFinite(s)) speed = s;
    }
  }

  // Extract Bz from magnetic field array
  if (Array.isArray(magRaw) && magRaw.length > 0) {
    const latest = magRaw[magRaw.length - 1] as
      | Record<string, unknown>
      | undefined;
    if (latest && typeof latest === "object") {
      const b = parseFloat(String(latest.bz_gsm ?? latest.bz ?? ""));
      if (Number.isFinite(b)) bz = b;
    }
  }

  if (speed === null && bz === null) return null;
  return { speed, bz };
}

export function fallbackKpFromForecast(
  forecast: ForecastPoint[] | null,
): number | null {
  if (!forecast || forecast.length === 0) return null;
  return forecast[0].kp;
}

export function normalizeAlerts(raw: unknown): Alert[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item: any) => ({
      id: item?.product_id ?? "",
      productId: item?.product_id ?? "",
      issueTime: item?.issue_datetime ?? "",
      message: item?.message ?? "",
    }))
    .filter((a) => a.id !== "");
}

export function normalizeNoaaScaleG(raw: unknown): number | null {
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, any>;
  if (!obj.G || obj.G.Scale === undefined) return null;
  const scale = parseInt(obj.G.Scale, 10);
  return Number.isFinite(scale) ? scale : null;
}

export function normalizeFlares(raw: unknown): Flare[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item: any) => ({
    id: item?.flrID ?? "",
    classType: item?.classType ?? "",
    beginTime: item?.beginTime ?? "",
    peakTime: item?.peakTime ?? "",
    endTime: item?.endTime ?? null,
    sourceLocation: item?.sourceLocation ?? null,
    activeRegionNum: item?.activeRegionNum ?? null,
  }));
}

export function normalizeCMEs(raw: unknown): CME[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item: any) => ({
    id: item?.activityID ?? "",
    startTime: item?.startTime ?? "",
    speed: parseFloat(item?.speed) || null,
    halfAngle: parseFloat(item?.halfAngle) || null,
    note: item?.note ?? null,
    instruments: item?.instruments
      ? Array.isArray(item.instruments)
        ? item.instruments
            .map((inst: any) => inst?.displayName ?? "")
            .filter(Boolean)
        : null
      : null,
  }));
}
