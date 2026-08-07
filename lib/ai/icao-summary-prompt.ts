// lib/ai/icao-summary-prompt.ts

/**
 * Build a prompt that asks the AI to rewrite an ICAO advisory text
 * into 2‑3 plain‑English sentences suitable for flight dispatchers.
 *
 * @param advisoryNumber The ICAO advisory number (for context)
 * @param advisoryText   The raw advisory text from the ICAO feed
 */
export function buildIcaoSummaryPrompt(
  advisoryNumber: string,
  advisoryText: string,
): string {
  return [
    "System: You are an aviation weather briefer. Rewrite the following ICAO space weather advisory into 2‑3 plain‑English sentences that a flight dispatcher or pilot can quickly understand.",
    "",
    "Keep the key information: the phenomenon, affected region, altitude range, and any operational recommendations.",
    "Use simple, direct language. Do NOT invent any new data or make predictions beyond what the advisory states.",
    "Return ONLY the rewritten summary text, no JSON, no markdown.",
    "",
    `Advisory #${advisoryNumber}:`,
    advisoryText,
  ].join("\n");
}
