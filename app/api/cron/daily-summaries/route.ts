import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  fetchKpIndex,
  fetchSolarWindPlasma,
  fetchSolarWindMag,
  fetchAlerts,
  fetchNoaaScales,
  fetchDonkiFlares,
  fetchDonkiCMEs,
  fetchOvation,
} from "@/lib/spacewx/fetchers";
import {
  normalizeKp,
  normalizeSolarWind,
  normalizeAlerts,
  normalizeNoaaScaleG,
  normalizeFlares,
  normalizeCMEs,
} from "@/lib/spacewx/normalizers";
import { buildDailyBriefingPrompt } from "@/lib/ai/prompts";
import { getGraniteSummary } from "@/lib/ai/granite-client";
import { getCloudflareSummary } from "@/lib/ai/cloudflare-client";
import { reshapeOvationGrid } from "@/lib/aurora-utils";
import { getSuggestedPrompts } from "@/lib/suggested-prompts";
import type { Audience } from "@/types/audience";
import type { NotableEvent, DailyBriefingInput } from "@/lib/ai/prompts";
import type { SpaceWeatherData } from "@/types/spacewx";

const AUDIENCES: Audience[] = ["general", "educator", "technical"];

// ── Helpers (unchanged) ──

function parseFlareClass(
  classType: string,
): { letter: string; number: number } | null {
  const match = classType.match(/^([CXM])(\d+\.?\d*)$/i);
  if (!match) return null;
  return { letter: match[1].toUpperCase(), number: parseFloat(match[2]) };
}

function isNotableFlare(classType: string): boolean {
  const parsed = parseFlareClass(classType);
  if (!parsed) return false;
  return parsed.letter === "X" || (parsed.letter === "M" && parsed.number >= 5);
}

function isNotableCME(speed: number | null, note: string | null): boolean {
  if (speed !== null && speed > 800) return true;
  if (note && note.toLowerCase().includes("earth")) return true;
  return false;
}

function extractScales(scales: any): {
  g: number | null;
  r: number | null;
  s: number | null;
} {
  const result = {
    g: null as number | null,
    r: null as number | null,
    s: null as number | null,
  };
  if (scales && typeof scales === "object") {
    if (scales.G?.Scale != null) result.g = parseInt(scales.G.Scale, 10);
    if (scales.R?.Scale != null) result.r = parseInt(scales.R.Scale, 10);
    if (scales.S?.Scale != null) result.s = parseInt(scales.S.Scale, 10);
  }
  return result;
}

function buildAlertSummaryText(
  scales: { g: number | null; r: number | null; s: number | null },
  alerts: ReturnType<typeof normalizeAlerts>,
): string {
  const parts: string[] = [];
  if (scales.g !== null) parts.push(`G-scale: G${scales.g}`);
  if (scales.r !== null) parts.push(`R-scale: R${scales.r}`);
  if (scales.s !== null) parts.push(`S-scale: S${scales.s}`);

  if (alerts.length > 0) {
    const snippets = alerts.slice(0, 3).map((a) => a.message.slice(0, 120));
    parts.push(`Sample alerts: ${snippets.join("; ")}`);
  } else {
    parts.push("No active alerts");
  }
  return parts.join(". ");
}

function deterministicDailyBriefing(input: DailyBriefingInput): string {
  const lines: string[] = [];
  if (input.kp !== null) lines.push(`Kp ${input.kp.toFixed(1)}`);
  if (input.gScale !== null) lines.push(`G${input.gScale}`);
  if (input.rScale !== null) lines.push(`R${input.rScale}`);
  if (input.sScale !== null) lines.push(`S${input.sScale}`);
  if (input.solarWindSpeed !== null)
    lines.push(
      `Solar wind: ${input.solarWindSpeed} km/s, Bz ${input.solarWindBz ?? "?"} nT`,
    );
  if (input.notableFlares.length > 0) {
    lines.push(
      `Notable flares: ${input.notableFlares.map((f) => f.label).join(", ")}`,
    );
  } else if (input.backgroundFlareCount > 0) {
    lines.push(`Flares: ${input.backgroundFlareCount} minor events`);
  }
  if (input.notableCMEs.length > 0) {
    lines.push(
      `Notable CMEs: ${input.notableCMEs.map((c) => c.label).join(", ")}`,
    );
  }
  if (input.alertSummary) lines.push(input.alertSummary);
  return lines.join("\n");
}

// ── Route ──

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const errors: Record<string, any> = {};

  try {
    // Fetch all sources, including OVATION
    const [kpR, plasmaR, magR, alertsR, scalesR, flaresR, cmesR, ovationR] =
      await Promise.allSettled([
        fetchKpIndex(),
        fetchSolarWindPlasma(),
        fetchSolarWindMag(),
        fetchAlerts(),
        fetchNoaaScales(),
        fetchDonkiFlares(),
        fetchDonkiCMEs(),
        fetchOvation(),
      ]);

    const kp = kpR.status === "fulfilled" ? normalizeKp(kpR.value) : null;
    const solarWind =
      plasmaR.status === "fulfilled" && magR.status === "fulfilled"
        ? normalizeSolarWind(plasmaR.value, magR.value)
        : null;
    const alerts =
      alertsR.status === "fulfilled" ? normalizeAlerts(alertsR.value) : [];
    const scalesRaw = scalesR.status === "fulfilled" ? scalesR.value : null;
    const scales = extractScales(scalesRaw);

    // Flares – filter notable and count background
    let notableFlares: NotableEvent[] = [];
    let backgroundFlareCount = 0;
    let allFlares: ReturnType<typeof normalizeFlares> = [];
    if (flaresR.status === "fulfilled") {
      allFlares = normalizeFlares(flaresR.value);
      for (const f of allFlares) {
        if (isNotableFlare(f.classType)) {
          notableFlares.push({ label: f.classType, time: f.beginTime });
        } else {
          backgroundFlareCount++;
        }
      }
    }

    // CMEs – filter notable and count background
    let notableCMEs: NotableEvent[] = [];
    let backgroundCMECount = 0;
    let allCMEs: ReturnType<typeof normalizeCMEs> = [];
    if (cmesR.status === "fulfilled") {
      allCMEs = normalizeCMEs(cmesR.value);
      for (const c of allCMEs) {
        if (isNotableCME(c.speed, c.note)) {
          notableCMEs.push({
            label:
              `CME ${c.speed ? `${c.speed} km/s` : ""} ${c.note ?? ""}`.trim(),
            time: c.startTime,
          });
        } else {
          backgroundCMECount++;
        }
      }
    }

    const alertSummary = buildAlertSummaryText(scales, alerts);

    // Build a SpaceWeatherData snapshot for prompt generation
    const spaceWeatherData: SpaceWeatherData = {
      kp,
      kpForecast: null,
      solarWind,
      alerts,
      flares: allFlares,
      cmes: allCMEs,
      noaaScaleG: scales.g,
      lastUpdated: new Date().toISOString(),
      warnings: [],
    };

    // ── Cache alerts into latest_alerts ──
    if (alertsR.status === "fulfilled") {
      const { error: alertCacheErr } = await supabaseAdmin
        .from("latest_alerts")
        .upsert(
          { id: 1, alerts: alerts, updated_at: new Date().toISOString() },
          { onConflict: "id" },
        );
      if (alertCacheErr) {
        console.error("Failed to cache alerts:", alertCacheErr);
        errors.latest_alerts = {
          message: alertCacheErr.message,
          hint: alertCacheErr.hint,
          code: alertCacheErr.code,
        };
      }
    }

    // ── Cache OVATION data ──
    if (ovationR.status === "fulfilled") {
      try {
        const grid = reshapeOvationGrid(ovationR.value);
        const { error: ovationCacheErr } = await supabaseAdmin
          .from("latest_ovation")
          .upsert(
            {
              id: 1,
              grid: grid.grid,
              forecast_time: grid.forecastTime,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" },
          );
        if (ovationCacheErr) {
          console.error("Failed to cache OVATION:", ovationCacheErr);
          errors.latest_ovation = {
            message: ovationCacheErr.message,
            hint: ovationCacheErr.hint,
            code: ovationCacheErr.code,
          };
        }
      } catch (err: any) {
        console.warn("OVATION reshape/insert failed:", err);
        errors.latest_ovation = { message: err.message ?? "Unknown error" };
      }
    }

    // ── Generate daily summaries ──
    const briefingInput: DailyBriefingInput = {
      kp,
      gScale: scales.g,
      rScale: scales.r,
      sScale: scales.s,
      solarWindSpeed: solarWind?.speed ?? null,
      solarWindBz: solarWind?.bz ?? null,
      notableFlares,
      backgroundFlareCount,
      notableCMEs,
      backgroundCMECount,
      alertSummary,
    };

    const today = new Date().toISOString().slice(0, 10);

    for (const audience of AUDIENCES) {
      let summary: string;
      let usedProvider: "granite" | "cloudflare" | "deterministic" =
        "deterministic";
      let cfError: string | null = null;
      const prompt = buildDailyBriefingPrompt(audience, briefingInput);

      try {
        summary = await getGraniteSummary(prompt);
        usedProvider = "granite";
      } catch (graniteErr: any) {
        try {
          summary = await getCloudflareSummary(prompt);
          usedProvider = "cloudflare";
        } catch (cloudflareErr: any) {
          cfError = cloudflareErr?.message ?? String(cloudflareErr);
          summary = deterministicDailyBriefing(briefingInput);
        }
      }

      // Generate audience-specific suggested prompts from the live data
      const prompts = getSuggestedPrompts(spaceWeatherData, audience);

      const { error } = await supabaseAdmin.from("daily_summaries").upsert(
        {
          date: today,
          audience,
          summary,
          alerts_count: alerts.length,
          suggested_prompts: prompts,
        },
        { onConflict: "date, audience" },
      );

      if (error) {
        errors[`daily_summaries_${audience}`] = {
          message: error.message,
          hint: error.hint,
          code: error.code,
        };
      } else if (usedProvider === "deterministic") {
        errors[`daily_summaries_${audience}`] = {
          message: "Used deterministic fallback — Cloudflare failed",
          cfError,
        };
      }
    }

    return NextResponse.json({
      status: "ok",
      alerts_count: alerts.length,
      generated_for: AUDIENCES,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    console.error("Daily summaries cron error:", err);
    return NextResponse.json(
      {
        error: "Internal server error",
        detail: err.message ?? "Unknown error",
      },
      { status: 500 },
    );
  }
}
