import { NextRequest } from "next/server";
import { prisma } from "@/lib/database";
import { jsonWithCors, handleOptions } from "@/middleware/cors";
import { serializeIssue } from "@/utils/serialize";
import {
  cacheAside,
  invalidateIssuesListCache,
  getIssuesListTtl,
  issuesListCacheKey,
} from "@/lib/cache";
import { IssueCategory, IssueStatus } from "@prisma/client";
import { requirePermission, AuthenticatedRequest } from "@/lib/rbac/middleware";
import { extractTokenFromHeader } from "@/lib/auth/tokens";
import { logAccessGranted } from "@/lib/rbac/logging";
import { AppRole } from "@/lib/rbac/permissions";
import { sanitizeField } from "@/lib/security";

const ANONYMOUS_EMAIL = "anonymous@civictrack.local";

async function getOrCreateAnonymousUserId(): Promise<number> {
  let user = await prisma.user.findFirst({
    where: { email: ANONYMOUS_EMAIL },
  });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: "Anonymous",
        email: ANONYMOUS_EMAIL,
        password: null,
        role: "citizen",
      },
    });
  }
  return user.id;
}

function nextPublicId(): string {
  return `CT-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

/**
 * Handle OPTIONS preflight request
 */
export async function OPTIONS(req: NextRequest) {
  return handleOptions(req);
}

/**
 * GET /api/issues – List issues (category, status, limit, offset).
 * Uses Redis cache-aside: hit returns cached JSON; miss loads from DB, stores in cache, returns.
 */
export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin");
  
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 100, 1), 500);
    const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

    const where: { category?: IssueCategory; status?: IssueStatus } = {};
    if (category && Object.values(IssueCategory).includes(category as IssueCategory)) {
      where.category = category as IssueCategory;
    }
    if (status && Object.values(IssueStatus).includes(status as IssueStatus)) {
      where.status = status as IssueStatus;
    }

    const key = issuesListCacheKey(category, status, limit, offset);
    const ttl = getIssuesListTtl();

    const payload = await cacheAside(
      key,
      ttl,
      async () => {
        const [rawIssues, total] = await Promise.all([
          prisma.issue.findMany({
            where,
            include: {
              reportedBy: { select: { id: true, name: true } },
              assignedTo: { select: { id: true, name: true, email: true, role: true } },
            },
            orderBy: { createdAt: "desc" },
            take: limit,
            skip: offset,
          }),
          prisma.issue.count({ where }),
        ]);
        const issues = rawIssues.map((i) =>
          serializeIssue(i as Parameters<typeof serializeIssue>[0])
        );
        return { success: true, data: { issues, total } };
      }
    );

    return jsonWithCors(payload, undefined, origin);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorStack = err instanceof Error ? err.stack : undefined;
    console.error("GET /api/issues error:", errorMessage);
    if (errorStack) {
      console.error("Stack trace:", errorStack);
    }
    return jsonWithCors(
      { success: false, message: "Failed to fetch issues", data: { issues: [], total: 0 } },
      { status: 500 },
      origin
    );
  }
}

/**
 * POST /api/issues – Create issue (title, description?, category, lat/lng?, isAnonymous?, reportedById?)
 * Requires: create permission (citizens and admins can create issues)
 * Note: Also allows anonymous issue creation via getOrCreateAnonymousUserId()
 */
export async function POST(req: NextRequest) {
  // Try to authenticate and check permission
  // If no auth token, allow anonymous creation
  const token = extractTokenFromHeader(req.headers.get("authorization"));
  let user: { id: number; email: string; role: AppRole } | null = null;
  
  if (token) {
    // Authenticated user - check permission
    const authCheck = await requirePermission("create", "/api/issues")(req);
    if (authCheck instanceof NextRequest) {
      const authReq = authCheck as AuthenticatedRequest;
      user = authReq.user!;
      
      // Log access granted
      logAccessGranted(
        user.id,
        user.email,
        user.role,
        "create",
        "/api/issues",
        "POST"
      );
    } else {
      // Permission denied for authenticated user
      return authCheck;
    }
  }
  // If no token, proceed with anonymous creation (user will be null)
  
  const origin = req.headers.get("origin");

  try {
    const body = await req.json();
    const rawTitle = typeof body.title === "string" ? body.title.trim() : "";
    const category = body.category;

    if (!rawTitle) {
      return jsonWithCors(
        { success: false, message: "Title is required" },
        { status: 400 },
        origin
      );
    }
    if (!category || !Object.values(IssueCategory).includes(category)) {
      return jsonWithCors(
        { success: false, message: "Valid category is required (GARBAGE, WATER_SUPPLY, ROAD_DAMAGE, STREETLIGHT, OTHER)" },
        { status: 400 },
        origin
      );
    }

    const rawDescription = typeof body.description === "string" ? body.description.trim() : null;
    let title: string;
    let description: string | null = null;
    try {
      title = sanitizeField(rawTitle, "title");
      if (rawDescription) {
        description = sanitizeField(rawDescription, "description");
      }
    } catch (sanitizeErr) {
      return jsonWithCors(
        { success: false, message: "Invalid input: disallowed content detected", error: { code: "VALIDATION_ERROR" } },
        { status: 400 },
        origin
      );
    }
    if (!title) {
      return jsonWithCors(
        { success: false, message: "Title is required" },
        { status: 400 },
        origin
      );
    }

    let reportedById = body.reportedById != null ? Number(body.reportedById) : null;
    if (reportedById == null || !Number.isInteger(reportedById) || reportedById < 1) {
      reportedById = await getOrCreateAnonymousUserId();
    } else {
      const exists = await prisma.user.findUnique({ where: { id: reportedById } });
      if (!exists) {
        reportedById = await getOrCreateAnonymousUserId();
      }
    }

    const isAnonymous = Boolean(body.isAnonymous);
    const latitude = body.latitude != null ? Number(body.latitude) : null;
    const longitude = body.longitude != null ? Number(body.longitude) : null;

    const raw = await prisma.issue.create({
      data: {
        title,
        description: description || null,
        category: category as IssueCategory,
        latitude: latitude != null && Number.isFinite(latitude) ? latitude : null,
        longitude: longitude != null && Number.isFinite(longitude) ? longitude : null,
        reportedById,
        isAnonymous,
        publicId: nextPublicId(),
      },
      include: {
        reportedBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    await invalidateIssuesListCache();

    // Log anonymous creation if no user
    if (!user) {
      console.log(`[RBAC] ALLOWED | User: Anonymous | Permission: create | Resource: /api/issues | Method: POST`);
    }

    return jsonWithCors({ success: true, data: serializeIssue(raw as Parameters<typeof serializeIssue>[0]) }, undefined, origin);
  } catch (err) {
    console.error("POST /api/issues:", err);
    return jsonWithCors(
      { success: false, message: "Failed to create issue" },
      { status: 500 },
      origin
    );
  }
}
