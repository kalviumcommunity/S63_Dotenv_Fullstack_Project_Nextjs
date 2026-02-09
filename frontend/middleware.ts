import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { sendError } from "@/lib/config/responses";
import { ERROR_CODES } from "@/lib/config/errorCodes";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured in the frontend environment");
}

const secretKey = new TextEncoder().encode(JWT_SECRET);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const authHeader =
    request.headers.get("authorization") ??
    request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendError(
      "Authentication token missing",
      ERROR_CODES.VALIDATION_ERROR,
      401
    );
  }

  const token = authHeader.split(" ")[1];

  try {
    const { payload } = await jwtVerify(token, secretKey);

    const role = payload.role as string | undefined;
    const email = payload.email as string | undefined;

    if (pathname.startsWith("/api/admin") && role !== "admin") {
      return sendError(
        "Forbidden: admin access required",
        ERROR_CODES.VALIDATION_ERROR,
        403
      );
    }

    const requestHeaders = new Headers(request.headers);

    if (email) {
      requestHeaders.set("x-user-email", email);
    }
    if (role) {
      requestHeaders.set("x-user-role", role);
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch {
    return sendError(
      "Invalid or expired token",
      ERROR_CODES.INTERNAL_ERROR,
      403
    );
  }
}

export const config = {
  matcher: ["/api/users", "/api/users/:path*", "/api/admin", "/api/admin/:path*"],
};

