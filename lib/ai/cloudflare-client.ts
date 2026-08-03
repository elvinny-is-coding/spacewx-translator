const CLOUDFLARE_WORKER_AI_API_KEY = process.env.CLOUDFLARE_WORKER_AI_API_KEY;
const CLOUDFLARE_WORKER_AI_ACCOUNT_ID =
  process.env.CLOUDFLARE_WORKER_AI_ACCOUNT_ID;
const MODEL = "@cf/meta/llama-3-8b-instruct";

interface CloudflareAIResponse {
  result?: {
    response?: string;
  };
  success: boolean;
  errors?: any[];
}

export async function getCloudflareSummary(prompt: string): Promise<string> {
  if (!CLOUDFLARE_WORKER_AI_API_KEY || !CLOUDFLARE_WORKER_AI_ACCOUNT_ID) {
    throw new Error("Cloudflare Workers AI credentials not set");
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_WORKER_AI_ACCOUNT_ID}/ai/run/${MODEL}`;

  console.log(`🔍 Cloudflare request to ${MODEL}...`);

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

  const body = await res.text();
  console.log(`Cloudflare response ${res.status}: ${body.slice(0, 300)}`);

  if (!res.ok) {
    throw new Error(`Cloudflare AI error ${res.status}: ${body}`);
  }

  let json: CloudflareAIResponse;
  try {
    json = JSON.parse(body);
  } catch {
    throw new Error(`Cloudflare AI returned non‑JSON: ${body.slice(0, 200)}`);
  }

  if (!json.success || !json.result?.response) {
    throw new Error(
      `Cloudflare AI failed: ${JSON.stringify(json.errors ?? "No response")}`,
    );
  }

  console.log(
    `✅ Cloudflare summary received (${json.result.response.length} chars)`,
  );
  return json.result.response.trim();
}
