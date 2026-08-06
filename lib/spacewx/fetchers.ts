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
import { TIMEOUTS } from "@/lib/timeouts";

interface RetryConfig {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableStatuses?: number[];
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  config: RetryConfig = {},
): Promise<Response> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | null = null;
  let delay = finalConfig.initialDelayMs;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: options.signal || AbortSignal.timeout(8000),
      });

      // Don't retry on success or non-retryable errors
      if (
        response.ok ||
        !finalConfig.retryableStatuses.includes(response.status)
      ) {
        return response;
      }

      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);

      if (attempt < finalConfig.maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(
          delay * finalConfig.backoffMultiplier,
          finalConfig.maxDelayMs,
        );
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < finalConfig.maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(
          delay * finalConfig.backoffMultiplier,
          finalConfig.maxDelayMs,
        );
      }
    }
  }

  throw lastError || new Error("Max retries exceeded");
}

async function fetchJSON(url: string, timeoutMs = 8000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetchWithRetry(url, { signal: controller.signal });
    clearTimeout(timer);

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
  return fetchJSON(NOAA_KP_INDEX, TIMEOUTS.NOAA_KP_INDEX);
}

export async function fetchKpForecast(): Promise<any[]> {
  return fetchJSON(NOAA_KP_FORECAST, TIMEOUTS.NOAA_KP_FORECAST);
}

export async function fetchSolarWindPlasma(): Promise<any[]> {
  return fetchJSON(NOAA_SOLAR_WIND_PLASMA, TIMEOUTS.NOAA_SOLAR_WIND);
}

export async function fetchSolarWindMag(): Promise<any[]> {
  return fetchJSON(NOAA_SOLAR_WIND_MAG, TIMEOUTS.NOAA_SOLAR_WIND);
}

export async function fetchAlerts(): Promise<any[]> {
  return fetchJSON(NOAA_ALERTS, TIMEOUTS.NOAA_ALERTS);
}

export async function fetchNoaaScales(): Promise<any> {
  return fetchJSON(NOAA_SCALES, TIMEOUTS.NOAA_SCALES);
}

export async function fetchDonkiFlares(): Promise<any[] | null> {
  const url = `${NASA_DONKI_BASE}/FLR?api_key=${NASA_API_KEY}`;
  return safeFetchJSON(url, TIMEOUTS.NASA_DONKI);
}

export async function fetchDonkiCMEs(): Promise<any[] | null> {
  const url = `${NASA_DONKI_BASE}/CME?api_key=${NASA_API_KEY}`;
  return safeFetchJSON(url, TIMEOUTS.NASA_DONKI);
}

const NOAA_OVATION =
  "https://services.swpc.noaa.gov/json/ovation_aurora_latest.json";

export async function fetchOvation(): Promise<any> {
  return fetchJSON(NOAA_OVATION, TIMEOUTS.OVATION);
}
