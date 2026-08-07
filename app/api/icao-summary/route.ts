// app/api/icao-summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCloudflareChatResponse } from "@/lib/ai/cloudflare-client";
import { buildIcaoSummaryPrompt } from "@/lib/ai/icao-summary-prompt";

// In-memory cache keyed by advisory number – advisories don't change once issued
const cache = new Map<string, { summary: string; timestamp: number }>();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { advisoryNumber, advisoryText } = body as {
      advisoryNumber: string;
      advisoryText: string;
    };

    if (!advisoryNumber || !advisoryText) {
      return NextResponse.json(
        { error: "Missing 'advisoryNumber' or 'advisoryText'" },
        { status: 400 },
      );
    }

    // Check cache
    const cached = cache.get(advisoryNumber);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({ summary: cached.summary });
    }

    const prompt = buildIcaoSummaryPrompt(advisoryNumber, advisoryText);
    const messages = [
      {
        role: "system" as const,
        content: "You write clear, concise aviation weather briefs.",
      },
      { role: "user" as const, content: prompt },
    ];

    const summary = await getCloudflareChatResponse(messages);

    // Store in cache
    cache.set(advisoryNumber, { summary, timestamp: Date.now() });

    return NextResponse.json({ summary });
  } catch (err: any) {
    console.error("ICAO summary error:", err);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 },
    );
  }
}
