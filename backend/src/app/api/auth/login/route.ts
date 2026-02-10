import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/database";
import { generateAccessToken, generateRefreshToken } from "@/lib/auth/tokens";

const isProduction = process.env.NODE_ENV === "production";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required",
          error: { code: "VALIDATION_ERROR" },
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
          error: { code: "AUTH_ERROR" },
        },
        { status: 401 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        {
          success: false,
          message: "Account has no password set",
          error: { code: "VALIDATION_ERROR" },
        },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
          error: { code: "AUTH_ERROR" },
        },
        { status: 401 }
      );
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    
    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Return user data (without password) and access token
    const { password: _, ...userWithoutPassword } = user;

    // Create response with access token in body
    const response = NextResponse.json(
      {
        success: true,
        message: "Login successful",
        data: {
          accessToken,
          user: userWithoutPassword,
        },
      },
      { status: 200 }
    );

    // Set refresh token as HTTP-only, Secure cookie
    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction, // Only send over HTTPS in production
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
      path: "/",
    });

    // Log successful login (without sensitive data)
    console.log(`User ${user.id} (${user.email}) logged in successfully`);

    return response;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Login error:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Login failed",
        error: { code: "INTERNAL_ERROR", details: errorMessage },
      },
      { status: 500 }
    );
  }
}
