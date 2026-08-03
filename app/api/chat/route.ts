import { NextRequest, NextResponse } from "next/server";
import { getGroqChatResponse } from "@/lib/ai/granite-client";
import { buildChatContext } from "@/lib/ai/chat-context";
import { buildChatSystemPrompt } from "@/lib/ai/chat-prompt";
import type { SpaceWeatherData } from "@/types/spacewx";
import type { TimelineEvent } from "@/types/timeline";

// ── Simple in‑memory rate limiter (upgrade to Upstash Redis for production) ──
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  entry.count++;
  return true;
}

// ── Chat handler ──
export async function POST(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();
    const {
      question,
      data,
      recentEvents,
      history = [],
    } = body as {
      question: string;
      data: SpaceWeatherData;
      recentEvents?: TimelineEvent[];
      history?: { role: "user" | "assistant"; content: string }[];
    };

    if (!question || !data) {
      return NextResponse.json(
        { error: "Missing 'question' or 'data' in request body." },
        { status: 400 },
      );
    }

    // Build context block
    const context = buildChatContext(data, recentEvents);
    const systemPrompt = buildChatSystemPrompt();

    // Build messages array for Groq
    const messages: { role: string; content: string }[] = [
      {
        role: "system",
        content:
          systemPrompt +
          "\n\nHere is the current space weather data:\n" +
          context,
      },
      ...history.map((h) => ({
        role: h.role,
        content: h.content,
      })),
      { role: "user", content: question },
    ];

    // Call Groq with the full messages array
    const answer = await getGroqChatResponse(messages);

    return NextResponse.json({ answer });
  } catch (err: any) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      { error: "Sorry, I couldn't generate a response. Please try again." },
      { status: 500 },
    );
  }
}
