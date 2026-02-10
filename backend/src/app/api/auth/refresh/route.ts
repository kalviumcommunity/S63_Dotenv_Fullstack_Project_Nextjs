import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import {
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
} from "@/lib/auth/tokens";

const isProduction = process.env.NODE_ENV === "production";

export async function POST(req: NextRequest) {
  try {
    // Get refresh token from cookie
    const refreshToken = req.cookies.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Refresh token missing",
          error: { code: "AUTH_ERROR" },
        },
        { status: 401 }
      );
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error: any) {
      // Clear invalid refresh token cookie
      const response = NextResponse.json(
        {
          success: false,
          message: error.code === "TOKEN_EXPIRED" ? "Session expired" : "Invalid session",
          error: { code: "AUTH_ERROR" },
        },
        { status: 401 }
      );
      
      response.cookies.delete("refreshToken");
      return response;
    }

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      const response = NextResponse.json(
        {
          success: false,
          message: "User not found",
          error: { code: "AUTH_ERROR" },
        },
        { status: 401 }
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
    const response = NextResponse.json(
      {
        success: true,
        message: "Token refreshed successfully",
        data: {
          accessToken: newAccessToken,
        },
      },
      { status: 200 }
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
    console.error("Token refresh error:", err);
    
    const response = NextResponse.json(
      {
        success: false,
        message: "Token refresh failed",
        error: { code: "INTERNAL_ERROR" },
      },
      { status: 500 }
    );
    
    // Clear refresh token on error
    response.cookies.delete("refreshToken");
    return response;
  }
}
