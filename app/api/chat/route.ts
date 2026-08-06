import { NextRequest, NextResponse } from "next/server";
import { getCloudflareChatResponse } from "@/lib/ai/cloudflare-client";
import { buildChatContext } from "@/lib/ai/chat-context";
import { buildChatSystemPrompt } from "@/lib/ai/chat-prompt";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import type { SpaceWeatherData } from "@/types/spacewx";
import type { TimelineEvent } from "@/types/timeline";

// ── Per‑audience model selection ──
function getModelForAudience(audience?: string): string | undefined {
  switch (audience) {
    case "general":
      return "@cf/meta/llama-3.2-1b-instruct";
    case "educator":
      return "@cf/meta/llama-3.1-8b-instruct";
    case "technical":
      return "@cf/mistralai/mistral-small-3.1-24b-instruct";
    default:
      return undefined;
  }
}

export async function POST(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";

  const rateLimitResult = checkRateLimit(ip, {
    windowMs: 60_000,
    maxRequests: 10,
  });

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) },
    );
  }

  try {
    const body = await request.json();
    const {
      question,
      data,
      recentEvents,
      history = [],
      audience,
    } = body as {
      question: string;
      data: SpaceWeatherData;
      recentEvents?: TimelineEvent[];
      history?: { role: "user" | "assistant"; content: string }[];
      audience?: string;
    };

    if (!question || !data) {
      return NextResponse.json(
        { error: "Missing 'question' or 'data' in request body." },
        { status: 400 },
      );
    }

    const context = buildChatContext(data, recentEvents);
    const systemPrompt = buildChatSystemPrompt();

    const messages: { role: string; content: string }[] = [
      {
        role: "system",
        content:
          systemPrompt +
          "\n\nHere is the current space weather data:\n" +
          context,
      },
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: question },
    ];

    const model = getModelForAudience(audience);
    const answer = await getCloudflareChatResponse(messages, model);

    return NextResponse.json(
      { answer },
      { headers: getRateLimitHeaders(rateLimitResult) },
    );
  } catch (err: any) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      { error: "Sorry, I couldn't generate a response. Please try again." },
      { status: 500 },
    );
  }
}
