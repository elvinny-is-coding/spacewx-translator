import StatusBar from "@/components/status-bar";
import AuroraGauge from "@/components/aurora-gauge";
import ClientMapSection from "@/components/client-map-section";
import DashboardClient from "@/components/dashboard-client";
import type { SpaceWeatherData } from "@/types/spacewx";
import { supabaseAdmin } from "@/lib/supabase/admin";

import {
  fetchKpIndex,
  fetchKpForecast,
  fetchSolarWindPlasma,
  fetchSolarWindMag,
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
  fallbackKpFromForecast,
} from "@/lib/spacewx/normalizers";

async function getSpaceWeather(): Promise<SpaceWeatherData> {
  const warnings: string[] = [];

  const getValue = <T,>(
    result: PromiseSettledResult<T>,
    sourceName: string,
  ): T | null => {
    if (result.status === "fulfilled" && result.value != null) {
      return result.value;
    }
    warnings.push(`${sourceName} data unavailable`);
    return null;
  };

  // Fetch live data (except alerts — those come from cache)
  const results = await Promise.allSettled([
    fetchKpIndex(),
    fetchKpForecast(),
    fetchSolarWindPlasma(),
    fetchSolarWindMag(),
    fetchNoaaScales(),
    fetchDonkiFlares(),
    fetchDonkiCMEs(),
  ]);

  const rawKp = getValue(results[0], "NOAA K-index");
  const rawForecast = getValue(results[1], "NOAA Kp forecast");
  const rawPlasma = getValue(results[2], "Solar wind plasma");
  const rawMag = getValue(results[3], "Solar wind magnetic field");
  const rawScales = getValue(results[4], "NOAA scales");
  const rawFlares = getValue(results[5], "DONKI flares");
  const rawCMEs = getValue(results[6], "DONKI CMEs");

  // Fetch alerts from Supabase cache (fallback to empty)
  let alerts: SpaceWeatherData["alerts"] = [];
  try {
    const { data: cachedAlerts, error } = await supabaseAdmin
      .from("latest_alerts")
      .select("alerts")
      .eq("id", 1)
      .single();

    if (!error && cachedAlerts?.alerts) {
      alerts = cachedAlerts.alerts;
    }
  } catch {
    warnings.push("NOAA alerts cache unavailable");
  }

  let currentKp = rawKp !== null ? normalizeKp(rawKp) : null;
  const forecast =
    rawForecast !== null ? normalizeKpForecast(rawForecast) : null;

  if (currentKp === null) {
    currentKp = fallbackKpFromForecast(forecast);
    if (currentKp !== null) {
      warnings.push("Using forecast Kp (real-time index unavailable)");
    }
  }

  return {
    kp: currentKp,
    kpForecast: forecast,
    solarWind: normalizeSolarWind(rawPlasma, rawMag),
    alerts,
    flares: rawFlares !== null ? normalizeFlares(rawFlares) : [],
    cmes: rawCMEs !== null ? normalizeCMEs(rawCMEs) : [],
    noaaScaleG: rawScales !== null ? normalizeNoaaScaleG(rawScales) : null,
    lastUpdated: new Date().toISOString(),
    warnings,
  };
}

export default async function HomePage() {
  const data = await getSpaceWeather();

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <StatusBar
        lastUpdated={data.lastUpdated}
        warnings={data.warnings}
        kp={data.kp}
      />

      <section className="space-y-2 text-center">
        <h2 className="font-display text-2xl text-starlight">
          Current Space Weather
        </h2>
        <p className="text-sm text-faint-star">
          The Kp index shows how disturbed Earth’s magnetic field is right now.
          Higher values mean brighter aurora and possible effects on satellites,
          power grids, and radio signals.
        </p>
      </section>

      <section className="flex justify-center">
        <AuroraGauge kp={data.kp} />
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="font-display text-2xl text-starlight">
            Where Can You See the Aurora?
          </h2>
          <p className="text-sm text-faint-star">
            Tap anywhere on the map or use your location to see if the aurora
            might be visible near you right now.
          </p>
        </div>
        <ClientMapSection kpForecast={data.kpForecast} />
      </section>

      <DashboardClient data={data} />
    </main>
  );
}
