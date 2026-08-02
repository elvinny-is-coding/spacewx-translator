import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const NASA_API_KEY = process.env.NASA_API_KEY!;
const SYNC_WINDOW_DAYS = 5; // overlapping window for self-healing

interface DonkiEndpoint {
  type: "FLR" | "CME" | "GST";
  idField: string;
  timeField: string;
}

const ENDPOINTS: DonkiEndpoint[] = [
  { type: "FLR", idField: "flrID", timeField: "beginTime" },
  { type: "CME", idField: "activityID", timeField: "startTime" },
  { type: "GST", idField: "gstID", timeField: "startTime" },
];

export async function POST(request: NextRequest) {
  // Verify secret
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Compute date window
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - SYNC_WINDOW_DAYS);

  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);

  const results: Record<string, number | string> = {};

  for (const { type, idField, timeField } of ENDPOINTS) {
    const url = `https://api.nasa.gov/DONKI/${type}?startDate=${startStr}&endDate=${endStr}&api_key=${NASA_API_KEY}`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`DONKI ${type} failed: HTTP ${res.status}`);
        results[type] = -1; // signal failure
        continue;
      }

      const records = await res.json();
      if (!Array.isArray(records) || records.length === 0) {
        results[type] = 0;
        continue;
      }

      const rows = records.map((r: any) => ({
        id: r[idField],
        event_type: type,
        event_time: r[timeField],
        raw: r,
      }));

      const { error } = await supabaseAdmin.from("donki_events").upsert(rows);
      if (error) {
        console.error(`DONKI ${type} upsert error:`, error);
        results[type] = -1;
      } else {
        results[type] = rows.length;
      }
    } catch (err: any) {
      console.error(`DONKI ${type} fetch error:`, err);
      results[type] = -1;
    }
  }

  return NextResponse.json({ synced: results });
}
