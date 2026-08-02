import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { fetchAlerts } from "@/lib/spacewx/fetchers";
import { normalizeAlerts } from "@/lib/spacewx/normalizers";
import { buildAlertTriagePrompt } from "@/lib/ai/prompts";
import { getGraniteSummary } from "@/lib/ai/granite-client";
import type { Audience } from "@/types/audience";

const AUDIENCES: Audience[] = ["general", "educator", "technical"];

function deterministicAlertSummary(
  alerts: ReturnType<typeof normalizeAlerts>,
): string {
  if (alerts.length === 0) return "No active space weather alerts.";

  const latest = alerts[0];
  const types = [...new Set(alerts.map((a) => a.message.slice(0, 30)))].join(
    ", ",
  );
  return (
    `${alerts.length} active NOAA alert${alerts.length > 1 ? "s" : ""}. ` +
    `The most recent: "${latest.message.slice(0, 120)}". ` +
    `Alert types include: ${types}.`
  );
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch current alerts
    let rawAlerts: unknown;
    try {
      rawAlerts = await fetchAlerts();
    } catch {
      // If even alerts are down, store empty state
      rawAlerts = [];
    }

    const alerts = normalizeAlerts(rawAlerts);
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    for (const audience of AUDIENCES) {
      let summary: string;

      if (alerts.length === 0) {
        summary = "No active space weather alerts at this time.";
      } else {
        const prompt = buildAlertTriagePrompt(
          audience,
          alerts.map((a) => a.message),
        );
        try {
          summary = await getGraniteSummary(prompt);
        } catch (err) {
          console.warn(
            `Granite failed for ${audience}, using deterministic fallback.`,
            err,
          );
          summary = deterministicAlertSummary(alerts);
        }
      }

      // Upsert into daily_summaries
      const { error } = await supabaseAdmin.from("daily_summaries").upsert(
        {
          date: today,
          audience,
          summary,
          alerts_count: alerts.length,
        },
        { onConflict: "date, audience" },
      );

      if (error) {
        console.error(`Failed to upsert summary for ${audience}:`, error);
      }
    }

    return NextResponse.json({
      status: "ok",
      alerts_count: alerts.length,
      generated_for: AUDIENCES,
    });
  } catch (err: any) {
    console.error("Daily summaries cron error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
