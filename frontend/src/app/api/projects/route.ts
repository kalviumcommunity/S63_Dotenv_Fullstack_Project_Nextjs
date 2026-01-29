import { NextResponse } from "next/server";

/**
 * GET /api/projects (with pagination)
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 10;

  return NextResponse.json({
    page,
    limit,
    data: []
  });
}