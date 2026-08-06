// app/api/health/route.ts

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    checks: {
      database: "unknown",
      apis: {} as Record<string, string>,
    },
  };

  // Check database connectivity
  try {
    const { error } = await supabaseAdmin
      .from("space_weather_snapshots")
      .select("id")
      .limit(1);
    health.checks.database = error ? "unhealthy" : "healthy";

    if (error) {
      health.status = "degraded";
    }
  } catch (error) {
    health.checks.database = "error";
    health.status = "unhealthy";
  }

  // Check critical APIs (quick HEAD requests)
  const criticalApis = [
    {
      name: "NOAA K-index",
      url: "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json",
    },
    {
      name: "NOAA Alerts",
      url: "https://services.swpc.noaa.gov/products/alerts.json",
    },
  ];

  for (const api of criticalApis) {
    try {
      const response = await fetch(api.url, {
        method: "HEAD",
        signal: AbortSignal.timeout(5000),
      });
      health.checks.apis[api.name] = response.ok ? "healthy" : "unhealthy";

      if (!response.ok) {
        health.status = "degraded";
      }
    } catch (error) {
      health.checks.apis[api.name] = "error";
      health.status = "degraded";
    }
  }

  // Return appropriate HTTP status
  const statusCode =
    health.status === "healthy"
      ? 200
      : health.status === "degraded"
        ? 502
        : 503;

  return NextResponse.json(health, { status: statusCode });
}
