/**
 * Shared Gemini API helpers (free tier – use GEMINI_API_KEY from Google AI Studio).
 * Used by NLP, Predict, Escalate, and Duplicates AI routes.
 */

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

export function getGeminiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set. Get a free key at https://aistudio.google.com/apikey");
  return key;
}

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL || "gemini-2.0-flash";
}

export function getGeminiEmbeddingModel(): string {
  return process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";
}

/**
 * Call Gemini generateContent and parse response as JSON.
 * Strips markdown code fences if present.
 */
export async function callGeminiJson<T>(systemPrompt: string, userPrompt: string): Promise<T> {
  const key = getGeminiKey();
  const model = getGeminiModel();

  const res = await fetch(`${GEMINI_BASE}/models/${model}:generateContent`, {
    method: "POST",
    headers: {
      "x-goog-api-key": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
  });

  const data = (await res.json().catch(() => null)) as any;
  if (!res.ok) {
    const err = data?.error?.message || data?.message || "Gemini request failed";
    throw new Error(err);
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") throw new Error("Invalid Gemini response");

  let raw = text.trim();
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) raw = jsonMatch[1].trim();

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error("Gemini returned non-JSON content");
  }
}

/**
 * Call Gemini generateContent with an image and parse response as JSON.
 * Used for vision (civic issue image analysis).
 */
export async function callGeminiJsonWithImage<T>(
  systemPrompt: string,
  userPrompt: string,
  imageBase64: string,
  mimeType: string
): Promise<T> {
  const key = getGeminiKey();
  const model = getGeminiModel();

  const res = await fetch(`${GEMINI_BASE}/models/${model}:generateContent`, {
    method: "POST",
    headers: {
      "x-goog-api-key": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { inlineData: { mimeType, data: imageBase64 } },
            { text: userPrompt },
          ],
        },
      ],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
  });

  const data = (await res.json().catch(() => null)) as any;
  if (!res.ok) {
    const err = data?.error?.message || data?.message || "Gemini request failed";
    throw new Error(err);
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") throw new Error("Invalid Gemini response");

  let raw = text.trim();
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) raw = jsonMatch[1].trim();

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error("Gemini returned non-JSON content");
  }
}

/**
 * Get embeddings for multiple texts using Gemini embedContent.
 * Free tier: 60 RPM – we throttle with small batches to avoid rate limits.
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const key = getGeminiKey();
  const model = getGeminiEmbeddingModel();
  const url = `${GEMINI_BASE}/models/${model}:embedContent`;

  const BATCH = 10;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH) {
    const chunk = texts.slice(i, i + BATCH);
    const promises = chunk.map((text) =>
      fetch(url, {
        method: "POST",
        headers: {
          "x-goog-api-key": key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: `models/${model}`,
          content: { parts: [{ text }] },
          taskType: "SEMANTIC_SIMILARITY",
        }),
      })
        .then((r) => r.json())
        .then((d: any) => {
          const vals = d?.embedding?.values;
          if (!Array.isArray(vals)) throw new Error("Invalid embedding response");
          return vals as number[];
        })
    );
    const batchResults = await Promise.all(promises);
    results.push(...batchResults);
  }

  return results;
}
