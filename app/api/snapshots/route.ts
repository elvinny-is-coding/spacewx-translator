import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to) {
      return NextResponse.json(
        { error: "Both 'from' and 'to' ISO‑8601 timestamps are required." },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("space_weather_snapshots")
      .select("*")
      .gte("timestamp", from)
      .lte("timestamp", to)
      .order("timestamp", { ascending: true })
      .limit(1000);

    if (error) {
      console.error("GET /api/snapshots error:", error);
      return NextResponse.json(
        { error: "Failed to fetch snapshots" },
        { status: 500 },
      );
    }

    return NextResponse.json({ snapshots: data ?? [] });
  } catch (err: any) {
    console.error("GET /api/snapshots error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
