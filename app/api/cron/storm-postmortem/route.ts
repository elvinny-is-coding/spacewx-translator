// app/api/cron/storm-postmortem/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCloudflareChatResponse } from "@/lib/ai/cloudflare-client";
import { buildStormPostmortemPrompt } from "@/lib/ai/postmortem-prompt";
import type { SpaceWeatherSnapshot } from "@/types/snapshot";
import type { TimelineEvent } from "@/types/timeline";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Check last two snapshots for storm end
    const { data: recentSnapshots, error: snapError } = await supabaseAdmin
      .from("space_weather_snapshots")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(2);

    if (snapError || !recentSnapshots || recentSnapshots.length < 2) {
      return NextResponse.json({
        status: "no_data",
        message: "Not enough snapshots",
      });
    }

    const current = recentSnapshots[0] as SpaceWeatherSnapshot;
    const previous = recentSnapshots[1] as SpaceWeatherSnapshot;

    const previousKp = previous.kp ?? 0;
    const currentKp = current.kp ?? 0;

    // Storm end: Kp was ≥ 5 and now < 4
    if (!(previousKp >= 5 && currentKp < 4)) {
      return NextResponse.json({
        status: "no_storm_end",
        previousKp,
        currentKp,
      });
    }

    // Storm detected – determine start by scanning backward
    const stormEndTime = new Date(current.timestamp);
    const { data: stormSnapshots, error: stormError } = await supabaseAdmin
      .from("space_weather_snapshots")
      .select("*")
      .lte("timestamp", stormEndTime.toISOString())
      .order("timestamp", { ascending: false })
      .limit(200); // enough for a multi-day storm

    if (stormError || !stormSnapshots || stormSnapshots.length === 0) {
      return NextResponse.json({
        status: "no_data",
        message: "Could not fetch storm snapshots",
      });
    }

    // Find storm start: earliest snapshot in this batch where Kp ≥ 4
    let stormStart: SpaceWeatherSnapshot | null = null;
    let peakKp = 0;
    for (let i = stormSnapshots.length - 1; i >= 0; i--) {
      const s = stormSnapshots[i] as SpaceWeatherSnapshot;
      if ((s.kp ?? 0) >= 4) {
        stormStart = s;
        break;
      }
    }
    for (const s of stormSnapshots) {
      const snap = s as SpaceWeatherSnapshot;
      if ((snap.kp ?? 0) > peakKp) peakKp = snap.kp ?? 0;
    }

    if (!stormStart) {
      return NextResponse.json({
        status: "no_storm_start",
        message: "Could not determine storm start",
      });
    }

    const stormStartTime = new Date(stormStart.timestamp);
    const durationMs = stormEndTime.getTime() - stormStartTime.getTime();
    const durationHours = Math.round(durationMs / (1000 * 60 * 60));

    // 2. Fetch precursor timeline events (7 days before storm start)
    const lookbackStart = new Date(
      stormStartTime.getTime() - 7 * 24 * 60 * 60 * 1000,
    );
    const { data: donkiEvents } = await supabaseAdmin
      .from("donki_events")
      .select("*")
      .gte("event_time", lookbackStart.toISOString())
      .lte("event_time", stormStartTime.toISOString())
      .order("event_time", { ascending: false });

    const precursorFlares: TimelineEvent[] = [];
    const precursorCMEs: TimelineEvent[] = [];
    if (donkiEvents) {
      for (const row of donkiEvents) {
        if (row.event_type === "FLR") {
          precursorFlares.push({
            id: row.id,
            source: "donki",
            type: "flare",
            time: row.event_time,
            label: `Solar flare ${row.raw?.classType ?? "?"}`,
            description: "",
            color: "solar-amber",
            raw: row.raw,
          });
        } else if (row.event_type === "CME") {
          precursorCMEs.push({
            id: row.id,
            source: "donki",
            type: "cme",
            time: row.event_time,
            label: `CME ${row.raw?.speed ? `${row.raw.speed} km/s` : ""}`,
            description: "",
            color: "aurora-violet",
            raw: row.raw,
          });
        }
      }
    }

    // 3. Generate report
    const typedSnapshots: SpaceWeatherSnapshot[] =
      stormSnapshots as SpaceWeatherSnapshot[];
    let reportText: string;
    try {
      const prompt = buildStormPostmortemPrompt(
        typedSnapshots,
        precursorFlares,
        precursorCMEs,
      );
      const messages = [
        {
          role: "system" as const,
          content: "You write concise, professional incident reports.",
        },
        { role: "user" as const, content: prompt },
      ];
      reportText = await getCloudflareChatResponse(messages);
    } catch {
      // Deterministic fallback
      reportText = [
        `Geomagnetic storm detected from ${stormStartTime.toISOString()} to ${stormEndTime.toISOString()}.`,
        `Peak Kp: ${peakKp.toFixed(1)}. Duration: ~${durationHours} hours.`,
        precursorFlares.length > 0
          ? `Precursor flares: ${precursorFlares.map((f) => f.label).join(", ")}.`
          : "",
        precursorCMEs.length > 0
          ? `Precursor CMEs: ${precursorCMEs.map((c) => c.label).join(", ")}.`
          : "",
        "This is an automated incident summary generated by Aura.",
      ].join(" ");
    }

    // 4. Store in postmortems table
    const { error: insertError } = await supabaseAdmin
      .from("postmortems")
      .insert({
        storm_start: stormStartTime.toISOString(),
        storm_end: stormEndTime.toISOString(),
        peak_kp: peakKp,
        duration_hours: durationHours,
        precursor_flares: precursorFlares.map((f) => ({
          classType: f.label,
          time: f.time,
        })),
        precursor_cmes: precursorCMEs.map((c) => ({
          speed: (c.raw as any)?.speed ?? 0,
          time: c.time,
        })),
        report_text: reportText,
      });

    if (insertError) {
      console.error("Failed to store postmortem:", insertError);
      return NextResponse.json(
        { error: "Failed to store storm report" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      status: "storm_end_detected",
      previousKp,
      currentKp,
      peakKp,
      durationHours,
      precursorFlares: precursorFlares.length,
      precursorCMEs: precursorCMEs.length,
    });
  } catch (err: any) {
    console.error("Storm postmortem error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
