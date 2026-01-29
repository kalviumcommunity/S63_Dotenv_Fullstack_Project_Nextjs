import { NextResponse } from "next/server";

/**
 * GET /api/users
 * Get all users (dummy for now)
 */
export async function GET() {
  return NextResponse.json([
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" }
  ]);
}

/**
 * POST /api/users
 * Create a new user
 */
export async function POST(req: Request) {
  const body = await req.json();

  if (!body.name) {
    return NextResponse.json(
      { error: "Name is required" },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { message: "User created", data: body },
    { status: 201 }
  );
}