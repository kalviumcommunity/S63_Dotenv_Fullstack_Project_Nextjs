import { NextRequest, NextResponse } from "next/server";

const ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || ORIGIN).split(",").map((o) => o.trim());

/**
 * Get allowed origin for CORS
 */
function getAllowedOrigin(requestOrigin: string | null): string | null {
  if (!requestOrigin) return null;
  
  // Check if origin is in allowed list
  if (ALLOWED_ORIGINS.includes(requestOrigin)) {
    return requestOrigin;
  }
  
  // Fallback to default origin
  if (ALLOWED_ORIGINS.includes(ORIGIN)) {
    return ORIGIN;
  }
  
  return null;
}

/**
 * Add CORS headers to response
 */
export function withCors(res: NextResponse, requestOrigin?: string | null): NextResponse {
  const origin = getAllowedOrigin(requestOrigin || null);
  
  if (origin) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Access-Control-Allow-Credentials", "true");
  }
  
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.headers.set("Access-Control-Max-Age", "86400");
  res.headers.set("Access-Control-Expose-Headers", "Set-Cookie");
  
  return res;
}

/**
 * Create JSON response with CORS headers
 */
export function jsonWithCors(body: unknown, init?: ResponseInit, requestOrigin?: string | null): NextResponse {
  const res = NextResponse.json(body, init);
  return withCors(res, requestOrigin);
}

/**
 * Handle OPTIONS preflight request for a route
 */
export async function OPTIONS(req: NextRequest): Promise<NextResponse> {
  return handleOptions(req);
}

/**
 * Handle OPTIONS preflight request
 */
export function handleOptions(req: NextRequest): NextResponse {
  const origin = req.headers.get("origin");
  const res = new NextResponse(null, { status: 204 });
  return withCors(res, origin);
}
