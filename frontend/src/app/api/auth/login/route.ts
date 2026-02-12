import { NextRequest, NextResponse } from "next/server";
import { sendError } from "@/lib/config/responses";
import { ERROR_CODES } from "@/lib/config/errorCodes";
import { handleError } from "@/lib/config/errorHandler";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        return sendError(
          `Backend error: ${text.substring(0, 100)}`,
          ERROR_CODES.INTERNAL_ERROR,
          response.status
        );
      }
      return sendError(
        data.message || "Login failed",
        data.error?.code || ERROR_CODES.INTERNAL_ERROR,
        response.status,
        data.error?.details
      );
    }

    const data = await response.json();

    // Forward the response including cookies (refresh token)
    const nextResponse = NextResponse.json(
      {
        success: data.success,
        message: data.message || "Login successful",
        data: data.data,
      },
      { status: response.status }
    );

    // Forward cookies from backend response
    const setCookieHeader = response.headers.get("set-cookie");
    if (setCookieHeader) {
      nextResponse.headers.set("set-cookie", setCookieHeader);
    }

    return nextResponse;
  } catch (err) {
    return handleError(err, { route: "/api/auth/login", method: "POST" });
  }
}