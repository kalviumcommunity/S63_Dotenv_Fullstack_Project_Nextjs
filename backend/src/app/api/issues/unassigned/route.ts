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
 * GET /api/issues/unassigned - Get all unassigned issues
 * Requires: read permission (admin only in practice)
 */
export async function GET(req: NextRequest) {
  // Check permission
  const authCheck = await requirePermission("read", "/api/issues/unassigned")(req);
  if (authCheck instanceof NextRequest) {
    const authReq = authCheck as AuthenticatedRequest;
    const user = authReq.user!;
    
    // Log access granted
    logAccessGranted(
      user.id,
      user.email,
      user.role,
      "read",
      "/api/issues/unassigned",
      "GET"
    );
    
    try {

    const unassignedIssues = await prisma.issue.findMany({
      where: {
        assignedToId: null,
        status: "REPORTED",
      },
      include: {
        reportedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

      const origin = req.headers.get("origin");
      return jsonWithCors({
        success: true,
        data: unassignedIssues.map((issue) => ({
          id: issue.id,
          publicId: issue.publicId,
          title: issue.title,
          description: issue.description,
          category: issue.category,
          status: issue.status,
          latitude: issue.latitude?.toString(),
          longitude: issue.longitude?.toString(),
          createdAt: issue.createdAt.toISOString(),
          reportedBy: issue.reportedBy
            ? {
                id: issue.reportedBy.id,
                name: issue.reportedBy.name,
                email: issue.reportedBy.email,
              }
            : null,
        })),
      }, undefined, origin);
    } catch (err) {
      console.error("GET /api/issues/unassigned:", err);
      const origin = req.headers.get("origin");
      return jsonWithCors({ success: false, message: "Failed to fetch unassigned issues" }, { status: 500 }, origin);
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
