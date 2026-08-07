// app/api/anomaly-readiness/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCloudflareChatResponse } from "@/lib/ai/cloudflare-client";
import { buildAnomalyReadinessPrompt } from "@/lib/ai/anomaly-readiness-prompt";
import type { SpaceWeatherData } from "@/types/spacewx";
import type {
  Subsystem,
  ReadinessLevel,
  ReadinessAssessment,
} from "@/types/anomaly-readiness";

// ── Deterministic readiness computation ──

function computeDeterministicReadiness(data: SpaceWeatherData): {
  subsystem: Subsystem;
  level: ReadinessLevel;
  driver: string;
}[] {
  const kp = data.kp ?? 0;
  const rScale = data.noaaScaleR ?? 0;
  const sScale = data.noaaScaleS ?? 0;
  const gScale = data.noaaScaleG ?? 0;
  const hasXFlare = data.flares.some((f) =>
    f.classType.toUpperCase().startsWith("X"),
  );

  function gnssLevel(): ReadinessLevel {
    if (kp >= 7 || gScale >= 2) return "high";
    if (kp >= 5) return "medium";
    return "low";
  }

  function starTrackerLevel(): ReadinessLevel {
    if (sScale >= 2) return "high";
    if (sScale >= 1) return "medium";
    return "low";
  }

  function commsLevel(): ReadinessLevel {
    if (rScale >= 2) return "high";
    if (rScale >= 1 || hasXFlare) return "medium";
    return "low";
  }

  function dragLevel(): ReadinessLevel {
    if (gScale >= 2) return "high";
    if (gScale >= 1 || kp >= 5) return "medium";
    return "low";
  }

  function seuLevel(): ReadinessLevel {
    if (sScale >= 2) return "high";
    if (sScale >= 1) return "medium";
    return "low";
  }

  return [
    {
      subsystem: "GNSS",
      level: gnssLevel(),
      driver:
        kp >= 7
          ? `Kp ${kp.toFixed(1)} scintillation`
          : kp >= 5
            ? `Kp ${kp.toFixed(1)}`
            : "Quiet ionosphere",
    },
    {
      subsystem: "Star Tracker",
      level: starTrackerLevel(),
      driver:
        sScale >= 2
          ? `S${sScale} radiation`
          : sScale >= 1
            ? `S${sScale} radiation`
            : "Normal",
    },
    {
      subsystem: "Communications",
      level: commsLevel(),
      driver:
        rScale >= 2
          ? `R${rScale} blackout`
          : rScale >= 1
            ? `R${rScale} blackout`
            : hasXFlare
              ? "X‑class flare"
              : "Normal",
    },
    {
      subsystem: "Satellite Drag",
      level: dragLevel(),
      driver:
        gScale >= 2
          ? `G${gScale} storm`
          : gScale >= 1
            ? `G${gScale} storm`
            : kp >= 5
              ? `Kp ${kp.toFixed(1)}`
              : "Normal",
    },
    {
      subsystem: "Radiation SEU",
      level: seuLevel(),
      driver:
        sScale >= 2
          ? `S${sScale} radiation`
          : sScale >= 1
            ? `S${sScale} radiation`
            : "Normal",
    },
  ];
}

// ── Default recommendations when AI fails ──

const DEFAULT_RECOMMENDATIONS: Record<
  Subsystem,
  Record<ReadinessLevel, string>
> = {
  GNSS: {
    low: "GNSS nominal.",
    medium: "Add 1–3 m margin to positioning solutions.",
    high: "GNSS accuracy degraded. Use augmentation systems.",
    critical: "GNSS unreliable. Delay precision operations.",
  },
  "Star Tracker": {
    low: "Star tracker nominal.",
    medium: "Increased noise possible at high latitudes.",
    high: "Consider attitude hold mode for critical maneuvers.",
    critical: "Star tracker may be unreliable. Use backup attitude sensors.",
  },
  Communications: {
    low: "Communications nominal.",
    medium: "Monitor HF propagation; minor degradation possible.",
    high: "Switch to UHF relay. HF unreliable on sunlit side.",
    critical: "Communications blackout expected. Use stored commands.",
  },
  "Satellite Drag": {
    low: "Drag nominal.",
    medium: "Minor drag increase. Monitor orbit parameters.",
    high: "Significant drag increase. Plan orbit maintenance.",
    critical: "Severe drag. Immediate orbit adjustment required.",
  },
  "Radiation SEU": {
    low: "Single‑event upset risk low.",
    medium: "Monitor SEU rates. Consider safe modes for critical systems.",
    high: "Elevated SEU risk. Halt non‑essential operations.",
    critical: "Severe SEU risk. Enter safe mode.",
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

    // Compute deterministic levels and drivers
    const deterministic = computeDeterministicReadiness(data);

    // Try to get AI-generated recommendations
    let aiRecommendations: string[] = [];
    try {
      const prompt = buildAnomalyReadinessPrompt(data);
      const messages = [
        {
          role: "system" as const,
          content: "You are a concise spacecraft operations analyst.",
        },
        { role: "user" as const, content: prompt },
      ];
      const rawResponse = await getCloudflareChatResponse(messages);

      const lines = rawResponse
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.includes(":"));

      const systemOrder: Subsystem[] = [
        "GNSS",
        "Star Tracker",
        "Communications",
        "Satellite Drag",
        "Radiation SEU",
      ];

      aiRecommendations = systemOrder.map((sys) => {
        const line = lines.find((l) =>
          l.toLowerCase().startsWith(sys.toLowerCase()),
        );
        if (!line) return "";
        const colonIdx = line.indexOf(":");
        return colonIdx > 0 ? line.slice(colonIdx + 1).trim() : "";
      });
    } catch {
      console.warn(
        "AI anomaly readiness recommendations failed, using defaults",
      );
    }

    // Merge deterministic levels with recommendations
    const assessments: ReadinessAssessment[] = deterministic.map(
      (item, idx) => ({
        subsystem: item.subsystem,
        level: item.level,
        driver: item.driver,
        recommendation:
          aiRecommendations[idx] ||
          DEFAULT_RECOMMENDATIONS[item.subsystem]?.[item.level] ||
          "No recommendation available.",
      }),
    );

    return NextResponse.json({
      assessments,
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Anomaly readiness error:", err);
    return NextResponse.json(
      { error: "Failed to generate anomaly readiness assessment" },
      { status: 500 },
    );
  }
}
