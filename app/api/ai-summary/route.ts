import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getGraniteSummary } from "@/lib/ai/granite-client";
import { getCloudflareSummary } from "@/lib/ai/cloudflare-client";
import { buildPrompt } from "@/lib/ai/prompts";
import { getCachedSummary, setCachedSummary } from "@/lib/spacewx/cache";
import { severityFromKp } from "@/config/constants";
import type { SpaceWeatherData } from "@/types/spacewx";
import type { Audience } from "@/types/audience";

function generateFallbackSummary(
  data: SpaceWeatherData,
  audience: Audience,
): string {
  const { label } = severityFromKp(data.kp);
  const kpDisplay = data.kp !== null ? data.kp.toFixed(1) : "unknown";
  const solarWind = data.solarWind?.speed
    ? `${data.solarWind.speed} km/s`
    : "unavailable";
  const flares =
    data.flares.length > 0
      ? data.flares.map((f) => f.classType).join(", ")
      : "none";
  const alerts =
    data.alerts.length > 0 ? `${data.alerts.length} active` : "none";

  const baseInfo = `Kp index ${kpDisplay} (${label}), solar wind ${solarWind}, flares: ${flares}, alerts: ${alerts}.`;

  switch (audience) {
    case "general":
      if (data.kp === null)
        return "Current space weather data is unavailable. Check back soon for updates on aurora visibility and solar activity.";
      if (data.kp < 4)
        return `Space weather is calm right now (Kp ${kpDisplay}). No aurora is expected outside polar regions. ${data.alerts.length > 0 ? "There are some minor alerts but nothing to worry about." : ""}`;
      if (data.kp < 6)
        return `Active space weather! Kp index is ${kpDisplay}, which means aurora may be visible at higher latitudes. Check your local sky conditions. ${data.alerts.length > 0 ? "There are active space weather alerts — stay informed." : ""}`;
      return `A geomagnetic storm is in progress! Kp index ${kpDisplay}. Aurora may be visible much farther south than usual. Satellite and power grid operators are on alert.`;

    case "educator":
      if (data.kp === null)
        return "Space weather data is currently unavailable. Use this as an opportunity to discuss with students how we monitor the Sun and why real-time data matters for space exploration.";
      return `Current conditions: ${baseInfo} This is a great opportunity to discuss how solar wind interacts with Earth's magnetosphere. ${data.kp >= 4 ? "The elevated Kp suggests a CME may have arrived — perfect for teaching cause-and-effect in space weather." : "The quiet conditions are ideal for introducing the solar cycle and how it affects space weather patterns over 11 years."}`;

    case "technical":
      if (data.kp === null)
        return "Warning: Space weather data feed interrupted. Exercise caution for satellite operations and HF communications until data is restored.";

      const impactMessage =
        data.kp < 4
          ? "No significant impacts expected on GNSS, HF communications, or satellite operations."
          : data.kp < 6
            ? "Potential minor impacts on HF radio at high latitudes and increased satellite drag. Monitor for updates."
            : `WARNING: G${data.noaaScaleG != null ? String(data.noaaScaleG) : "?"} conditions. Expect HF blackouts, GNSS degradation, and satellite anomalies. Review contingency procedures.`;

      return `${baseInfo} ${impactMessage}`;

    default:
      return "Select an audience to see a space weather summary.";
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, audience } = body as {
      data: SpaceWeatherData;
      audience: Audience;
    };

    if (!data || !audience) {
      return NextResponse.json(
        { error: "Missing 'data' or 'audience' in request body" },
        { status: 400 },
      );
    }

    if (!["general", "educator", "technical"].includes(audience)) {
      return NextResponse.json(
        {
          error:
            "Invalid audience. Must be 'general', 'educator', or 'technical'",
        },
        { status: 400 },
      );
    }

    // 1. Try to serve a precomputed daily summary + suggested prompts
    const today = new Date().toISOString().slice(0, 10);
    const { data: precomputed, error: fetchError } = await supabaseAdmin
      .from("daily_summaries")
      .select("summary, suggested_prompts")
      .eq("date", today)
      .eq("audience", audience)
      .maybeSingle();

    if (!fetchError && precomputed?.summary) {
      return NextResponse.json({
        summary: precomputed.summary,
        suggestedPrompts: precomputed.suggested_prompts ?? [],
      });
    }

    // 2. Check in‑memory cache
    const cached = getCachedSummary(data, audience);
    if (cached) {
      return NextResponse.json({ summary: cached, suggestedPrompts: [] });
    }

    let summary: string;
    const prompt = buildPrompt(data, audience);

    // 3. Try primary → Cloudflare → deterministic
    try {
      summary = await getGraniteSummary(prompt);
    } catch (graniteError) {
      console.warn("Granite unavailable, trying Cloudflare", graniteError);
      try {
        summary = await getCloudflareSummary(prompt);
      } catch (cloudflareError) {
        console.warn(
          "Cloudflare also unavailable, using deterministic fallback",
          cloudflareError,
        );
        summary = generateFallbackSummary(data, audience);
      }
    }

    setCachedSummary(data, audience, summary);
    return NextResponse.json({ summary, suggestedPrompts: [] });
  } catch (error: any) {
    console.error("AI summary error:", error);
    return NextResponse.json(
      { error: error.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
