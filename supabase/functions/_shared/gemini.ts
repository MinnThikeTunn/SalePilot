import { GoogleGenAI } from "npm:@google/genai@2.4.0";

let client: GoogleGenAI | null = null;

const DEFAULT_EMBEDDING_MODEL = Deno.env.get("GEMINI_EMBEDDING_MODEL") || "text-embedding-004";

export function getGeminiClient(): GoogleGenAI {
  if (!client) {
    const key = Deno.env.get("GEMINI_API_KEY");
    if (!key || key.includes("MY_GEMINI_API_KEY")) {
      throw new Error("GEMINI_API_KEY is missing or invalid.");
    }
    client = new GoogleGenAI({
      apiKey: key,
      httpOptions: { headers: { "User-Agent": "sales-brain-edge" } },
    });
  }
  return client;
}

export async function embedText(text: string): Promise<number[]> {
  const ai = getGeminiClient();
  const response = await ai.models.embedContent({
    model: DEFAULT_EMBEDDING_MODEL,
    contents: [{ parts: [{ text }] }],
    config: {
      outputDimensionality: 768,
    },
  });

  const values = response.embeddings?.[0]?.values;
  if (!values?.length) {
    throw new Error("Gemini embedding response did not include values.");
  }

  return values;
}
