import { NextRequest, NextResponse } from "next/server";
import { jsonWithCors, handleOptions } from "@/middleware/cors";
import { requirePermission, AuthenticatedRequest } from "@/lib/rbac/middleware";
import { logAccessGranted } from "@/lib/rbac/logging";
import { prisma } from "@/lib/database";
import { sanitizeField, sanitizeString } from "@/lib/security";

interface AssignRequest {
  issueId: number;
  officers: Array<{
    id: number;
    name: string;
    email: string;
    activeAssignments: number;
  }>;
  issue: {
    title: string;
    description?: string | null;
    category: string;
    createdAt: string;
  };
}

/**
 * Handle OPTIONS preflight request
 */
export async function OPTIONS(req: NextRequest) {
  return handleOptions(req);
}

/**
 * POST /api/ai/assign - AI-powered officer assignment suggestions
 * Requires: create permission (admin only in practice)
 */
export async function POST(req: NextRequest) {
  // Check permission
  const authCheck = await requirePermission("create", "/api/ai/assign")(req);
  if (authCheck instanceof NextRequest) {
    const authReq = authCheck as AuthenticatedRequest;
    const user = authReq.user!;
    
    // Log access granted
    logAccessGranted(
      user.id,
      user.email,
      user.role,
      "create",
      "/api/ai/assign",
      "POST"
    );
    
    try {
      const body = (await req.json()) as AssignRequest;
      const origin = req.headers.get("origin");

      if (!body.issueId || !body.officers || !body.issue) {
        return jsonWithCors({ success: false, message: "Missing required fields" }, { status: 400 }, origin);
      }

      let safeTitle: string;
      let safeDescription: string | null = null;
      try {
        safeTitle = sanitizeField(body.issue.title ?? "", "title");
        if (body.issue.description && typeof body.issue.description === "string") {
          safeDescription = sanitizeField(body.issue.description, "description");
        }
      } catch {
        return jsonWithCors({ success: false, message: "Invalid input: disallowed content detected" }, { status: 400 }, origin);
      }

      // Use Gemini API for smart assignment
      const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
      if (!GEMINI_API_KEY) {
        // Fallback to simple logic if no API key
        const sortedOfficers = [...body.officers].sort(
          (a, b) => a.activeAssignments - b.activeAssignments
        );
        return jsonWithCors({
          success: true,
          data: {
            recommendedOfficerId: sortedOfficers[0]?.id || null,
            confidence: 0.7,
            reasoning: ["Balanced workload distribution"],
            alternatives: sortedOfficers.slice(1, 3).map((o) => ({
              officerId: o.id,
              reason: `Currently has ${o.activeAssignments} active assignments`,
            })),
          },
        }, undefined, origin);
      }

    const officerList = body.officers
      .map((o, idx) => {
        const safeName = sanitizeString(o.name ?? "", { allowReject: false }).value;
        const safeEmail = sanitizeString(o.email ?? "", { allowReject: false }).value;
        return `${idx + 1}. ${safeName} (ID: ${o.id}, Email: ${safeEmail}, Active Assignments: ${o.activeAssignments})`;
      })
      .join("\n");

    const prompt = [
      "You are an AI assistant helping assign civic issues to officers.",
      "",
      "Issue Details:",
      `- Title: ${safeTitle}`,
      `- Category: ${body.issue.category}`,
      `- Description: ${safeDescription || "None"}`,
      `- Reported: ${new Date(body.issue.createdAt).toLocaleDateString()}`,
      "",
      "Available Officers:",
      officerList,
      "",
      "Return JSON with:",
      "- recommendedOfficerId: number (the ID of the best officer)",
      "- confidence: number 0-1 (how confident you are)",
      "- reasoning: array of strings (why this officer)",
      "- alternatives: array of { officerId: number, reason: string } (2-3 alternatives)",
      "",
      "Consider:",
      "- Workload balance (officers with fewer active assignments)",
      "- Issue urgency and complexity",
      "- Officer expertise if relevant",
      "- Fair distribution",
    ].join("\n");

    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are a helpful assistant. Return only valid JSON, no markdown. ${prompt}`,
                  },
                ],
              },
            ],
          }),
        }
      );

      const geminiData = await geminiRes.json();
      const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return jsonWithCors({
          success: true,
          data: {
            recommendedOfficerId: parsed.recommendedOfficerId || body.officers[0]?.id,
            confidence: parsed.confidence || 0.8,
            reasoning: parsed.reasoning || ["AI analysis"],
            alternatives: parsed.alternatives || [],
          },
        }, undefined, origin);
      }
    } catch (err) {
      console.error("Gemini API error:", err);
    }

    // Fallback
    const sortedOfficers = [...body.officers].sort(
      (a, b) => a.activeAssignments - b.activeAssignments
    );
    return jsonWithCors({
      success: true,
      data: {
        recommendedOfficerId: sortedOfficers[0]?.id || null,
        confidence: 0.7,
        reasoning: ["Balanced workload distribution"],
        alternatives: sortedOfficers.slice(1, 3).map((o) => ({
          officerId: o.id,
          reason: `Currently has ${o.activeAssignments} active assignments`,
        })),
      },
    }, undefined, origin);
    } catch (err) {
      console.error("POST /api/ai/assign:", err);
      const origin = req.headers.get("origin");
      return jsonWithCors({ success: false, message: "Failed to generate assignment suggestion" }, { status: 500 }, origin);
    }
  }
  
  // Permission denied - add CORS headers to error response
  const origin = req.headers.get("origin");
  const errorResponse = authCheck as NextResponse;
  const corsHeaders = new Headers(errorResponse.headers);
  if (origin) {
    corsHeaders.set("Access-Control-Allow-Origin", origin);
    corsHeaders.set("Access-Control-Allow-Credentials", "true");
  }
  return new NextResponse(errorResponse.body, {
    status: errorResponse.status,
    headers: corsHeaders,
  });
}
