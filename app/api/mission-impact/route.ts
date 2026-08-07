// app/api/mission-impact/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCloudflareChatResponse } from "@/lib/ai/cloudflare-client";
import { buildMissionImpactPrompt } from "@/lib/ai/mission-impact-prompt";
import type { SpaceWeatherData } from "@/types/spacewx";
import type {
  MissionImpactRequest,
  MissionImpactResponse,
} from "@/types/mission-impact";

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
    const { missionRequest, data } = body as {
      missionRequest: MissionImpactRequest;
      data: SpaceWeatherData;
    };

    if (!missionRequest || !data) {
      return NextResponse.json(
        { error: "Missing 'missionRequest' or 'data' in request body" },
        { status: 400 },
      );
    }

    const prompt = buildMissionImpactPrompt(missionRequest, data);
    const messages = [
      { role: "system" as const, content: "You output only valid JSON." },
      { role: "user" as const, content: prompt },
    ];

    const rawResponse = await getCloudflareChatResponse(messages);
    const jsonCandidate = repairJSON(rawResponse);

    let parsed: MissionImpactResponse;
    try {
      parsed = JSON.parse(jsonCandidate) as MissionImpactResponse;
    } catch {
      // Try to extract from larger text
      const match = jsonCandidate.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(repairJSON(match[0])) as MissionImpactResponse;
      } else {
        throw new Error("Could not parse AI response as JSON");
      }
    }

    // Validate required fields
    if (!parsed.verdict || !parsed.summary) {
      throw new Error("Missing required fields in AI response");
    }

    // Ensure valid verdict
    const validVerdicts = ["GO", "CONDITIONAL GO", "NO GO"];
    if (!validVerdicts.includes(parsed.verdict)) {
      parsed.verdict = "CONDITIONAL GO";
    }

    // Ensure confidence is a number between 0 and 1
    parsed.confidence =
      typeof parsed.confidence === "number" &&
      parsed.confidence >= 0 &&
      parsed.confidence <= 1
        ? Math.round(parsed.confidence * 100) / 100
        : 0.5;

    // Ensure risks is an array
    if (!Array.isArray(parsed.risks)) {
      parsed.risks = [];
    }
    parsed.risks = parsed.risks.map((r: any) => ({
      name: r.name || "Unknown risk",
      severity: ["low", "medium", "high", "critical"].includes(r.severity)
        ? r.severity
        : "low",
      description: r.description || "",
    }));

    // Ensure mitigations is an array of strings
    parsed.mitigations = Array.isArray(parsed.mitigations)
      ? parsed.mitigations.map(String)
      : [];

    parsed.changeCondition =
      parsed.changeCondition || "Conditions may change. Monitor for updates.";
    parsed.generatedAt = new Date().toISOString();

    return NextResponse.json({ impact: parsed });
  } catch (err: any) {
    console.error("Mission impact error:", err);
    return NextResponse.json(
      { error: "Failed to generate mission impact assessment" },
      { status: 500 },
    );
  }
}
