import { NextRequest, NextResponse } from "next/server";

type ParamsPromise = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/users/:id
 */
export async function GET(_req: NextRequest, context: ParamsPromise) {
  const { id } = await context.params;

  return NextResponse.json({
    id,
    name: "Sample User",
  });
}

/**
 * PUT /api/users/:id
 */
export async function PUT(req: NextRequest, context: ParamsPromise) {
  const { id } = await context.params;
  const body = await req.json();

  return NextResponse.json({
    message: `User ${id} updated`,
    data: body,
  });
}

/**
 * DELETE /api/users/:id
 */
export async function DELETE(_req: NextRequest, context: ParamsPromise) {
  const { id } = await context.params;

  return NextResponse.json({
    message: `User ${id} deleted`,
  });
}