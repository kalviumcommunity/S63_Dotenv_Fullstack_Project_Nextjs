import { NextRequest } from "next/server";
import { jsonWithCors } from "@/middleware/cors";
import { prisma } from "@/lib/database";
import { isProductionEnv } from "@/lib/database";
import { createRequestLogger, categorizeError } from "@/lib/logging";

export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin");
  const requestId = req.headers.get("x-request-id") ?? "unknown";
  const log = createRequestLogger(requestId, "/api/health", "GET");

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
    log.error("Database check failed", {
      errorCategory: categorizeError(err),
      stack: err instanceof Error ? err.stack : undefined,
    });

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
