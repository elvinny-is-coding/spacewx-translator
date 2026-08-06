// app/api/risk-scorecard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCloudflareChatResponse } from "@/lib/ai/cloudflare-client";
import { buildRiskRecommendationsPrompt } from "@/lib/ai/risk-scorecard-prompt";
import type { SpaceWeatherData } from "@/types/spacewx";
import type { RiskAssessment, RiskLevel } from "@/types/risk-scorecard";

// ── Deterministic risk level + driver computation ──

function computeDeterministicAssessment(data: SpaceWeatherData): {
  assessments: { system: string; riskLevel: RiskLevel; driver: string }[];
} {
  const kp = data.kp ?? 0;
  const rScale = data.noaaScaleR ?? 0;
  const sScale = data.noaaScaleS ?? 0;
  const gScale = data.noaaScaleG ?? 0;
  const hasXFlare = data.flares.some((f) =>
    f.classType.toUpperCase().startsWith("X"),
  );
  const bz = data.solarWind?.bz ?? 0;

  function level(r: number, g: number, s: number, x: boolean): RiskLevel {
    if (r >= 2 || s >= 2 || g >= 2) return "high";
    if (r >= 1 || s >= 1 || g >= 1 || x) return "medium";
    return "low";
  }

  return {
    assessments: [
      {
        system: "HF Communications",
        riskLevel: rScale >= 2 ? "high" : rScale >= 1 ? "medium" : "low",
        driver: rScale >= 1 ? `R${rScale} blackout` : "No radio blackout",
      },
      {
        system: "GNSS",
        riskLevel: kp >= 5 ? "medium" : "low",
        driver:
          kp >= 5 ? `Kp ${kp.toFixed(1)} scintillation` : "Quiet ionosphere",
      },
      {
        system: "LEO Satellite Drag",
        riskLevel: gScale >= 2 ? "high" : gScale >= 1 ? "medium" : "low",
        driver: gScale >= 1 ? `G${gScale} storm` : "No geomagnetic storm",
      },
      {
        system: "Power Grid",
        riskLevel: gScale >= 3 ? "high" : bz < -10 ? "medium" : "low",
        driver:
          gScale >= 3
            ? `G${gScale} storm`
            : bz < -10
              ? "Strong southward Bz"
              : "No GIC risk",
      },
      {
        system: "Polar Aviation",
        riskLevel:
          sScale >= 2 ? "high" : sScale >= 1 || hasXFlare ? "medium" : "low",
        driver:
          sScale >= 1
            ? `S${sScale} radiation`
            : hasXFlare
              ? "X-class flare"
              : "No radiation storm",
      },
    ],
  };
}

// ── Default recommendations when AI fails ──

const DEFAULT_RECOMMENDATIONS: Record<string, Record<string, string>> = {
  "HF Communications": {
    low: "HF conditions normal.",
    medium: "Monitor HF propagation; minor degradation possible.",
    high: "Switch to SATCOM backup. HF unreliable on sunlit side.",
    critical: "HF blackout expected. Use alternative communications.",
  },
  GNSS: {
    low: "GNSS nominal.",
    medium: "Add 1–3 m margin to positioning solutions.",
    high: "GNSS accuracy severely degraded. Use augmentations.",
    critical: "GNSS unreliable. Delay precision operations.",
  },
  "LEO Satellite Drag": {
    low: "LEO drag nominal.",
    medium: "Minor drag increase. Monitor orbit parameters.",
    high: "Significant drag increase. Plan orbit maintenance.",
    critical: "Severe drag. Immediate orbit adjustment required.",
  },
  "Power Grid": {
    low: "No GIC concern.",
    medium: "Minor GIC risk. Monitor voltage levels.",
    high: "Elevated GIC risk. Alert grid operators.",
    critical: "Severe GIC risk. Implement protective measures.",
  },
  "Polar Aviation": {
    low: "Polar aviation nominal.",
    medium: "Monitor radiation levels on polar routes.",
    high: "Activate polar route contingency. HF unreliable.",
    critical: "Avoid polar routes. Radiation levels unsafe.",
  },
};

// ── Route ──

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

    // Compute deterministic risk levels and drivers
    const deterministic = computeDeterministicAssessment(data);

    // Try to get AI-generated recommendations
    let aiRecommendations: string[] = [];
    try {
      const prompt = buildRiskRecommendationsPrompt(data);
      const messages = [
        {
          role: "system" as const,
          content: "You are a concise space weather analyst.",
        },
        { role: "user" as const, content: prompt },
      ];
      const rawResponse = await getCloudflareChatResponse(messages);

      // Parse the AI response: each line should be "System: recommendation"
      const lines = rawResponse
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.includes(":"));

      // Map systems to their recommendations
      const systemOrder = [
        "HF Communications",
        "GNSS",
        "LEO Satellite Drag",
        "Power Grid",
        "Polar Aviation",
      ];

      aiRecommendations = systemOrder.map((sys) => {
        const line = lines.find((l) =>
          l.toLowerCase().startsWith(sys.toLowerCase()),
        );
        if (!line) return "";
        // Extract everything after the first colon
        const colonIdx = line.indexOf(":");
        return colonIdx > 0 ? line.slice(colonIdx + 1).trim() : "";
      });
    } catch {
      console.warn("AI risk recommendations failed, using defaults");
    }

    // Merge deterministic levels with recommendations
    const assessments: RiskAssessment[] = deterministic.assessments.map(
      (item, idx) => ({
        system: item.system as any,
        riskLevel: item.riskLevel,
        driver: item.driver,
        recommendation:
          aiRecommendations[idx] ||
          DEFAULT_RECOMMENDATIONS[item.system]?.[item.riskLevel] ||
          "No recommendation available.",
      }),
    );

    return NextResponse.json({
      assessments,
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
