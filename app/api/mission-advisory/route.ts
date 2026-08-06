// app/api/mission-advisory/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCloudflareChatResponse } from "@/lib/ai/cloudflare-client";
import { buildMissionAdvisoryPrompt } from "@/lib/ai/mission-advisory-prompt";
import type { SpaceWeatherData } from "@/types/spacewx";
import type { MissionType, MissionVerdict } from "@/types/mission-advisory";

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
    const jsonCandidate = repairJSON(rawResponse);

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
      const match = jsonCandidate.match(/\{[\s\S]*"advisory"[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(repairJSON(match[0]));
      } else {
        console.error(
          "Unparseable mission advisory response:",
          jsonCandidate.slice(0, 500),
        );
        throw new Error("Could not parse AI response as JSON");
      }
    }

    if (!parsed.advisory || !parsed.advisory.verdict) {
      throw new Error(
        "Invalid response structure: missing advisory or verdict",
      );
    }

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
