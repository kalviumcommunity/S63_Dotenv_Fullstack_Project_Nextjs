import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { sendError } from "@/lib/config/responses";
import { ERROR_CODES } from "@/lib/config/errorCodes";
import {
  shouldRedirectToHttps,
  buildHttpsRedirectUrl,
  applySecurityHeaders,
} from "@/lib/security/headers";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured in the frontend environment");
}

const secretKey = new TextEncoder().encode(JWT_SECRET);

function withSecurityHeaders(res: NextResponse): NextResponse {
  applySecurityHeaders(res.headers);
  return res;
}

export async function middleware(request: NextRequest) {
  // Step 1: HTTPS redirect (production only)
  if (shouldRedirectToHttps(request)) {
    const url = buildHttpsRedirectUrl(request);
    return NextResponse.redirect(url, 308);
  }

  const { pathname } = request.nextUrl;
  const isAuthRoute = pathname.startsWith("/api/users") || pathname.startsWith("/api/admin");

  if (!isAuthRoute) {
    const res = NextResponse.next();
    return withSecurityHeaders(res);
  }

  // Auth check for /api/users and /api/admin
  const authHeader =
    request.headers.get("authorization") ?? request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return withSecurityHeaders(
      sendError("Authentication token missing", ERROR_CODES.VALIDATION_ERROR, 401)
    );
  }

  const token = authHeader.split(" ")[1];

  try {
    const { payload } = await jwtVerify(token, secretKey);
    const role = payload.role as string | undefined;
    const email = payload.email as string | undefined;

    if (pathname.startsWith("/api/admin") && role !== "admin") {
      return withSecurityHeaders(
        sendError("Forbidden: admin access required", ERROR_CODES.VALIDATION_ERROR, 403)
      );
    }

    const requestHeaders = new Headers(request.headers);
    if (email) requestHeaders.set("x-user-email", email);
    if (role) requestHeaders.set("x-user-role", role);

    const res = NextResponse.next({
      request: { headers: requestHeaders },
    });
    return withSecurityHeaders(res);
  } catch {
    return withSecurityHeaders(
      sendError("Invalid or expired token", ERROR_CODES.INTERNAL_ERROR, 403)
    );
  }
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files and internal Next.js routes.
     * Enables HTTPS redirect and security headers for pages and API routes.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

