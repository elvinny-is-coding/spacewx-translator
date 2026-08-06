// app/api/cme-impact/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCloudflareChatResponse } from "@/lib/ai/cloudflare-client";
import { buildCmeImpactPrompt } from "@/lib/ai/cme-impact-prompt";
import type { SpaceWeatherData } from "@/types/spacewx";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cmeSpeed, halfAngle, isEarthDirected, estArrival, data } = body as {
      cmeSpeed: number;
      halfAngle: number | null;
      isEarthDirected: boolean;
      estArrival: string;
      data: SpaceWeatherData;
    };

    if (!cmeSpeed || !estArrival || !data) {
      return NextResponse.json(
        { error: "Missing required fields: cmeSpeed, estArrival, data" },
        { status: 400 },
      );
    }

    let narrative: string;
    try {
      const prompt = buildCmeImpactPrompt(
        cmeSpeed,
        halfAngle,
        isEarthDirected,
        estArrival,
        data,
      );
      const messages = [
        {
          role: "system" as const,
          content: "You are a concise space weather analyst.",
        },
        { role: "user" as const, content: prompt },
      ];
      narrative = await getCloudflareChatResponse(messages);
    } catch {
      // Deterministic fallback
      const speed = cmeSpeed;
      let severity = "minor to moderate";
      if (speed > 1500) severity = "severe (G4–G5)";
      else if (speed > 1000) severity = "strong (G2–G3)";
      else if (speed > 700) severity = "moderate (G1–G2)";
      narrative = `A CME traveling at ${cmeSpeed} km/s is expected to arrive around ${estArrival}. It may produce ${severity} geomagnetic storming with possible aurora at mid‑latitudes and minor satellite drag.`;
    }

    return NextResponse.json({ narrative });
  } catch (err: any) {
    console.error("CME impact error:", err);
    return NextResponse.json(
      { error: "Failed to generate CME impact narrative" },
      { status: 500 },
    );
  }
}
