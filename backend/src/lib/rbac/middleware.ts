/**
 * RBAC Middleware for API routes
 *
 * Reusable permission-check helpers. All decisions: fail-closed, deny by default.
 * Role is extracted from verified JWT only; never trusted from request body/frontend.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, extractTokenFromHeader } from "@/lib/auth/tokens";
import { checkPermission, hasPermission, Permission, AppRole } from "./permissions";
import { logPermissionCheck } from "./logging";
import { prisma } from "@/lib/database";
import { withCors } from "@/middleware/cors";

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: number;
    email: string;
    role: AppRole;
  };
}

/**
 * Reusable: authenticate request, check permission, return user or error response.
 * Use this to avoid duplicating auth + permission logic in API routes.
 */
export async function checkPermissionAndRespond(
  req: NextRequest,
  permission: Permission,
  resource: string
): Promise<
  | { ok: true; user: { id: number; email: string; role: AppRole } }
  | { ok: false; response: NextResponse }
> {
  const authResult = await authenticateRequest(req);
  if ("error" in authResult) return { ok: false, response: authResult.error };

  const { user } = authResult;
  const checkResult = checkPermission(user.role, permission, resource);

  logPermissionCheck({
    userId: user.id,
    userEmail: user.email,
    role: user.role,
    permission,
    resource,
    allowed: checkResult.allowed,
    method: req.method,
    reason: checkResult.reason,
  });

  if (!checkResult.allowed) {
    const origin = req.headers.get("origin");
    const errorResponse = NextResponse.json(
      {
        success: false,
        message: `Access denied: ${checkResult.reason}`,
        error: { code: "FORBIDDEN" },
      },
      { status: 403 }
    );
    return { ok: false, response: withCors(errorResponse, origin) };
  }

  return { ok: true, user };
}

/**
 * Check if role has permission (for use in route logic).
 * Always prefer checkPermissionAndRespond for full flow.
 */
export { hasPermission };

/**
 * Extract and verify user from JWT token
 */
export async function authenticateRequest(
  req: NextRequest
): Promise<{ user: { id: number; email: string; role: AppRole }; error?: never } | { error: NextResponse; user?: never }> {
  // Skip authentication for OPTIONS requests (CORS preflight)
  if (req.method === "OPTIONS") {
    const origin = req.headers.get("origin");
    return {
      error: withCors(new NextResponse(null, { status: 204 }), origin),
    };
  }

  const token = extractTokenFromHeader(req.headers.get("authorization"));

  if (!token) {
    const origin = req.headers.get("origin");
    const errorResponse = NextResponse.json(
      {
        success: false,
        message: "Authentication token missing",
        error: { code: "UNAUTHORIZED" },
      },
      { status: 401 }
    );
    return {
      error: withCors(errorResponse, origin),
    };
  }

  try {
    const payload = verifyAccessToken(token);

    // Verify user still exists in database
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      const origin = req.headers.get("origin");
      const errorResponse = NextResponse.json(
        {
          success: false,
          message: "User not found",
          error: { code: "UNAUTHORIZED" },
        },
        { status: 401 }
      );
      return {
        error: withCors(errorResponse, origin),
      };
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role as AppRole,
      },
    };
  } catch (error: any) {
    const origin = req.headers.get("origin");
    const errorResponse = NextResponse.json(
      {
        success: false,
        message: error.code === "TOKEN_EXPIRED" ? "Session expired" : "Invalid token",
        error: { code: "UNAUTHORIZED" },
      },
      { status: 401 }
    );
    return {
      error: withCors(errorResponse, origin),
    };
  }
}

/**
 * Require authentication (any authenticated user)
 */
export function requireAuth() {
  return async (req: NextRequest): Promise<AuthenticatedRequest | NextResponse> => {
    // Skip authentication for OPTIONS requests (CORS preflight)
    if (req.method === "OPTIONS") {
      const origin = req.headers.get("origin");
      return withCors(new NextResponse(null, { status: 204 }), origin);
    }

    const authResult = await authenticateRequest(req);
    if ("error" in authResult) {
      return authResult.error;
    }
    (req as AuthenticatedRequest).user = authResult.user;
    return req as AuthenticatedRequest;
  };
}

/**
 * Require specific permission
 */
export function requirePermission(permission: Permission, resource?: string) {
  return async (req: NextRequest): Promise<AuthenticatedRequest | NextResponse> => {
    // Skip permission check for OPTIONS requests (CORS preflight)
    if (req.method === "OPTIONS") {
      const origin = req.headers.get("origin");
      return withCors(new NextResponse(null, { status: 204 }), origin);
    }

    // First authenticate
    const authResult = await authenticateRequest(req);
    if ("error" in authResult) {
      return authResult.error;
    }

    const { user } = authResult;

    // Check permission
    const checkResult = checkPermission(user.role, permission, resource);
    
    // Log the permission check
    logPermissionCheck({
      userId: user.id,
      userEmail: user.email,
      role: user.role,
      permission,
      resource: resource || req.nextUrl.pathname,
      allowed: checkResult.allowed,
      method: req.method,
    });

    if (!checkResult.allowed) {
      const origin = req.headers.get("origin");
      const errorResponse = NextResponse.json(
        {
          success: false,
          message: `Access denied: ${checkResult.reason}`,
          error: { code: "FORBIDDEN" },
        },
        { status: 403 }
      );
      return withCors(errorResponse, origin);
    }

    (req as AuthenticatedRequest).user = user;
    return req as AuthenticatedRequest;
  };
}

/**
 * Require any of the specified permissions
 */
export function requireAnyPermission(permissions: Permission[], resource?: string) {
  return async (req: NextRequest): Promise<AuthenticatedRequest | NextResponse> => {
    // Skip permission check for OPTIONS requests (CORS preflight)
    if (req.method === "OPTIONS") {
      const origin = req.headers.get("origin");
      return withCors(new NextResponse(null, { status: 204 }), origin);
    }

    const authResult = await authenticateRequest(req);
    if ("error" in authResult) {
      return authResult.error;
    }

    const { user } = authResult;

    // Check if user has any of the required permissions
    const hasAny = permissions.some((perm) => {
      const checkResult = checkPermission(user.role, perm, resource);
      return checkResult.allowed;
    });

    // Log the permission check
    logPermissionCheck({
      userId: user.id,
      userEmail: user.email,
      role: user.role,
      permission: permissions.join(" OR ") as Permission,
      resource: resource || req.nextUrl.pathname,
      allowed: hasAny,
      method: req.method,
    });

    if (!hasAny) {
      const origin = req.headers.get("origin");
      const errorResponse = NextResponse.json(
        {
          success: false,
          message: `Access denied: Role '${user.role}' does not have any of the required permissions: ${permissions.join(", ")}`,
          error: { code: "FORBIDDEN" },
        },
        { status: 403 }
      );
      return withCors(errorResponse, origin);
    }

    (req as AuthenticatedRequest).user = user;
    return req as AuthenticatedRequest;
  };
}

/**
 * Require specific role
 */
export function requireRole(requiredRole: AppRole) {
  return async (req: NextRequest): Promise<AuthenticatedRequest | NextResponse> => {
    // Skip role check for OPTIONS requests (CORS preflight)
    if (req.method === "OPTIONS") {
      const origin = req.headers.get("origin");
      return withCors(new NextResponse(null, { status: 204 }), origin);
    }

    const authResult = await authenticateRequest(req);
    if ("error" in authResult) {
      return authResult.error;
    }

    const { user } = authResult;

    if (user.role !== requiredRole) {
      logPermissionCheck({
        userId: user.id,
        userEmail: user.email,
        role: user.role,
        permission: "role_check" as Permission,
        resource: req.nextUrl.pathname,
        allowed: false,
        method: req.method,
        reason: `Required role: ${requiredRole}, user role: ${user.role}`,
      });

      const origin = req.headers.get("origin");
      const errorResponse = NextResponse.json(
        {
          success: false,
          message: `Access denied: Role '${requiredRole}' required`,
          error: { code: "FORBIDDEN" },
        },
        { status: 403 }
      );
      return withCors(errorResponse, origin);
    }

    logPermissionCheck({
      userId: user.id,
      userEmail: user.email,
      role: user.role,
      permission: "role_check" as Permission,
      resource: req.nextUrl.pathname,
      allowed: true,
      method: req.method,
    });

    (req as AuthenticatedRequest).user = user;
    return req as AuthenticatedRequest;
  };
}
