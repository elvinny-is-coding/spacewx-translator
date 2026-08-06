// app/api/mission-advisory/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCloudflareChatResponse } from "@/lib/ai/cloudflare-client";
import { buildMissionAdvisoryPrompt } from "@/lib/ai/mission-advisory-prompt";
import type { SpaceWeatherData } from "@/types/spacewx";
import type { MissionType, MissionVerdict } from "@/types/mission-advisory";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { missionType, data } = body as {
      missionType: MissionType;
      data: SpaceWeatherData;
    };

    if (!missionType || !data) {
      return NextResponse.json(
        { error: "Missing 'missionType' or 'data' in request body" },
        { status: 400 },
      );
    }

    const prompt = buildMissionAdvisoryPrompt(missionType, data);
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
      advisory: {
        missionType: string;
        verdict: string;
        summary: string;
        earliestSafeWindow: string | null;
      };
    };
    try {
      parsed = JSON.parse(jsonCandidate);
    } catch {
      // If JSON is embedded in a larger text, try to extract it
      const match = jsonCandidate.match(/\{[\s\S]*"advisory"[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("Could not parse AI response as JSON");
      }
    }

    // Validate structure
    if (!parsed.advisory || !parsed.advisory.verdict) {
      throw new Error(
        "Invalid response structure: missing advisory or verdict",
      );
    }

    // Validate and cast verdict
    const validVerdicts: MissionVerdict[] = ["GO", "CONDITIONAL GO", "NO GO"];
    const verdict: MissionVerdict = validVerdicts.includes(
      parsed.advisory.verdict as MissionVerdict,
    )
      ? (parsed.advisory.verdict as MissionVerdict)
      : "CONDITIONAL GO";

    return NextResponse.json({
      advisory: {
        missionType,
        verdict,
        summary: parsed.advisory.summary || "No summary available",
        earliestSafeWindow: parsed.advisory.earliestSafeWindow || null,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Mission advisory error:", err);
    return NextResponse.json(
      { error: "Failed to generate mission advisory" },
      { status: 500 },
    );
  }
}
