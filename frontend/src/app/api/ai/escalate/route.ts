import { NextResponse } from "next/server";
import { callGeminiJson } from "../gemini";

type EscalateRequest = {
  title: string;
  description?: string;
  category?: string;
  locationName?: string;
  prediction?: {
    urgencyScore?: number;
    expectedResolutionHours?: number;
    slaBreachProbability?: number;
    priorityBand?: string;
  };
};

type EscalateResponse = {
  recommendedLevel: "none" | "ward_officer" | "zonal_officer" | "city_admin";
  reason: string[];
  whatWouldChangeMyMind: string[];
  transparency: {
    signalsUsed: string[];
    signalsNotUsed: string[];
  };
};

const SYSTEM_PROMPT =
  "You are CivicTrack escalation advisor. Recommend escalation conservatively with explainable, auditable reasons. Output STRICT JSON only.";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as EscalateRequest;
    if (!body?.title || typeof body.title !== "string") {
      return NextResponse.json({ success: false, message: "Missing title." }, { status: 400 });
    }

    const userPrompt = [
      "Recommend an escalation level for the municipal issue based on risk and context.",
      "",
      "Escalation path: ward_officer -> zonal_officer -> city_admin.",
      "Return JSON with keys:",
      '- recommendedLevel: "none"|"ward_officer"|"zonal_officer"|"city_admin"',
      "- reason: array of short bullet strings (what evidence justifies escalation)",
      "- whatWouldChangeMyMind: array of short bullets (what additional info would reduce/increase escalation)",
      "- transparency: { signalsUsed: string[], signalsNotUsed: string[] }",
      "",
      `Title: ${body.title}`,
      `Category: ${body.category || "unknown"}`,
      `Location: ${body.locationName || "unknown"}`,
      `Description: ${body.description || ""}`,
      `Prediction: ${JSON.stringify(body.prediction || {})}`,
      "",
      "Rules:",
      "- Do NOT escalate just because the wording is emotional.",
      "- Escalate if SLA breach probability is high OR there is safety risk OR repeated harm.",
      "- If uncertain, choose a lower level and explain what is missing.",
    ].join("\n");

    const out = await callGeminiJson<EscalateResponse>(SYSTEM_PROMPT, userPrompt);

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
