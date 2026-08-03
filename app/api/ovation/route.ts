import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("latest_ovation")
      .select("grid, forecast_time")
      .eq("id", 1)
      .single();

    if (error) {
      // Previously this was folded into the same branch as "no row yet",
      // so a broken query and a genuinely empty table looked identical
      // in logs and to the client. Log it and surface a real error
      // status so callers (and uptime checks) can tell the difference.
      console.error("GET /api/ovation — Supabase error:", error);
      return NextResponse.json(
        {
          grid: null,
          forecastTime: null,
          error: "Failed to fetch aurora data",
        },
        { status: 502 },
      );
    }

    if (!data) {
      // No row yet (e.g. the ingest job hasn't run) — not an error.
      return NextResponse.json({ grid: null, forecastTime: null });
    }

    return NextResponse.json(
      {
        grid: data.grid,
        forecastTime: data.forecast_time,
      },
      {
        // OVATION only refreshes every few minutes at most; let the CDN
        // absorb repeat requests instead of hitting Supabase every time.
        headers: {
          "Cache-Control": "s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (err: any) {
    console.error("GET /api/ovation — unexpected error:", err);
    return NextResponse.json(
      { grid: null, forecastTime: null, error: "Unexpected server error" },
      { status: 500 },
    );
  }
}
