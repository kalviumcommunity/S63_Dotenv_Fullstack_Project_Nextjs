import { NextRequest } from "next/server";
import { prisma } from "@/lib/database";
import { jsonWithCors } from "@/middleware/cors";
import { verifyToken, extractTokenFromHeader } from "@/services/auth";

/**
 * GET /api/users/officers - Get all officers (admin only)
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

    // Only admins can list officers
    if (user.role !== "admin") {
      return jsonWithCors({ success: false, message: "Forbidden" }, { status: 403 });
    }

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

    return jsonWithCors({
      success: true,
      data: officers.map((o) => ({
        id: o.id,
        name: o.name,
        email: o.email,
        createdAt: o.createdAt.toISOString(),
        activeAssignments: o._count.assignedIssues,
      })),
    });
  } catch (err) {
    console.error("GET /api/users/officers:", err);
    return jsonWithCors({ success: false, message: "Failed to fetch officers" }, { status: 500 });
  }
}
