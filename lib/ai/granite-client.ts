interface GraniteChatResponse {
  choices?: { message?: { content?: string } }[];
}

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

export async function getGraniteSummary(prompt: string): Promise<string> {
  const apiKey = process.env.WATSONX_API_KEY;
  if (!apiKey) throw new Error("WATSONX_API_KEY is not set");

  const projectId = process.env.WATSONX_PROJECT_ID;
  if (!projectId) throw new Error("WATSONX_PROJECT_ID is not set");

  const modelId = process.env.WATSONX_MODEL_ID || "ibm/granite-3-8b-instruct";

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
        {
          role: "system",
          content:
            "You are a concise space weather advisor. Provide exactly the summary requested by the user. Do not add extra commentary.",
        },
        {
          role: "user",
          content: prompt,
        },
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

  const json: GraniteChatResponse = await res.json();
  const text = json.choices?.[0]?.message?.content;

  if (!text || text.trim().length === 0) {
    throw new Error("Granite returned empty response");
  }

  return text.trim();
}
