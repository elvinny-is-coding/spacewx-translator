interface ChatResponse {
  choices?: { message?: { content?: string } }[];
}

// ── IAM token exchange (for watsonx) ──
async function getIamToken(apiKey: string): Promise<string> {
  const res = await fetch("https://iam.cloud.ibm.com/identity/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "urn:ibm:params:oauth:grant-type:apikey",
      apikey: apiKey,
    }).toString(),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`IAM token request failed: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  if (!data.access_token) {
    throw new Error("No access_token in IAM response");
  }
  return data.access_token as string;
}

// ── Original watsonx function (cron summaries) ──
export async function getGraniteSummary(prompt: string): Promise<string> {
  const apiKey = process.env.WATSONX_API_KEY;
  if (!apiKey) throw new Error("WATSONX_API_KEY is not set");

  const projectId = process.env.WATSONX_PROJECT_ID;
  if (!projectId) throw new Error("WATSONX_PROJECT_ID is not set");

  const modelId =
    process.env.WATSONX_MODEL_ID ||
    "mistralai/mistral-small-3-1-24b-instruct-2503";

  const token = await getIamToken(apiKey);

  const endpoint =
    "https://jp-tok.ml.cloud.ibm.com/ml/v1/text/chat?version=2023-05-29";

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model_id: modelId,
      messages: [
        { role: "system", content: "You are a concise space weather advisor." },
        { role: "user", content: prompt },
      ],
      parameters: {
        decoding_method: "greedy",
        max_new_tokens: 300,
        min_new_tokens: 30,
        stop_sequences: [],
        repetition_penalty: 1.05,
      },
      project_id: projectId,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Granite API error ${res.status}: ${errorText}`);
  }

  const json: ChatResponse = await res.json();
  const text = json.choices?.[0]?.message?.content;
  if (!text?.trim()) throw new Error("Granite returned empty response");
  return text.trim();
}

// ── Groq chat function (used by chatbot) ──
export async function getGroqChatResponse(
  messages: { role: string; content: string }[],
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");

  const modelId = process.env.GROQ_MODEL_ID || "llama-3.1-8b-instant";

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      temperature: 0.3,
      max_tokens: 400,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Groq API error ${res.status}: ${errorText}`);
  }

  const json: ChatResponse = await res.json();
  const text = json.choices?.[0]?.message?.content;
  if (!text?.trim()) throw new Error("Groq returned empty response");
  return text.trim();
}
