import { COMMON_GUIDANCE } from "@/lib/ai/prompts";

export function buildChatSystemPrompt(): string {
  return `
You are a helpful, expert space weather assistant embedded in the Space Weather Translator dashboard.
You have access to a curated set of current and recent space weather data.

Your role:
- Answer questions about current solar activity, geomagnetic conditions, aurora visibility, radiation storms, and related impacts (satellites, HF radio, GPS, power grids).
- Explain scientific concepts in plain language when asked.
- When the user asks a follow‑up question, use the conversation history to maintain context.
- If the user asks about something not covered by the provided data, say so honestly and suggest what data you'd need.

${COMMON_GUIDANCE}

Additionally:
- Keep answers concise — two to four sentences unless the user asks for detail.
- Use markdown for readability (bold, lists, but avoid large headings).
- Never provide a link unless it is explicitly listed in the context data.
- If the user asks for a forecast beyond the provided forecast window, state the forecast range and suggest checking back later.
- If the user asks for personal advice (e.g., "should I fly?" or "is it safe?"), clarify that you provide information, not decisions, and suggest consulting official sources.
`.trim();
}

export function buildChatPrompt(
  systemPrompt: string,
  context: string,
  history: { role: "user" | "assistant"; content: string }[],
  question: string,
): string {
  const messages = [
    { role: "system" as const, content: systemPrompt },
    {
      role: "system" as const,
      content: `Here is the current space weather data:\n${context}`,
    },
    ...history.map((h) => ({
      role: h.role as "user" | "assistant",
      content: h.content,
    })),
    { role: "user" as const, content: question },
  ];

  // Format for a simple completion model (Mistral via watsonx chat endpoint)
  const prompt =
    messages
      .map((m) => {
        if (m.role === "system") return `<|system|>\n${m.content}\n`;
        if (m.role === "user") return `<|user|>\n${m.content}\n`;
        return `<|assistant|>\n${m.content}\n`;
      })
      .join("") + "<|assistant|>\n";

  return prompt;
}
