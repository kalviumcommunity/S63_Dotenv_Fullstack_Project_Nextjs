/**
 * Security Sanitization Demo - Controlled test (no permanent storage)
 *
 * Demonstrates that malicious input is sanitized before use.
 * POST body: { input: string }
 * Returns: { sanitized: string, wasModified: boolean, rejected: boolean }
 *
 * Example malicious inputs:
 * - <script>alert("XSS")</script>  -> sanitized to empty, rejected or stripped
 * - ' OR 1=1 --  -> rejected (SQLi pattern)
 */

import { NextRequest } from "next/server";
import { jsonWithCors, handleOptions } from "@/middleware/cors";
import { sanitizeString } from "@/lib/security";

export async function OPTIONS(req: NextRequest) {
  return handleOptions(req);
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");

  try {
    const body = await req.json();
    const raw = typeof body?.input === "string" ? body.input : "";

    const result = sanitizeString(raw, {
      maxLength: 1000,
      allowReject: true,
      fieldName: "demo",
    });

    return jsonWithCors(
      {
        success: true,
        data: {
          sanitized: result.value,
          wasModified: result.wasModified,
          rejected: result.rejected,
          message: result.rejected
            ? "Input rejected: disallowed content detected"
            : result.wasModified
              ? "Input was sanitized (HTML/scripts removed)"
              : "Input passed through unchanged",
        },
      },
      { status: 200 },
      origin
    );
  } catch (err) {
    console.error("Sanitize demo error:", err);
    return jsonWithCors(
      {
        success: false,
        message: "Invalid request",
        error: { code: "VALIDATION_ERROR" },
      },
      { status: 400 },
      origin
    );
  }
}
