// app/api/classroom/evaluate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCloudflareChatResponse } from "@/lib/ai/cloudflare-client";
import { buildClassroomEvaluationPrompt } from "@/lib/ai/classroom-evaluation-prompt";
import { getScenarioById } from "@/data/scenarios";
import type { MissionRole, Evaluation } from "@/types/classroom";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role, scenarioId, choice } = body as {
      role: MissionRole;
      scenarioId: string;
      choice: string;
    };

    if (!role || !scenarioId || !choice) {
      return NextResponse.json(
        { error: "Missing 'role', 'scenarioId', or 'choice' in request body" },
        { status: 400 },
      );
    }

    const scenario = getScenarioById(scenarioId);
    if (!scenario) {
      return NextResponse.json(
        { error: `Scenario not found: ${scenarioId}` },
        { status: 404 },
      );
    }

    const deterministicVerdict = scenario.deterministicVerdict;
    const match = choice === deterministicVerdict;

    let narrative: string;
    try {
      const prompt = buildClassroomEvaluationPrompt(
        role,
        scenario,
        choice,
        deterministicVerdict,
        match,
      );
      const messages = [
        {
          role: "system" as const,
          content: "You are a supportive space weather educator.",
        },
        { role: "user" as const, content: prompt },
      ];
      narrative = await getCloudflareChatResponse(messages);
    } catch {
      // Deterministic fallback narrative
      narrative = match
        ? `Your choice of "${choice}" matches the operational recommendation. The conditions — ${scenario.snapshot.kp !== null ? `Kp ${scenario.snapshot.kp}` : "unknown Kp"}, ${scenario.snapshot.noaaScaleG ? `G${scenario.snapshot.noaaScaleG}` : "no G‑scale"}, ${scenario.snapshot.noaaScaleR ? `R${scenario.snapshot.noaaScaleR}` : "no R‑scale"}, ${scenario.snapshot.noaaScaleS ? `S${scenario.snapshot.noaaScaleS}` : "no S‑scale"} — support this decision. ${scenario.historicalOutcome ?? ""}`
        : `You chose "${choice}", but the recommended action based on the NOAA scales (${scenario.snapshot.kp !== null ? `Kp ${scenario.snapshot.kp}` : "unknown Kp"}, ${scenario.snapshot.noaaScaleG ? `G${scenario.snapshot.noaaScaleG}` : "no G‑scale"}, ${scenario.snapshot.noaaScaleR ? `R${scenario.snapshot.noaaScaleR}` : "no R‑scale"}, ${scenario.snapshot.noaaScaleS ? `S${scenario.snapshot.noaaScaleS}` : "no S‑scale"}) would be "${deterministicVerdict}". ${scenario.historicalOutcome ?? ""}`;
    }

    const evaluation: Evaluation = {
      role,
      scenarioId,
      studentChoice: choice,
      deterministicVerdict,
      match,
      narrative,
      historicalOutcome: scenario.historicalOutcome,
    };

    return NextResponse.json({ evaluation });
  } catch (err: any) {
    console.error("Classroom evaluation error:", err);
    return NextResponse.json(
      { error: "Failed to evaluate classroom decision" },
      { status: 500 },
    );
  }
}
