import {
  fetchKpIndex,
  fetchKpForecast,
  fetchSolarWind,
  fetchAlerts,
  fetchNoaaScales,
  fetchDonkiFlares,
  fetchDonkiCMEs,
} from "@/lib/spacewx/fetchers";
import {
  normalizeKp,
  normalizeKpForecast,
  normalizeSolarWind,
  normalizeAlerts,
  normalizeNoaaScaleG,
  normalizeFlares,
  normalizeCMEs,
} from "@/lib/spacewx/normalizers";
import type { SpaceWeatherData } from "@/types/spacewx";

export async function GET() {
  try {
    const [
      kpResult,
      forecastResult,
      solarWindResult,
      alertsResult,
      scaleResult,
      donkiFlareResult,
      donkiCMEResult,
    ] = await Promise.allSettled([
      fetchKpIndex(),
      fetchKpForecast(),
      fetchSolarWind(),
      fetchAlerts(),
      fetchNoaaScales(),
      fetchDonkiFlares(),
      fetchDonkiCMEs(),
    ]);

    const warnings: string[] = [];

    const getValue = <T>(
      result: PromiseSettledResult<T>,
      sourceName: string,
    ): T | null => {
      if (result.status === "fulfilled") {
        return result.value;
      }
      warnings.push(`${sourceName} data unavailable`);
      console.warn(`⚠ ${sourceName} fetch failed`);
      return null;
    };

    const rawKp = getValue(kpResult, "NOAA K-index");
    const rawForecast = getValue(forecastResult, "NOAA Kp forecast");
    const rawSolarWind = getValue(solarWindResult, "Solar wind");
    const rawAlerts = getValue(alertsResult, "NOAA alerts");
    const rawScales = getValue(scaleResult, "NOAA scales");
    const rawFlares = getValue(donkiFlareResult, "DONKI flares");
    const rawCMEs = getValue(donkiCMEResult, "DONKI CMEs");

    const data: SpaceWeatherData = {
      kp: rawKp !== null ? normalizeKp(rawKp) : null,
      kpForecast:
        rawForecast !== null ? normalizeKpForecast(rawForecast) : null,
      solarWind: normalizeSolarWind(rawSolarWind),
      alerts: rawAlerts !== null ? normalizeAlerts(rawAlerts) : [],
      flares: rawFlares !== null ? normalizeFlares(rawFlares) : [],
      cmes: rawCMEs !== null ? normalizeCMEs(rawCMEs) : [],
      noaaScaleG: rawScales !== null ? normalizeNoaaScaleG(rawScales) : null,
      lastUpdated: new Date().toISOString(),
      warnings,
    };

    if (
      data.kp === null &&
      data.alerts.length === 0 &&
      data.flares.length === 0 &&
      data.cmes.length === 0
    ) {
      return Response.json(
        { error: "All data sources are currently unavailable" },
        { status: 502 },
      );
    }

    return Response.json(data);
  } catch (error: any) {
    console.error("Space weather API error:", error);
    return Response.json(
      { error: error.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
