import { NextRequest } from "next/server";
import { prisma } from "@/lib/database";
import { jsonWithCors } from "@/middleware/cors";
import { verifyToken, extractTokenFromHeader } from "@/services/auth";

/**
 * GET /api/issues/unassigned - Get all unassigned issues (admin only)
 */
export async function GET(req: NextRequest) {
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

    // Only admins can view unassigned issues
    if (user.role !== "admin") {
      return jsonWithCors({ success: false, message: "Forbidden" }, { status: 403 });
    }

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
    });
  } catch (err) {
    console.error("GET /api/issues/unassigned:", err);
    return jsonWithCors({ success: false, message: "Failed to fetch unassigned issues" }, { status: 500 });
  }
}
