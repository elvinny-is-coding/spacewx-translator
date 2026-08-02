import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  fetchKpIndex,
  fetchKpForecast,
  fetchSolarWindPlasma,
  fetchSolarWindMag,
  fetchAlerts,
  fetchNoaaScales,
} from "@/lib/spacewx/fetchers";
import {
  normalizeKp,
  normalizeKpForecast,
  normalizeSolarWind,
  normalizeAlerts,
  normalizeNoaaScaleG,
} from "@/lib/spacewx/normalizers";

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const warnings: string[] = [];

  try {
    const results = await Promise.allSettled([
      fetchKpIndex(),
      fetchKpForecast(),
      fetchSolarWindPlasma(),
      fetchSolarWindMag(),
      fetchAlerts(),
      fetchNoaaScales(),
    ]);

    const get = <T>(r: PromiseSettledResult<T>, name: string): T | null => {
      if (r.status === "fulfilled" && r.value != null) return r.value;
      warnings.push(`${name} unavailable`);
      return null;
    };

    const rawKp = get(results[0], "NOAA K-index");
    const rawForecast = get(results[1], "NOAA Kp forecast");
    const rawPlasma = get(results[2], "Solar wind plasma");
    const rawMag = get(results[3], "Solar wind magnetic field");
    const rawAlerts = get(results[4], "NOAA alerts");
    const rawScales = get(results[5], "NOAA scales");

    const kp = rawKp !== null ? normalizeKp(rawKp) : null;
    const forecast =
      rawForecast !== null ? normalizeKpForecast(rawForecast) : null;
    const solarWind = normalizeSolarWind(rawPlasma, rawMag);
    const alerts = rawAlerts !== null ? normalizeAlerts(rawAlerts) : [];

    if (kp === null && !solarWind && alerts.length === 0) {
      return NextResponse.json(
        { error: "All data sources unavailable", warnings },
        { status: 500 },
      );
    }

    const { error: insertError } = await supabaseAdmin
      .from("space_weather_snapshots")
      .insert({
        kp,
        solar_wind_speed: solarWind?.speed ?? null,
        solar_wind_bz: solarWind?.bz ?? null,
        alert_count: alerts.length,
        raw_data: {
          flares: [],
          cmes: [],
          alerts,
        },
      });

    if (insertError) {
      console.error("Snapshot insert error:", insertError);
      return NextResponse.json(
        {
          error: "Failed to store snapshot",
          detail: insertError.message,
          hint: insertError.hint,
          code: insertError.code,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ status: "ok", warnings });
  } catch (err: any) {
    console.error("Cron snapshot error:", err);
    return NextResponse.json(
      {
        error: "Internal server error",
        detail: err.message ?? "Unknown error",
      },
      { status: 500 },
    );
  }
}
