const CLOUDFLARE_WORKER_AI_API_KEY = process.env.CLOUDFLARE_WORKER_AI_API_KEY;
const CLOUDFLARE_WORKER_AI_ACCOUNT_ID =
  process.env.CLOUDFLARE_WORKER_AI_ACCOUNT_ID;
const DEFAULT_MODEL = "@cf/meta/llama-3.1-8b-instruct";

interface CloudflareAIResponse {
  result?: {
    response?: string;
  };
  success: boolean;
  errors?: any[];
}

// ── Original function – used by cron summaries (unchanged) ──

export async function getCloudflareSummary(prompt: string): Promise<string> {
  if (!CLOUDFLARE_WORKER_AI_API_KEY || !CLOUDFLARE_WORKER_AI_ACCOUNT_ID) {
    throw new Error("Cloudflare Workers AI credentials not set");
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_WORKER_AI_ACCOUNT_ID}/ai/run/${DEFAULT_MODEL}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CLOUDFLARE_WORKER_AI_API_KEY}`,
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: "You are a concise space weather advisor." },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Cloudflare AI error ${res.status}: ${errorText}`);
  }

  const json: CloudflareAIResponse = await res.json();
  if (!json.success || !json.result?.response) {
    throw new Error(
      `Cloudflare AI failed: ${JSON.stringify(json.errors ?? "No response")}`,
    );
  }

  return json.result.response.trim();
}

// ── New function – used by the chat API (accepts full messages array + optional model) ──

export async function getCloudflareChatResponse(
  messages: { role: string; content: string }[],
  model?: string,
): Promise<string> {
  if (!CLOUDFLARE_WORKER_AI_API_KEY || !CLOUDFLARE_WORKER_AI_ACCOUNT_ID) {
    throw new Error("Cloudflare Workers AI credentials not set");
  }

  const selectedModel = model || DEFAULT_MODEL;
  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_WORKER_AI_ACCOUNT_ID}/ai/run/${selectedModel}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CLOUDFLARE_WORKER_AI_API_KEY}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Cloudflare AI error ${res.status}: ${errorText}`);
  }

  const json: CloudflareAIResponse = await res.json();
  if (!json.success || !json.result?.response) {
    throw new Error(
      `Cloudflare AI failed: ${JSON.stringify(json.errors ?? "No response")}`,
    );
  }

  return json.result.response.trim();
}
