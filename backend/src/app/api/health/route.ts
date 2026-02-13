import { NextRequest } from "next/server";
import { jsonWithCors } from "@/middleware/cors";
import { prisma } from "@/lib/database";
import { isProductionEnv } from "@/lib/database";

export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin");

  try {
    await prisma.$queryRaw`SELECT 1`;

    return jsonWithCors(
      {
        status: "Backend running",
        database: "connected",
        timestamp: new Date().toISOString(),
      },
      undefined,
      origin
    );
  } catch (err) {
    const internalMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("[Health] Database check failed:", internalMsg);

    // Production: do not expose hostname, credentials, or stack
    const clientError = isProductionEnv()
      ? "Database unavailable"
      : internalMsg;

    return jsonWithCors(
      {
        status: "Backend running",
        database: "disconnected",
        error: clientError,
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
      origin
    );
  }
}
