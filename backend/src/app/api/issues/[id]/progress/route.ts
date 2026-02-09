import { NextRequest } from "next/server";
import { prisma } from "@/lib/database";
import { jsonWithCors } from "@/middleware/cors";
import { verifyToken, extractTokenFromHeader } from "@/services/auth";

type ParamsPromise = { params: Promise<{ id: string }> };

/**
 * GET /api/issues/:id/progress - Get progress updates for an issue
 */
export async function GET(req: NextRequest, context: ParamsPromise) {
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
      return jsonWithCors({ success: false, message: "Issue not found" }, { status: 404 });
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
    });
  } catch (err) {
    console.error("GET /api/issues/[id]/progress:", err);
    return jsonWithCors({ success: false, message: "Failed to fetch progress" }, { status: 500 });
  }
}

/**
 * POST /api/issues/:id/progress - Update progress (officer/admin only)
 */
export async function POST(req: NextRequest, context: ParamsPromise) {
  try {
    const token = extractTokenFromHeader(req.headers.get("authorization"));
    if (!token) {
      return jsonWithCors({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return jsonWithCors({ success: false, message: "Invalid token" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, role: true },
    });

    if (!user) {
      return jsonWithCors({ success: false, message: "User not found" }, { status: 401 });
    }

    // Only officers and admins can update progress
    if (user.role !== "officer" && user.role !== "admin") {
      return jsonWithCors({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { percentage, notes } = body;

    if (typeof percentage !== "number" || percentage < 0 || percentage > 100) {
      return jsonWithCors(
        { success: false, message: "Invalid percentage (must be 0-100)" },
        { status: 400 }
      );
    }

    const issue = await prisma.issue.findFirst({
      where: /^\d+$/.test(id) ? { id: Number(id) } : { publicId: id },
    });

    if (!issue) {
      return jsonWithCors({ success: false, message: "Issue not found" }, { status: 404 });
    }

    // Check if user is assigned to this issue or is admin
    if (issue.assignedToId !== user.id && user.role !== "admin") {
      return jsonWithCors(
        { success: false, message: "You are not assigned to this issue" },
        { status: 403 }
      );
    }

    // Create progress update
    const progressUpdate = await prisma.progressUpdate.create({
      data: {
        issueId: issue.id,
        percentage,
        notes: notes || null,
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
    });
  } catch (err) {
    console.error("POST /api/issues/[id]/progress:", err);
    return jsonWithCors({ success: false, message: "Failed to update progress" }, { status: 500 });
  }
}
