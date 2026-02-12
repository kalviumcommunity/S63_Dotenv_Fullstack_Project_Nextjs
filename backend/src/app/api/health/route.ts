import { NextRequest } from "next/server";
import { jsonWithCors } from "@/middleware/cors";
import { prisma } from "@/lib/database";

export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin");
  
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return jsonWithCors(
      { 
        status: "Backend running",
        database: "connected",
        timestamp: new Date().toISOString()
      },
      undefined,
      origin
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("[Health] Database check failed:", errorMessage);
    
    return jsonWithCors(
      {
        status: "Backend running",
        database: "disconnected",
        error: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 503 },
      origin
    );
  }
}
