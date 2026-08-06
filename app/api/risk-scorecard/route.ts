// app/api/risk-scorecard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCloudflareChatResponse } from "@/lib/ai/cloudflare-client";
import { buildRiskScorecardPrompt } from "@/lib/ai/risk-scorecard-prompt";
import type { SpaceWeatherData } from "@/types/spacewx";
import type { RiskAssessment } from "@/types/risk-scorecard";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data } = body as { data: SpaceWeatherData };

    if (!data) {
      return NextResponse.json(
        { error: "Missing 'data' in request body" },
        { status: 400 },
      );
    }

    const prompt = buildRiskScorecardPrompt(data);
    const messages = [
      { role: "system", content: "You output only valid JSON." },
      { role: "user", content: prompt },
    ];

    const rawResponse = await getCloudflareChatResponse(messages);

    // Clean markdown code fences if present
    const jsonCandidate = rawResponse
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    let parsed: { assessments: RiskAssessment[] };
    try {
      parsed = JSON.parse(jsonCandidate);
    } catch {
      // If JSON is embedded in a larger text, try to extract it
      const match = jsonCandidate.match(/\{[\s\S]*"assessments"[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("Could not parse AI response as JSON");
      }
    }

    // Validate that we have the expected structure
    if (!parsed.assessments || !Array.isArray(parsed.assessments)) {
      throw new Error("Invalid response structure: missing assessments array");
    }

    // Ensure each assessment has required fields
    const validAssessments: RiskAssessment[] = parsed.assessments.map(
      (a: any) => ({
        system: a.system || "Unknown",
        riskLevel: ["low", "medium", "high", "critical"].includes(a.riskLevel)
          ? a.riskLevel
          : "low",
        driver: a.driver || "Unknown",
        recommendation: a.recommendation || "No recommendation available",
      }),
    );

    return NextResponse.json({
      assessments: validAssessments,
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Risk scorecard error:", err);
    return NextResponse.json(
      { error: "Failed to generate risk scorecard" },
      { status: 500 },
    );
  }
}
