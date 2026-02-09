import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/database";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey123";

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

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return user data (without password) and token
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        success: true,
        message: "Login successful",
        data: {
          token,
          user: userWithoutPassword,
        },
      },
      { status: 200 }
    );
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
