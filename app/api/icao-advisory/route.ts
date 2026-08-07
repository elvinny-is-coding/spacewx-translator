// app/api/icao-advisory/route.ts

import { NextResponse } from "next/server";
import { fetchIcaoAdvisories } from "@/lib/spacewx/fetchers";
import type { IcaoAdvisory } from "@/types/icao";

let cached: IcaoAdvisory[] | null = null;
let lastFetched = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function GET() {
  try {
    const now = Date.now();
    if (cached && now - lastFetched < CACHE_TTL_MS) {
      return NextResponse.json({
        advisories: cached,
        lastChecked: new Date(lastFetched).toISOString(),
      });
    }

    const raw = await fetchIcaoAdvisories();
    const advisories: IcaoAdvisory[] = Array.isArray(raw) ? raw : [];
    cached = advisories;
    lastFetched = now;

    return NextResponse.json({
      advisories,
      lastChecked: new Date(lastFetched).toISOString(),
    });
  } catch (err: any) {
    console.error("ICAO advisory fetch error:", err);
    return NextResponse.json({
      advisories: [],
      lastChecked: new Date().toISOString(),
    });
  }
}
