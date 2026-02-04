import { NextResponse } from "next/server";
import { callGeminiJson } from "../gemini";

type NlpRequest = {
  text: string;
  locationName?: string;
};

type NlpResponse = {
  summary: string;
  sentiment: "negative" | "neutral" | "positive";
  urgency: "low" | "medium" | "high";
  entities: Array<{ type: "location" | "department" | "landmark" | "time" | "other"; value: string }>;
  suggestedDepartment?: string;
  keySignals: string[];
  limitations: string[];
};

const SYSTEM_PROMPT =
  "You are CivicTrack AI. Be precise, explainable, and safe. Output STRICT JSON only. No markdown.";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as NlpRequest;
    if (!body?.text || typeof body.text !== "string") {
      return NextResponse.json({ success: false, message: "Missing text." }, { status: 400 });
    }

    const locationLine = body.locationName ? `Location context: ${body.locationName}` : "Location context: unknown";

    const userPrompt = [
      "Analyze the citizen complaint text for a civic-tech grievance platform.",
      locationLine,
      "",
      "Return JSON with keys:",
      "- summary: string (<= 35 words)",
      '- sentiment: "negative" | "neutral" | "positive"',
      '- urgency: "low" | "medium" | "high"',
      '- entities: array of { type: "location"|"department"|"landmark"|"time"|"other", value: string }',
      "- suggestedDepartment: optional string",
      "- keySignals: array of short strings explaining which phrases/claims drove urgency/sentiment",
      "- limitations: array of short strings about uncertainty or missing info",
      "",
      "Complaint text:",
      body.text,
    ].join("\n");

    const out = await callGeminiJson<NlpResponse>(SYSTEM_PROMPT, userPrompt);

    return NextResponse.json({
      success: true,
      data: out,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("GEMINI_API_KEY") ? 500 : 502;
    return NextResponse.json({ success: false, message }, { status });
  }
}
