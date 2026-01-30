import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey123";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
          error: { code: "NOT_FOUND" },
        },
        { status: 404 }
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
          message: "Invalid credentials",
          error: { code: "VALIDATION_ERROR" },
        },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return NextResponse.json({
      success: true,
      message: "Login successful",
      data: { token },
    });
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
