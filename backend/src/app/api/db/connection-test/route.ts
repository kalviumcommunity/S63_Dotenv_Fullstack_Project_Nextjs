import { NextRequest } from "next/server";
import { jsonWithCors } from "@/middleware/cors";
import { prisma } from "@/lib/database";
import { isProductionEnv } from "@/lib/database";

/** Safe error message for client (never exposes hostname, credentials, or stack) */
const GENERIC_ERROR_MSG = "Database connection failed";

export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin");

  try {
    const result = await prisma.$queryRaw<[{ now: Date }]>`SELECT NOW() as now`;
    const serverTime = result[0]?.now;

    if (!serverTime) {
      throw new Error("No result from database");
    }

    return jsonWithCors(
      {
        ok: true,
        serverTime:
          serverTime instanceof Date ? serverTime.toISOString() : String(serverTime),
      },
      undefined,
      origin
    );
  } catch (err) {
    // Log internally without exposing sensitive data
    const internalMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("[DB Connection Test] Failed:", internalMsg);

    // Production: return generic message only
    const clientMessage = isProductionEnv() ? GENERIC_ERROR_MSG : internalMsg;

    return jsonWithCors(
      {
        ok: false,
        error: clientMessage,
      },
      { status: 503 },
      origin
    );
  }
}
