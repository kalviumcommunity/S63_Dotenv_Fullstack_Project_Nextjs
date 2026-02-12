import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || ALLOWED_ORIGIN).split(",").map((o) => o.trim());

/**
 * Get allowed origin for CORS
 */
function getAllowedOrigin(requestOrigin: string | null): string {
  if (!requestOrigin) return ALLOWED_ORIGIN;

  if (ALLOWED_ORIGINS.includes(requestOrigin)) {
    return requestOrigin;
  }

  return ALLOWED_ORIGIN;
}

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin");
  const allowedOrigin = getAllowedOrigin(origin);
  
  // Handle OPTIONS preflight request
  if (req.method === "OPTIONS") {
    const res = new NextResponse(null, { status: 204 });
    res.headers.set("Access-Control-Allow-Origin", allowedOrigin);
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    res.headers.set("Access-Control-Max-Age", "86400");
    return res;
  }

  // Add CORS and security headers to all responses
  const res = NextResponse.next();
  res.headers.set("Access-Control-Allow-Origin", allowedOrigin);
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.headers.set("Access-Control-Max-Age", "86400");
  res.headers.set("Access-Control-Expose-Headers", "Set-Cookie");

  // OWASP security headers
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'"
  );

  return res;
}

export const config = {
  matcher: "/api/:path*",
};
