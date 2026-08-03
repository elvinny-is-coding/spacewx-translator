for (const audience of AUDIENCES) {
  let summary: string;
  let usedProvider: "granite" | "cloudflare" | "deterministic" =
    "deterministic";
  const prompt = buildDailyBriefingPrompt(audience, briefingInput);
  let cfError: string | null = null;

  // Try Granite → Cloudflare → deterministic
  try {
    summary = await getGraniteSummary(prompt);
    usedProvider = "granite";
  } catch (graniteErr: any) {
    console.warn(`Granite failed for ${audience}`, graniteErr);
    try {
      summary = await getCloudflareSummary(prompt);
      usedProvider = "cloudflare";
    } catch (cloudflareErr: any) {
      console.warn(`Cloudflare failed for ${audience}`, cloudflareErr);
      cfError = cloudflareErr?.message ?? String(cloudflareErr);
      summary = deterministicDailyBriefing(briefingInput);
    }
  }

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
