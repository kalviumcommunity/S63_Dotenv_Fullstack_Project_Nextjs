import { NextResponse } from "next/server";
import { callGeminiJson } from "../gemini";

type PredictRequest = {
  title: string;
  description?: string;
  category?: string;
  locationName?: string;
  vision?: {
    model?: string;
    topLabel?: string;
    topScore?: number;
  };
};

type PredictResponse = {
  urgencyScore: number; // 0-100
  expectedResolutionHours: number;
  slaBreachProbability: number; // 0-1
  priorityBand: "low" | "medium" | "high" | "critical";
  rationale: string[];
  keyFactors: Array<{ factor: string; impact: "low" | "medium" | "high" }>;
  recommendedActions: string[];
  caveats: string[];
};

const SYSTEM_PROMPT =
  "You are CivicTrack AI. Predict urgency & SLA risk for municipal issue triage. Output STRICT JSON only. No markdown.";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as PredictRequest;
    if (!body?.title || typeof body.title !== "string") {
      return NextResponse.json({ success: false, message: "Missing title." }, { status: 400 });
    }

    const userPrompt = [
      "Given the following reported civic issue, predict urgency and expected resolution time.",
      "",
      "Return JSON with keys:",
      "- urgencyScore: number 0-100",
      "- expectedResolutionHours: number (positive)",
      "- slaBreachProbability: number 0-1",
      '- priorityBand: "low"|"medium"|"high"|"critical"',
      "- rationale: array of short bullet strings explaining why",
      '- keyFactors: array of { factor: string, impact: "low"|"medium"|"high" }',
      "- recommendedActions: array of strings (operational next steps)",
      "- caveats: array of strings (uncertainty/assumptions)",
      "",
      `Title: ${body.title}`,
      `Category: ${body.category || "unknown"}`,
      `Location: ${body.locationName || "unknown"}`,
      `Description: ${body.description || ""}`,
      body.vision
        ? `Vision: topLabel=${body.vision.topLabel || "n/a"}, topScore=${body.vision.topScore ?? "n/a"}, model=${body.vision.model || "n/a"}`
        : "Vision: none",
      "",
      "Constraints:",
      "- Be conservative: do not over-escalate without evidence.",
      "- Use transparent, explainable reasoning tied to the provided text/signals.",
    ].join("\n");

    const out = await callGeminiJson<PredictResponse>(SYSTEM_PROMPT, userPrompt);

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
