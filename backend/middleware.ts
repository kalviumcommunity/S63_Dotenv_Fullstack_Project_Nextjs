import { NextRequest, NextResponse } from "next/server";
import {
  shouldRedirectToHttps,
  buildHttpsRedirectUrl,
  applySecurityHeaders,
} from "./src/lib/security/headers";
import { logger } from "./src/lib/logging";

const isProduction = process.env.NODE_ENV === "production";
const LOG_REQUESTS = process.env.LOG_REQUESTS !== "0";

function getOrCreateRequestId(req: NextRequest): string {
  return req.headers.get("x-request-id") ?? crypto.randomUUID();
}
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || ALLOWED_ORIGIN)
  .split(",")
  .map((o) => o.trim())
  .filter((o) => o && o !== "*");

/** Production: CORS_ORIGIN must be a specific origin, never '*' */
if (isProduction && (!ALLOWED_ORIGIN || ALLOWED_ORIGIN === "*" || ALLOWED_ORIGINS.length === 0)) {
  console.error(
    "[CORS] CORS_ORIGIN must be set to a trusted origin in production (e.g. https://app.example.com). Never use '*'."
  );
}

/**
 * Get allowed origin for CORS. Never returns '*' in production.
 */
function getAllowedOrigin(requestOrigin: string | null): string {
  if (!requestOrigin) return ALLOWED_ORIGIN;
  if (ALLOWED_ORIGINS.includes(requestOrigin)) return requestOrigin;
  return ALLOWED_ORIGIN;
}

function setCorsHeaders(res: NextResponse, allowedOrigin: string): void {
  res.headers.set("Access-Control-Allow-Origin", allowedOrigin);
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.headers.set("Access-Control-Max-Age", "86400");
  res.headers.set("Access-Control-Expose-Headers", "Set-Cookie");
}

export function middleware(req: NextRequest) {
  // Step 1: HTTPS redirect (production only, respects X-Forwarded-Proto)
  if (shouldRedirectToHttps(req)) {
    const url = buildHttpsRedirectUrl(req);
    return NextResponse.redirect(url, 308);
  }

  const origin = req.headers.get("origin");
  const allowedOrigin = getAllowedOrigin(origin);

  // Handle OPTIONS preflight
  if (req.method === "OPTIONS") {
    const res = new NextResponse(null, { status: 204 });
    setCorsHeaders(res, allowedOrigin);
    applySecurityHeaders(res.headers);
    return res;
  }

  const requestId = getOrCreateRequestId(req);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-request-id", requestId);
  const res = NextResponse.next({
    request: { headers: requestHeaders },
  });
  res.headers.set("X-Request-ID", requestId);
  setCorsHeaders(res, allowedOrigin);
  applySecurityHeaders(res.headers);

  if (LOG_REQUESTS) {
    const pathname = req.nextUrl.pathname;
    logger.info("request_start", {
      requestId,
      endpoint: pathname,
      method: req.method ?? "GET",
    });
  }

  return res;
}

export const config = {
  matcher: "/api/:path*",
};
