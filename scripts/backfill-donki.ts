// scripts/backfill-donki.ts
// Run once via `npx tsx scripts/backfill-donki.ts` (or via GitHub Actions).
// Fetches the last 2 years of DONKI data (FLR, CME, GST) in 30-day chunks
// and upserts into the donki_events table.

import { supabaseAdmin } from "@/lib/supabase/admin";

const NASA_API_KEY = process.env.NASA_API_KEY!;
const BACKFILL_YEARS = 2; // adjustable, but storage is negligible

type Endpoint = "FLR" | "CME" | "GST";

interface EndpointConfig {
  idField: string;
  timeField: string;
}

const ENDPOINTS: Record<Endpoint, EndpointConfig> = {
  FLR: { idField: "flrID", timeField: "beginTime" },
  CME: { idField: "activityID", timeField: "startTime" },
  GST: { idField: "gstID", timeField: "startTime" },
};

async function fetchChunk(endpoint: Endpoint, start: string, end: string) {
  const url = `https://api.nasa.gov/DONKI/${endpoint}?startDate=${start}&endDate=${end}&api_key=${NASA_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DONKI ${endpoint} ${res.status}: ${text}`);
  }
  return res.json();
}

async function backfillEndpoint(endpoint: Endpoint) {
  const { idField, timeField } = ENDPOINTS[endpoint];

  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);
  start.setFullYear(start.getFullYear() - BACKFILL_YEARS);

  let chunkEnd = new Date(end);

  while (chunkEnd > start) {
    const chunkStart = new Date(chunkEnd);
    chunkStart.setDate(chunkStart.getDate() - 29); // under 30-day limit

    // Don't go before the global start
    const finalStart = chunkStart < start ? start : chunkStart;

    const startStr = finalStart.toISOString().slice(0, 10);
    const endStr = chunkEnd.toISOString().slice(0, 10);

    console.log(`↳ ${endpoint}: fetching ${startStr} → ${endStr}`);

    const records = await fetchChunk(endpoint, startStr, endStr);

    if (Array.isArray(records) && records.length > 0) {
      const rows = records.map((r: any) => ({
        id: r[idField],
        event_type: endpoint,
        event_time: r[timeField],
        raw: r,
      }));

      const { error } = await supabaseAdmin.from("donki_events").upsert(rows);
      if (error) {
        console.error(
          `✖ upsert error for ${endpoint} ${startStr}→${endStr}:`,
          error,
        );
      } else {
        console.log(`  ✔ upserted ${rows.length} rows`);
      }
    } else {
      console.log(`  ℹ no records`);
    }

    // slide window by moving chunkEnd to just before chunkStart
    chunkEnd = new Date(chunkStart);
    chunkEnd.setDate(chunkEnd.getDate() - 1);

    // gentle throttle – well under 1000 req/hr
    await new Promise((r) => setTimeout(r, 600));
  }
}

async function main() {
  if (!NASA_API_KEY) {
    throw new Error("Missing NASA_API_KEY environment variable");
  }

  console.log(`Starting DONKI backfill (last ${BACKFILL_YEARS} years)...`);

  for (const endpoint of Object.keys(ENDPOINTS) as Endpoint[]) {
    console.log(`\n=== ${endpoint} ===`);
    try {
      await backfillEndpoint(endpoint);
    } catch (err) {
      console.error(`Fatal error for ${endpoint}, aborting:`, err);
      process.exit(1);
    }
  }

  console.log("\nBackfill complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
