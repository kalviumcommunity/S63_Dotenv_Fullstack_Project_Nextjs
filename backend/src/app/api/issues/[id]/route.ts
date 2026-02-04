import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonWithCors } from "@/lib/cors";
import { serializeIssue } from "@/lib/serializeIssue";
import {
  cacheGet,
  cacheSet,
  invalidateIssuesListCache,
  invalidateIssueCache,
  issuesOneCacheKey,
  getIssuesOneTtl,
} from "@/lib/cache";
import { IssueStatus } from "@prisma/client";

type ParamsPromise = { params: Promise<{ id: string }> };

/**
 * GET /api/issues/:id – Get one issue (by id or publicId).
 * Uses Redis cache-aside; 404 is not cached.
 */
export async function GET(_req: NextRequest, context: ParamsPromise) {
  try {
    const { id } = await context.params;
    const key = issuesOneCacheKey(id);
    const ttl = getIssuesOneTtl();

    const cached = await cacheGet<{ success: true; data: Record<string, unknown> }>(key);
    if (cached) {
      console.log("[Cache] CACHE HIT key=" + key);
      return jsonWithCors(cached);
    }
    console.log("[Cache] CACHE MISS key=" + key);

    const isNumeric = /^\d+$/.test(id);
    const issue = await prisma.issue.findFirst({
      where: isNumeric ? { id: Number(id) } : { publicId: id },
      include: {
        reportedBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    if (!issue) {
      return jsonWithCors(
        { success: false, message: "Issue not found" },
        { status: 404 }
      );
    }

    const payload = { success: true as const, data: serializeIssue(issue as Parameters<typeof serializeIssue>[0]) };
    await cacheSet(key, payload, ttl);
    return jsonWithCors(payload);
  } catch (err) {
    console.error("GET /api/issues/[id]:", err);
    return jsonWithCors(
      { success: false, message: "Failed to fetch issue" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/issues/:id – Update status, assign, proof, resolution (officer/admin)
 */
export async function PATCH(req: NextRequest, context: ParamsPromise) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const issue = await prisma.issue.findFirst({
      where: /^\d+$/.test(id) ? { id: Number(id) } : { publicId: id },
    });

    if (!issue) {
      return jsonWithCors(
        { success: false, message: "Issue not found" },
        { status: 404 }
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
        assignedTo: { select: { id: true, name: true } },
      },
    });

    await Promise.all([
      invalidateIssuesListCache(),
      invalidateIssueCache(id),
      invalidateIssueCache(updated.publicId),
    ]);

    return jsonWithCors({ success: true, data: serializeIssue(updated as Parameters<typeof serializeIssue>[0]) });
  } catch (err) {
    console.error("PATCH /api/issues/[id]:", err);
    return jsonWithCors(
      { success: false, message: "Failed to update issue" },
      { status: 500 }
    );
  }
}
