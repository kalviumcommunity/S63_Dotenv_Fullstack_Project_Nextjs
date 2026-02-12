import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/database";
import { generateAccessToken, generateRefreshToken } from "@/lib/auth/tokens";
import { handleOptions, jsonWithCors } from "@/middleware/cors";
import { sanitizeField, getSafeErrorMessage } from "@/lib/security";

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
    const { email, password } = await req.json();

    if (!email || !password) {
      return jsonWithCors(
        {
          success: false,
          message: "Email and password are required",
          error: { code: "VALIDATION_ERROR" },
        },
        { status: 400 },
        origin
      );
    }

    let sanitizedEmail: string;
    try {
      sanitizedEmail = sanitizeField(email, "email");
    } catch {
      return jsonWithCors(
        {
          success: false,
          message: "Invalid input",
          error: { code: "VALIDATION_ERROR" },
        },
        { status: 400 },
        origin
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
      },
    });

    if (!user) {
      return jsonWithCors(
        {
          success: false,
          message: "Invalid email or password",
          error: { code: "AUTH_ERROR" },
        },
        { status: 401 },
        origin
      );
    }

    if (!user.password) {
      return jsonWithCors(
        {
          success: false,
          message: "Account has no password set",
          error: { code: "VALIDATION_ERROR" },
        },
        { status: 401 },
        origin
      );
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return jsonWithCors(
        {
          success: false,
          message: "Invalid email or password",
          error: { code: "AUTH_ERROR" },
        },
        { status: 401 },
        origin
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
    const response = jsonWithCors(
      {
        success: true,
        message: "Login successful",
        data: {
          accessToken,
          user: userWithoutPassword,
        },
      },
      { status: 200 },
      origin
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
    console.error("Login error:", err);
    return jsonWithCors(
      {
        success: false,
        message: "Login failed",
        error: { code: "INTERNAL_ERROR", details: getSafeErrorMessage(err) },
      },
      { status: 500 },
      origin
    );
  }
}
