import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { jsonWithCors, handleOptions } from "@/middleware/cors";
import { requirePermission, AuthenticatedRequest } from "@/lib/rbac/middleware";
import { logAccessGranted } from "@/lib/rbac/logging";

/**
 * Handle OPTIONS preflight request
 */
export async function OPTIONS(req: NextRequest) {
  return handleOptions(req);
}

/**
 * GET /api/users/officers - Get all officers
 * Requires: read permission (admin only in practice)
 */
export async function GET(req: NextRequest) {
  // Check permission
  const authCheck = await requirePermission("read", "/api/users/officers")(req);
  if (authCheck instanceof NextRequest) {
    const authReq = authCheck as AuthenticatedRequest;
    const user = authReq.user!;
    
    // Log access granted
    logAccessGranted(
      user.id,
      user.email,
      user.role,
      "read",
      "/api/users/officers",
      "GET"
    );
    
    try {

    const officers = await prisma.user.findMany({
      where: { role: "officer" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: {
          select: {
            assignedIssues: {
              where: {
                status: {
                  in: ["ASSIGNED", "IN_PROGRESS"],
                },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

      const origin = req.headers.get("origin");
      return jsonWithCors({
        success: true,
        data: officers.map((o) => ({
          id: o.id,
          name: o.name,
          email: o.email,
          createdAt: o.createdAt.toISOString(),
          activeAssignments: o._count.assignedIssues,
        })),
      }, undefined, origin);
    } catch (err) {
      console.error("GET /api/users/officers:", err);
      const origin = req.headers.get("origin");
      return jsonWithCors({ success: false, message: "Failed to fetch officers" }, { status: 500 }, origin);
    }
  }
  
  // Permission denied - add CORS headers to error response
  const origin = req.headers.get("origin");
  const errorResponse = authCheck as NextResponse;
  const corsHeaders = new Headers(errorResponse.headers);
  if (origin) {
    corsHeaders.set("Access-Control-Allow-Origin", origin);
    corsHeaders.set("Access-Control-Allow-Credentials", "true");
  }
  return new NextResponse(errorResponse.body, {
    status: errorResponse.status,
    headers: corsHeaders,
  });
}
