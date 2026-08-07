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

function deterministicImpact(
  request: MissionImpactRequest,
  data: SpaceWeatherData,
): MissionImpactResponse {
  const kp = data?.kp ?? 0;
  const rScale = data?.noaaScaleR ?? 0;
  const sScale = data?.noaaScaleS ?? 0;
  const gScale = data?.noaaScaleG ?? 0;
  const hasXFlare =
    data?.flares?.some((f) => f.classType.toUpperCase().startsWith("X")) ??
    false;

  // Simple heuristic verdict
  let verdict: MissionImpactResponse["verdict"] = "GO";
  if (
    kp >= 5 ||
    sScale >= 1 ||
    gScale >= 2 ||
    (hasXFlare && request?.tolerance !== "flexible")
  ) {
    verdict = "CONDITIONAL GO";
  }
  if (
    kp >= 7 ||
    sScale >= 2 ||
    gScale >= 3 ||
    (hasXFlare && request?.tolerance === "strict")
  ) {
    verdict = "NO GO";
  }

  const risks: MissionImpactResponse["risks"] = [];
  if (rScale >= 1)
    risks.push({
      name: "HF blackout",
      severity: rScale >= 2 ? "high" : "medium",
      description: "Radio blackout on sunlit side may affect communications.",
    });
  if (gScale >= 1)
    risks.push({
      name: "Geomagnetic storm",
      severity: gScale >= 2 ? "high" : "medium",
      description: "Increased satellite drag and possible GNSS degradation.",
    });
  if (sScale >= 1)
    risks.push({
      name: "Radiation storm",
      severity: sScale >= 2 ? "high" : "medium",
      description:
        "Energetic proton flux elevated — risk to spacecraft electronics and polar aviation.",
    });
  if (kp >= 4)
    risks.push({
      name: "Elevated Kp",
      severity: kp >= 6 ? "high" : "medium",
      description: "Enhanced auroral activity and ionospheric disturbance.",
    });
  if (risks.length === 0)
    risks.push({
      name: "Quiet conditions",
      severity: "low",
      description: "No significant space weather risks identified.",
    });

  const missionType = request?.missionType || "Mission";

  return {
    verdict,
    confidence: 0.5,
    risks,
    mitigations:
      verdict !== "GO"
        ? [
            "Monitor NOAA SWPC for updates.",
            "Consider delaying if mission flexibility allows.",
          ]
        : [],
    changeCondition:
      verdict !== "GO"
        ? "If Kp drops below 4 and no radiation storm is active, conditions improve."
        : "No change expected — conditions are quiet.",
    summary: `Space weather assessment for ${missionType}: Kp ${kp.toFixed(
      1,
    )}, G${gScale}/R${rScale}/S${sScale}. Verdict: ${verdict}.`,
    generatedAt: new Date().toISOString(),
  };
}

export async function POST(request: NextRequest) {
  let missionRequest: MissionImpactRequest | undefined;
  let data: SpaceWeatherData | undefined;

  try {
    const body = await request.json();
    missionRequest = body?.missionRequest;
    data = body?.data;

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
    console.warn(
      "Mission impact AI failed, using deterministic fallback:",
      err.message,
    );
    const fallback = deterministicImpact(missionRequest!, data!);
    return NextResponse.json({ impact: fallback });
  }
}
