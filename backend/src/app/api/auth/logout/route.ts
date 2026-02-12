import { NextRequest, NextResponse } from "next/server";
import { handleOptions, jsonWithCors } from "@/middleware/cors";

/**
 * Handle OPTIONS preflight request
 */
export async function OPTIONS(req: NextRequest) {
  return handleOptions(req);
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  
  try {
    // Create response
    const response = jsonWithCors(
      {
        success: true,
        message: "Logout successful",
      },
      { status: 200 },
      origin
    );

    // Clear refresh token cookie
    response.cookies.delete("refreshToken");

    // Log logout event
    const userId = req.headers.get("x-user-id");
    if (userId) {
      console.log(`User ${userId} logged out`);
    }

    return response;
  } catch (err) {
    console.error("Logout error:", err);
    return jsonWithCors(
      {
        success: false,
        message: "Logout failed",
        error: { code: "INTERNAL_ERROR" },
      },
      { status: 500 },
      origin
    );
  }
}
