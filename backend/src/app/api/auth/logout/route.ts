import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Create response
    const response = NextResponse.json(
      {
        success: true,
        message: "Logout successful",
      },
      { status: 200 }
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
    return NextResponse.json(
      {
        success: false,
        message: "Logout failed",
        error: { code: "INTERNAL_ERROR" },
      },
      { status: 500 }
    );
  }
}
