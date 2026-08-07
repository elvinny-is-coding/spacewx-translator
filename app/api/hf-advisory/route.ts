// app/api/hf-advisory/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCloudflareChatResponse } from "@/lib/ai/cloudflare-client";
import { buildHfAdvisoryPrompt } from "@/lib/ai/hf-advisory-prompt";
import { computeDeterministicBands } from "@/lib/spacewx/hf-deterministic";
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

/** Fix common JSON issues from AI output: trailing commas, missing commas between objects, unquoted keys */
function repairJSON(raw: string): string {
  let fixed = raw
    .replace(/,(\s*[}\]])/g, "$1")
    .replace(/\}(\s*)\{/g, "},$1{")
    .replace(/\"(\s*)\"/g, '",$1"')
    .replace(/(\d)(\s*)\"/g, '$1,$2"')
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
  let qth = "";
  let target = "";
  let data: SpaceWeatherData | undefined;

  try {
    const body = await request.json();
    qth = body?.qth ?? "";
    target = body?.target ?? "";
    data = body?.data;

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
    const jsonCandidate = repairJSON(rawResponse);

    let parsed: {
      qth: string;
      target: string;
      bands: { range: string; status: string; note: string }[];
      summary: string;
    };

    try {
      parsed = JSON.parse(jsonCandidate);
    } catch {
      const match = jsonCandidate.match(/\{[\s\S]*"bands"[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(repairJSON(match[0]));
      } else {
        console.error(
          "Unparseable HF advisory response:",
          jsonCandidate.slice(0, 500),
        );
        throw new Error("Could not parse AI response as JSON");
      }
    }

    if (!parsed.bands || !Array.isArray(parsed.bands)) {
      throw new Error("Invalid response structure: missing bands array");
    }

    const validBands: BandRecommendation[] = parsed.bands.map((b: any) => ({
      range: VALID_RANGES.includes(b.range) ? b.range : "20m",
      status: VALID_STATUSES.includes(b.status as BandStatus)
        ? (b.status as BandStatus)
        : "fair",
      note: b.note || "No data available for this range.",
    }));

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
    console.warn(
      "HF advisory AI failed, using deterministic fallback:",
      err.message,
    );
    const rScale = data?.noaaScaleR ?? 0;
    const kp = data?.kp ?? 0;
    const fallback = computeDeterministicBands(rScale, kp);
    return NextResponse.json({
      qth,
      target,
      bands: fallback,
      summary:
        "AI advisory unavailable — showing rule‑based estimates from NOAA scales.",
      generatedAt: new Date().toISOString(),
    });
  }
}
