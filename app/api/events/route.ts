import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { TimelineEvent } from "@/types/timeline";
import type { SpaceWeatherSnapshot } from "@/types/snapshot";
import {
  convertDonkiRow,
  extractAlertEvents,
  extractKpSpikeEvents,
} from "@/lib/timeline-utils";

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

    // ── 1. Fetch DONKI events ──
    const { data: donkiRows, error: donkiError } = await supabaseAdmin
      .from("donki_events")
      .select("*")
      .gte("event_time", from)
      .lte("event_time", to)
      .order("event_time", { ascending: true });

    if (donkiError) {
      console.error("donki_events query error:", donkiError);
    }

    const donkiEvents: TimelineEvent[] = (donkiRows ?? [])
      .map(convertDonkiRow)
      .filter((e): e is TimelineEvent => e !== null);

    // ── 2. Fetch space_weather_snapshots for the same range ──
    const { data: snapshots, error: snapError } = await supabaseAdmin
      .from("space_weather_snapshots")
      .select("*")
      .gte("timestamp", from)
      .lte("timestamp", to)
      .order("timestamp", { ascending: true });

    if (snapError) {
      console.error("snapshots query error:", snapError);
    }

    const typedSnapshots: SpaceWeatherSnapshot[] = (snapshots ?? []).map(
      (s: any) => ({
        ...s,
        raw_data: s.raw_data as SpaceWeatherSnapshot["raw_data"] | null,
      }),
    );

    const alertEvents = extractAlertEvents(typedSnapshots);
    const kpEvents = extractKpSpikeEvents(typedSnapshots);

    // ── 3. Merge, sort, return ──
    const allEvents = [...donkiEvents, ...alertEvents, ...kpEvents];
    allEvents.sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
    );

    return NextResponse.json({ events: allEvents });
  } catch (err: any) {
    console.error("GET /api/events error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
