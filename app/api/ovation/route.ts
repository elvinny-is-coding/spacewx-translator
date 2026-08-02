import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("latest_ovation")
      .select("grid, forecast_time")
      .eq("id", 1)
      .single();

    if (error || !data) {
      return NextResponse.json({ grid: null, forecastTime: null });
    }

    return NextResponse.json({
      grid: data.grid,
      forecastTime: data.forecast_time,
    });
  } catch (err: any) {
    console.error("GET /api/ovation error:", err);
    return NextResponse.json({ grid: null, forecastTime: null });
  }
}
