import { NextRequest } from "next/server";
import { jsonWithCors } from "@/middleware/cors";
import { prisma } from "@/lib/database";
import { getRedisClient } from "@/lib/cache";

export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin");
  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  };

  // Test database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    diagnostics.database = "connected";
    
    // Try a simple query
    const userCount = await prisma.user.count();
    diagnostics.userCount = userCount;
    
    const issueCount = await prisma.issue.count();
    diagnostics.issueCount = issueCount;
  } catch (dbError) {
    diagnostics.database = "error";
    diagnostics.databaseError = dbError instanceof Error ? dbError.message : String(dbError);
  }

  // Test Redis connection
  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.ping();
      diagnostics.redis = "connected";
    } catch (redisError) {
      diagnostics.redis = "error";
      diagnostics.redisError = redisError instanceof Error ? redisError.message : String(redisError);
    }
  } else {
    diagnostics.redis = "not configured";
  }

  // Check environment variables (without exposing secrets)
  diagnostics.envVars = {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasJwtSecret: !!process.env.JWT_SECRET,
    hasRedisUrl: !!process.env.REDIS_URL,
    corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
  };

  return jsonWithCors(
    {
      success: true,
      diagnostics,
    },
    undefined,
    origin
  );
}
