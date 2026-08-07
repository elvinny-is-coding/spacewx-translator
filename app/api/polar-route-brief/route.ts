// app/api/polar-route-brief/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCloudflareChatResponse } from "@/lib/ai/cloudflare-client";
import { buildPolarRouteBriefPrompt } from "@/lib/ai/polar-route-brief-prompt";
import { fetchIcaoAdvisories } from "@/lib/spacewx/fetchers";
import { ROUTE_PRESETS, type PolarRouteBrief } from "@/types/polar-brief";
import type { SpaceWeatherData } from "@/types/spacewx";
import type { IcaoAdvisory } from "@/types/icao";

/** Fix common JSON issues from AI output */
function repairJSON(raw: string): string {
  let fixed = raw
    .replace(/,(\s*[}\]])/g, "$1")
    .replace(/\}(\s*)\{/g, "},$1{")
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();
  const lastBrace = fixed.lastIndexOf("}");
  if (lastBrace > 0 && lastBrace < fixed.length - 1) {
    fixed = fixed.slice(0, lastBrace + 1);
  }
  return fixed;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { routeId, data } = body as {
      routeId: string;
      data: SpaceWeatherData;
    };

    if (!routeId || !data) {
      return NextResponse.json(
        { error: "Missing 'routeId' or 'data' in request body" },
        { status: 400 },
      );
    }

    const route = ROUTE_PRESETS.find((r) => r.id === routeId);
    if (!route) {
      return NextResponse.json(
        { error: `Invalid routeId: ${routeId}` },
        { status: 400 },
      );
    }

    // Fetch ICAO advisories (cached in fetcher is fine; route runs on server)
    let advisoryText: string | null = null;
    try {
      const advisories: IcaoAdvisory[] = await fetchIcaoAdvisories();
      if (Array.isArray(advisories) && advisories.length > 0) {
        // Combine all active advisories into one text block
        advisoryText = advisories
          .map((a) => `[${a.advisory_number}] ${a.advisory_text}`)
          .join("\n\n");
      }
    } catch {
      // Non‑critical; proceed without advisory data
    }

    const prompt = buildPolarRouteBriefPrompt(
      route.label,
      route.origin,
      route.destination,
      advisoryText,
      data,
    );

    const messages = [
      { role: "system" as const, content: "You output only valid JSON." },
      { role: "user" as const, content: prompt },
    ];

    const rawResponse = await getCloudflareChatResponse(messages);
    const jsonCandidate = repairJSON(rawResponse);

    let parsed: {
      status: string;
      hazardType: string;
      validWindow: string | null;
      alternatives: string[];
      summary: string;
    };

    try {
      parsed = JSON.parse(jsonCandidate);
    } catch {
      const match = jsonCandidate.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(repairJSON(match[0]));
      } else {
        throw new Error("Could not parse AI response as JSON");
      }
    }

    // Validate and cast
    const validStatuses = ["OPEN", "CONDITIONAL", "AVOID"];
    const brief: PolarRouteBrief = {
      selectedRoute: route,
      status: validStatuses.includes(parsed.status)
        ? (parsed.status as PolarRouteBrief["status"])
        : "CONDITIONAL",
      hazardType: parsed.hazardType || "Unknown",
      validWindow: parsed.validWindow || null,
      alternatives: Array.isArray(parsed.alternatives)
        ? parsed.alternatives
        : [],
      summary: parsed.summary || "No summary available.",
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ brief });
  } catch (err: any) {
    console.error("Polar route brief error:", err);
    return NextResponse.json(
      { error: "Failed to generate route brief" },
      { status: 500 },
    );
  }
}
