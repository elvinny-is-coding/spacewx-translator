import {
  NOAA_KP_INDEX,
  NOAA_KP_FORECAST,
  NOAA_SOLAR_WIND_PLASMA,
  NOAA_SOLAR_WIND_MAG,
  NOAA_ALERTS,
  NOAA_SCALES,
  NASA_DONKI_BASE,
  NASA_API_KEY,
} from "@/config/constants";

async function fetchJSON(url: string, timeoutMs = 8000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} fetching ${url}`);
    }
    const data = await res.json();
    if (data === undefined || data === null) {
      throw new Error(`Empty response from ${url}`);
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

async function safeFetchJSON(
  url: string,
  timeoutMs = 5000,
): Promise<any | null> {
  try {
    return await fetchJSON(url, timeoutMs);
  } catch {
    return null;
  }
}

export async function fetchKpIndex(): Promise<any[]> {
  return fetchJSON(NOAA_KP_INDEX, 5000);
}

export async function fetchKpForecast(): Promise<any[]> {
  return fetchJSON(NOAA_KP_FORECAST, 5000);
}

export async function fetchSolarWindPlasma(): Promise<any[]> {
  return fetchJSON(NOAA_SOLAR_WIND_PLASMA, 5000);
}

export async function fetchSolarWindMag(): Promise<any[]> {
  return fetchJSON(NOAA_SOLAR_WIND_MAG, 5000);
}

export async function fetchAlerts(): Promise<any[]> {
  return fetchJSON(NOAA_ALERTS, 5000);
}

export async function fetchNoaaScales(): Promise<any> {
  return fetchJSON(NOAA_SCALES, 5000);
}

export async function fetchDonkiFlares(): Promise<any[] | null> {
  const url = `${NASA_DONKI_BASE}/FLR?api_key=${NASA_API_KEY}`;
  return safeFetchJSON(url, 5000);
}

export async function fetchDonkiCMEs(): Promise<any[] | null> {
  const url = `${NASA_DONKI_BASE}/CME?api_key=${NASA_API_KEY}`;
  return safeFetchJSON(url, 5000);
}
