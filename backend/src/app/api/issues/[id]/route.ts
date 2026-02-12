import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { jsonWithCors, handleOptions } from "@/middleware/cors";
import { serializeIssue } from "@/utils/serialize";
import {
  cacheGet,
  cacheSet,
  invalidateIssuesListCache,
  invalidateIssueCache,
  issuesOneCacheKey,
  getIssuesOneTtl,
} from "@/lib/cache";
import { IssueStatus } from "@prisma/client";
import { requirePermission, AuthenticatedRequest } from "@/lib/rbac/middleware";
import { logAccessGranted } from "@/lib/rbac/logging";

type ParamsPromise = { params: Promise<{ id: string }> };

/**
 * Handle OPTIONS preflight request
 */
export async function OPTIONS(req: NextRequest) {
  return handleOptions(req);
}

/**
 * GET /api/issues/:id – Get one issue (by id or publicId).
 * Uses Redis cache-aside; 404 is not cached.
 */
export async function GET(req: NextRequest, context: ParamsPromise) {
  const origin = req.headers.get("origin");
  
  try {
    const { id } = await context.params;
    const key = issuesOneCacheKey(id);
    const ttl = getIssuesOneTtl();
    const cached = await cacheGet<{ success: true; data: Record<string, unknown> }>(key);
    if (cached) {
      console.log("[Cache] CACHE HIT key=" + key);
      return jsonWithCors(cached, undefined, origin);
    }
    console.log("[Cache] CACHE MISS key=" + key);

    const isNumeric = /^\d+$/.test(id);
    const issue = await prisma.issue.findFirst({
      where: isNumeric ? { id: Number(id) } : { publicId: id },
      include: {
        reportedBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    if (!issue) {
      return jsonWithCors(
        { success: false, message: "Issue not found" },
        { status: 404 },
        origin
      );
    }

    const payload = { success: true as const, data: serializeIssue(issue as Parameters<typeof serializeIssue>[0]) };
    await cacheSet(key, payload, ttl);
    return jsonWithCors(payload, undefined, origin);
  } catch (err) {
    console.error("GET /api/issues/[id]:", err);
    return jsonWithCors(
      { success: false, message: "Failed to fetch issue" },
      { status: 500 },
      origin
    );
  }
}

/**
 * PATCH /api/issues/:id – Update status, assign, proof, resolution
 * Requires: update permission
 */
export async function PATCH(req: NextRequest, context: ParamsPromise) {
  const { id } = await context.params;
  
  // Check permission
  const authCheck = await requirePermission("update", `/api/issues/${id}`)(req);
  if (authCheck instanceof NextRequest) {
    const authReq = authCheck as AuthenticatedRequest;
    const user = authReq.user!;
    
    // Log access granted
    logAccessGranted(
      user.id,
      user.email,
      user.role,
      "update",
      `/api/issues/${id}`,
      "PATCH"
    );
    
    try {
      const resolvedId = await id;
      const body = await req.json();
      const origin = req.headers.get("origin");

      const issue = await prisma.issue.findFirst({
        where: /^\d+$/.test(resolvedId) ? { id: Number(resolvedId) } : { publicId: resolvedId },
      });
      
      if (!issue) {
        return jsonWithCors(
          { success: false, message: "Issue not found" },
          { status: 404 },
          origin
        );
      }

      const updates: {
      status?: IssueStatus;
      assignedToId?: number | null;
      resolutionNotes?: string;
      proofUrls?: unknown;
      satisfactionRating?: number | null;
      reopened?: boolean;
      timeline?: unknown;
    } = {};

    if (body.status && Object.values(IssueStatus).includes(body.status)) {
      updates.status = body.status as IssueStatus;
    }
    if (body.assignedToId !== undefined) {
      updates.assignedToId = body.assignedToId === null ? null : Number(body.assignedToId);
    }
    if (body.resolutionNotes !== undefined) updates.resolutionNotes = body.resolutionNotes;
    if (body.proofUrls !== undefined) updates.proofUrls = body.proofUrls;
    if (body.satisfactionRating !== undefined) updates.satisfactionRating = body.satisfactionRating;
    if (body.reopened !== undefined) updates.reopened = body.reopened;
    if (body.timeline !== undefined) updates.timeline = body.timeline;

    const updated = await prisma.issue.update({
      where: { id: issue.id },
      data: updates,
      include: {
        reportedBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
      },
    });

      await Promise.all([
        invalidateIssuesListCache(),
        invalidateIssueCache(resolvedId),
        invalidateIssueCache(updated.publicId || String(updated.id)),
      ]);

      return jsonWithCors({ success: true, data: serializeIssue(updated as Parameters<typeof serializeIssue>[0]) }, undefined, origin);
    } catch (err) {
      console.error("PATCH /api/issues/[id]:", err);
      const origin = req.headers.get("origin");
      return jsonWithCors(
        { success: false, message: "Failed to update issue" },
        { status: 500 },
        origin
      );
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

/**
 * DELETE /api/issues/:id – Delete issue
 * Requires: delete permission (admin only)
 */
export async function DELETE(req: NextRequest, context: ParamsPromise) {
  const { id } = await context.params;
  const resolvedId = await id;

  const authCheck = await requirePermission("delete", `/api/issues/${resolvedId}`)(req);
  if (authCheck instanceof NextRequest) {
    const authReq = authCheck as AuthenticatedRequest;
    const user = authReq.user!;

    logAccessGranted(
      user.id,
      user.email,
      user.role,
      "delete",
      `/api/issues/${resolvedId}`,
      "DELETE"
    );

    try {
      const origin = req.headers.get("origin");

      const isNumeric = /^\d+$/.test(resolvedId);
      const issue = await prisma.issue.findFirst({
        where: isNumeric ? { id: Number(resolvedId) } : { publicId: resolvedId },
      });

      if (!issue) {
        return jsonWithCors(
          { success: false, message: "Issue not found" },
          { status: 404 },
          origin
        );
      }

      await prisma.issue.delete({ where: { id: issue.id } });

      await Promise.all([
        invalidateIssuesListCache(),
        invalidateIssueCache(resolvedId),
        invalidateIssueCache(issue.publicId || String(issue.id)),
      ]);

      return jsonWithCors(
        { success: true, message: "Issue deleted successfully" },
        undefined,
        origin
      );
    } catch (err) {
      console.error("DELETE /api/issues/[id]:", err);
      const origin = req.headers.get("origin");
      return jsonWithCors(
        { success: false, message: "Failed to delete issue" },
        { status: 500 },
        origin
      );
    }
  }

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
