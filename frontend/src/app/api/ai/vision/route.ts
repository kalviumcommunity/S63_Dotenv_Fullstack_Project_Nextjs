import { NextResponse } from "next/server";
import { callGeminiJsonWithImage } from "../gemini";

type VisionBox = { xmin: number; ymin: number; xmax: number; ymax: number };

/** Response shape we ask Gemini to return for civic issue image analysis */
type GeminiVisionResponse = {
  objects?: Array<{ label: string; confidence: number }>;
  suggestedCategory?: string;
  suggestedDepartment?: string;
};

function suggestFromLabel(label: string): { category?: string; department?: string } {
  const l = label.toLowerCase();
  if (l.includes("pothole") || l.includes("road") || l.includes("damage")) {
    return { category: "ROAD_DAMAGE", department: "Roads & Transport" };
  }
  if (l.includes("garbage") || l.includes("trash") || l.includes("waste") || l.includes("debris")) {
    return { category: "GARBAGE", department: "Sanitation" };
  }
  if (l.includes("street") && l.includes("light")) {
    return { category: "STREETLIGHT", department: "Electricity" };
  }
  if (l.includes("water") || l.includes("leak") || l.includes("sewage")) {
    return { category: "WATER_SUPPLY", department: "Water Works" };
  }
  return {};
}

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("image");
    const imageWidth = Math.min(10000, Math.max(1, Number(form.get("imageWidth")) || 1000));
    const imageHeight = Math.min(10000, Math.max(1, Number(form.get("imageHeight")) || 1000));

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "Missing image file (field name: image)." },
        { status: 400 }
      );
    }

    const MAX_BYTES = 4_000_000; // 4MB for Gemini inline
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        {
          success: false,
          message: `Image too large. Max ${(MAX_BYTES / 1_000_000).toFixed(1)}MB.`,
        },
        { status: 413 }
      );
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const base64 = buf.toString("base64");
    const mimeType = file.type || "image/jpeg";

    const systemPrompt =
      "You are CivicTrack AI. Analyze civic issue photos (potholes, garbage, streetlights, water leaks, etc.). Output STRICT JSON only. No markdown.";

    const userPrompt = [
      "Look at this image and identify any civic issues (e.g. pothole, garbage, broken streetlight, water leak, damaged road).",
      "Return JSON with:",
      '- objects: array of { label: string (short, e.g. "pothole", "garbage"), confidence: number 0-1 }',
      "- suggestedCategory: one of ROAD_DAMAGE, GARBAGE, STREETLIGHT, WATER_SUPPLY, or OTHER if unclear",
      "- suggestedDepartment: short name (e.g. Roads & Transport, Sanitation).",
      "If you see nothing relevant, return objects: [] and suggestedCategory: OTHER.",
    ].join("\n");

    const out = await callGeminiJsonWithImage<GeminiVisionResponse>(
      systemPrompt,
      userPrompt,
      base64,
      mimeType
    );

    const rawObjects = Array.isArray(out.objects) ? out.objects : [];
    const fullBox: VisionBox = { xmin: 0, ymin: 0, xmax: imageWidth, ymax: imageHeight };

    const detections = rawObjects
      .filter((o) => o && typeof o.label === "string" && typeof o.confidence === "number")
      .map((o) => ({
        label: o.label,
        score: Math.min(1, Math.max(0, o.confidence)),
        box: fullBox,
        suggestion: suggestFromLabel(o.label),
      }))
      .sort((a, b) => b.score - a.score);

    // If Gemini returned no objects but gave category/department, add one detection so the UI gets a suggestion
    if (detections.length === 0 && (out.suggestedCategory || out.suggestedDepartment)) {
      const cat = out.suggestedCategory || "OTHER";
      const dept = out.suggestedDepartment || "";
      detections.push({
        label: cat.replace(/_/g, " ").toLowerCase(),
        score: 0.8,
        box: fullBox,
        suggestion: {
          category: cat === "OTHER" ? undefined : (cat as any),
          department: dept || undefined,
        },
      });
    } else if (detections.length === 0) {
      detections.push({
        label: "no issue detected",
        score: 0.5,
        box: fullBox,
        suggestion: {},
      });
    }

    const top = detections[0];
    const finalSuggestion = { ...(top?.suggestion ?? {}) };
    if (out.suggestedCategory) finalSuggestion.category = out.suggestedCategory as any;
    if (out.suggestedDepartment) finalSuggestion.department = out.suggestedDepartment;

    return NextResponse.json({
      success: true,
      model: "gemini-vision",
      detections,
      suggestion: finalSuggestion,
      note:
        "Computer vision results are probabilistic. Always verify before submitting. Powered by Gemini.",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("GEMINI_API_KEY") ? 500 : 502;
    return NextResponse.json({ success: false, message }, { status });
  }
}
