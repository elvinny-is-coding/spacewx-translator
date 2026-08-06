// app/api/hf-advisory/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCloudflareChatResponse } from "@/lib/ai/cloudflare-client";
import { buildHfAdvisoryPrompt } from "@/lib/ai/hf-advisory-prompt";
import type { SpaceWeatherData } from "@/types/spacewx";
import type {
  BandRange,
  BandStatus,
  BandRecommendation,
} from "@/types/hf-advisory";

const VALID_RANGES: BandRange[] = [
  "10-15m",
  "17-20m",
  "30-40m",
  "60-80m",
  "160m+",
];
const VALID_STATUSES: BandStatus[] = ["good", "fair", "poor", "blackout"];

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
      bands: { range: string; status: string; note: string }[];
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

    // Validate and cast each band range
    const validBands: BandRecommendation[] = parsed.bands.map((b: any) => ({
      range: VALID_RANGES.includes(b.range) ? b.range : "20m",
      status: VALID_STATUSES.includes(b.status as BandStatus)
        ? (b.status as BandStatus)
        : "fair",
      note: b.note || "No data available for this range.",
    }));

    // Sort by range (from high frequency to low)
    const sortedBands = validBands.sort(
      (a, b) =>
        VALID_RANGES.indexOf(a.range as BandRange) -
        VALID_RANGES.indexOf(b.range as BandRange),
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
