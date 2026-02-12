import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import {
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
} from "@/lib/auth/tokens";
import { handleOptions, jsonWithCors } from "@/middleware/cors";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Handle OPTIONS preflight request
 */
export async function OPTIONS(req: NextRequest) {
  return handleOptions(req);
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  
  try {
    // Get refresh token from cookie
    const refreshToken = req.cookies.get("refreshToken")?.value;

    if (!refreshToken) {
      return jsonWithCors(
        {
          success: false,
          message: "Refresh token missing",
          error: { code: "AUTH_ERROR" },
        },
        { status: 401 },
        origin
      );
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error: any) {
      // Clear invalid refresh token cookie
      const response = jsonWithCors(
        {
          success: false,
          message: error.code === "TOKEN_EXPIRED" ? "Session expired" : "Invalid session",
          error: { code: "AUTH_ERROR" },
        },
        { status: 401 },
        origin
      );
      
      response.cookies.delete("refreshToken");
      return response;
    }

    // Verify user still exists
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });
    } catch (dbError) {
      console.error("[Database] User lookup error:", dbError);
      const response = jsonWithCors(
        {
          success: false,
          message: "Database error",
          error: { code: "INTERNAL_ERROR" },
        },
        { status: 500 },
        origin
      );
      response.cookies.delete("refreshToken");
      return response;
    }

    if (!user) {
      const response = jsonWithCors(
        {
          success: false,
          message: "User not found",
          error: { code: "AUTH_ERROR" },
        },
        { status: 401 },
        origin
      );
      
      response.cookies.delete("refreshToken");
      return response;
    }

    // Generate new tokens (token rotation)
    const newAccessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const newRefreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Create response with new access token
    const response = jsonWithCors(
      {
        success: true,
        message: "Token refreshed successfully",
        data: {
          accessToken: newAccessToken,
        },
      },
      { status: 200 },
      origin
    );

    // Set new refresh token (rotate)
    response.cookies.set("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    // Log token refresh (without sensitive data)
    console.log(`Token refreshed for user ${user.id} (${user.email})`);

    return response;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    const errorStack = err instanceof Error ? err.stack : undefined;
    console.error("Token refresh error:", errorMessage);
    if (errorStack) {
      console.error("Stack trace:", errorStack);
    }
    if (err && typeof err === "object" && "code" in err) {
      console.error("Error code:", (err as any).code);
    }
    
    const response = jsonWithCors(
      {
        success: false,
        message: "Token refresh failed",
        error: { code: "INTERNAL_ERROR" },
      },
      { status: 500 },
      origin
    );
    
    // Clear refresh token on error
    response.cookies.delete("refreshToken");
    return response;
  }
}
