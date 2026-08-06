// app/api/hf-advisory/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCloudflareChatResponse } from "@/lib/ai/cloudflare-client";
import { buildHfAdvisoryPrompt } from "@/lib/ai/hf-advisory-prompt";
import type { SpaceWeatherData } from "@/types/spacewx";
import type { BandCondition, BandRecommendation } from "@/types/hf-advisory";

const VALID_BANDS = [
  "160m",
  "80m",
  "60m",
  "40m",
  "30m",
  "20m",
  "17m",
  "15m",
  "12m",
  "10m",
  "6m",
  "2m",
];

const VALID_CONDITIONS: BandCondition[] = ["good", "fair", "poor", "closed"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { qth, target, data } = body as {
      qth: string;
      target: string;
      data: SpaceWeatherData;
    };

    if (!qth || !target || !data) {
      return NextResponse.json(
        { error: "Missing 'qth', 'target', or 'data' in request body" },
        { status: 400 },
      );
    }

    const prompt = buildHfAdvisoryPrompt(qth, target, data);
    const messages = [
      { role: "system" as const, content: "You output only valid JSON." },
      { role: "user" as const, content: prompt },
    ];

    const rawResponse = await getCloudflareChatResponse(messages);

    // Clean markdown code fences if present
    const jsonCandidate = rawResponse
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    let parsed: {
      qth: string;
      target: string;
      bands: { band: string; condition: string; recommendation: string }[];
      summary: string;
    };

    try {
      parsed = JSON.parse(jsonCandidate);
    } catch {
      // Try to extract JSON from larger text
      const match = jsonCandidate.match(/\{[\s\S]*"bands"[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("Could not parse AI response as JSON");
      }
    }

    // Validate structure
    if (!parsed.bands || !Array.isArray(parsed.bands)) {
      throw new Error("Invalid response structure: missing bands array");
    }

    // Validate and cast each band
    const validBands: BandRecommendation[] = parsed.bands.map((b: any) => ({
      band: VALID_BANDS.includes(b.band) ? b.band : "20m",
      condition: VALID_CONDITIONS.includes(b.condition as BandCondition)
        ? (b.condition as BandCondition)
        : "fair",
      recommendation: b.recommendation || "No recommendation available",
    }));

    // Fill in any missing bands
    for (const band of VALID_BANDS) {
      if (!validBands.find((b) => b.band === band)) {
        validBands.push({
          band: band as BandRecommendation["band"],
          condition: "fair",
          recommendation: "No data available for this band.",
        });
      }
    }

    // Sort by band (lowest frequency first)
    const sortedBands = validBands.sort(
      (a, b) => VALID_BANDS.indexOf(a.band) - VALID_BANDS.indexOf(b.band),
    );

    return NextResponse.json({
      qth: parsed.qth || qth,
      target: parsed.target || target,
      bands: sortedBands,
      summary: parsed.summary || "No summary available.",
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("HF advisory error:", err);
    return NextResponse.json(
      { error: "Failed to generate HF advisory" },
      { status: 500 },
    );
  }
}
