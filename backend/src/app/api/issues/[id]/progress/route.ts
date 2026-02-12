import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { jsonWithCors, handleOptions } from "@/middleware/cors";
import { requirePermission, AuthenticatedRequest } from "@/lib/rbac/middleware";
import { logAccessGranted } from "@/lib/rbac/logging";
import { sanitizeField } from "@/lib/security";

type ParamsPromise = { params: Promise<{ id: string }> };

/**
 * Handle OPTIONS preflight request
 */
export async function OPTIONS(req: NextRequest) {
  return handleOptions(req);
}

/**
 * GET /api/issues/:id/progress - Get progress updates for an issue
 */
export async function GET(req: NextRequest, context: ParamsPromise) {
  const origin = req.headers.get("origin");
  
  try {
    const { id } = await context.params;

    const issue = await prisma.issue.findFirst({
      where: /^\d+$/.test(id) ? { id: Number(id) } : { publicId: id },
      include: {
        progressUpdates: {
          include: {
            updatedBy: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    if (!issue) {
      return jsonWithCors({ success: false, message: "Issue not found" }, { status: 404 }, origin);
    }

    return jsonWithCors({
      success: true,
      data: {
        progressPercentage: issue.progressPercentage,
        expectedCompletionDate: issue.slaDeadline,
        assignedTo: issue.assignedTo
          ? {
              id: issue.assignedTo.id,
              name: issue.assignedTo.name,
              email: issue.assignedTo.email,
              role: issue.assignedTo.role,
            }
          : null,
        progressUpdates: issue.progressUpdates.map((update) => ({
          id: update.id,
          percentage: update.percentage,
          notes: update.notes,
          updatedBy: {
            id: update.updatedBy.id,
            name: update.updatedBy.name,
            email: update.updatedBy.email,
          },
          createdAt: update.createdAt.toISOString(),
        })),
      },
    }, undefined, origin);
  } catch (err) {
    console.error("GET /api/issues/[id]/progress:", err);
    return jsonWithCors({ success: false, message: "Failed to fetch progress" }, { status: 500 }, origin);
  }
}

/**
 * POST /api/issues/:id/progress - Update progress
 * Requires: update permission
 */
export async function POST(req: NextRequest, context: ParamsPromise) {
  const { id } = await context.params;
  const resolvedId = await id;
  
  // Check permission
  const authCheck = await requirePermission("update", `/api/issues/${resolvedId}/progress`)(req);
  if (authCheck instanceof NextRequest) {
    const authReq = authCheck as AuthenticatedRequest;
    const user = authReq.user!;
    
    // Log access granted
    logAccessGranted(
      user.id,
      user.email,
      user.role,
      "update",
      `/api/issues/${resolvedId}/progress`,
      "POST"
    );
    
    const origin = req.headers.get("origin");
    try {
      const body = await req.json();
      const { percentage, notes } = body;

      let sanitizedNotes: string | null = null;
      if (notes != null && typeof notes === "string") {
        try {
          sanitizedNotes = sanitizeField(notes, "notes");
        } catch {
          return jsonWithCors(
            { success: false, message: "Invalid input: disallowed content detected", error: { code: "VALIDATION_ERROR" } },
            { status: 400 },
            origin
          );
        }
      }

      if (typeof percentage !== "number" || percentage < 0 || percentage > 100) {
        return jsonWithCors(
          { success: false, message: "Invalid percentage (must be 0-100)" },
          { status: 400 },
          origin
        );
      }

      const issue = await prisma.issue.findFirst({
        where: /^\d+$/.test(resolvedId) ? { id: Number(resolvedId) } : { publicId: resolvedId },
      });

      if (!issue) {
        return jsonWithCors({ success: false, message: "Issue not found" }, { status: 404 }, origin);
      }

      // Check if user is assigned to this issue or is admin
      if (issue.assignedToId !== user.id && user.role !== "admin") {
        return jsonWithCors(
          { success: false, message: "You are not assigned to this issue" },
          { status: 403 },
          origin
        );
      }

      // Create progress update
      const progressUpdate = await prisma.progressUpdate.create({
        data: {
          issueId: issue.id,
          percentage,
          notes: sanitizedNotes,
          updatedById: user.id,
        },
        include: {
          updatedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Update issue progress percentage
      const updatedIssue = await prisma.issue.update({
        where: { id: issue.id },
        data: {
          progressPercentage: percentage,
          status: percentage === 100 ? "RESOLVED" : percentage > 0 ? "IN_PROGRESS" : issue.status,
        },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      });

      return jsonWithCors({
        success: true,
        data: {
          progressPercentage: updatedIssue.progressPercentage,
          expectedCompletionDate: updatedIssue.slaDeadline,
          assignedTo: updatedIssue.assignedTo
            ? {
                id: updatedIssue.assignedTo.id,
                name: updatedIssue.assignedTo.name,
                email: updatedIssue.assignedTo.email,
                role: updatedIssue.assignedTo.role,
              }
            : null,
          latestUpdate: {
            id: progressUpdate.id,
            percentage: progressUpdate.percentage,
            notes: progressUpdate.notes,
            updatedBy: {
              id: progressUpdate.updatedBy.id,
              name: progressUpdate.updatedBy.name,
              email: progressUpdate.updatedBy.email,
            },
            createdAt: progressUpdate.createdAt.toISOString(),
          },
        },
      }, undefined, origin);
    } catch (err) {
      console.error("POST /api/issues/[id]/progress:", err);
      return jsonWithCors({ success: false, message: "Failed to update progress" }, { status: 500 }, origin);
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
