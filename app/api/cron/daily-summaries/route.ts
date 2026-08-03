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
    errors[`daily_summaries_${audience}`] = {
      message: error.message,
      hint: error.hint,
      code: error.code,
    };
  } else if (usedProvider === "deterministic") {
    // Surface the Cloudflare failure in the response
    errors[`daily_summaries_${audience}`] = {
      message: "Used deterministic fallback — Cloudflare failed",
      cfError,
    };
  }
}
