import { NextRequest } from "next/server";
import { jsonWithCors } from "@/middleware/cors";
import { requirePermission } from "@/lib/rbac/middleware";
import { refreshSecretsCache } from "@/lib/secrets";

/**
 * POST /api/secrets/refresh
 * Clears in-memory cache. Next secret access will refetch from cloud.
 * Use for rotation - no app restart required. Admin only.
 */
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");

  const authCheck = await requirePermission("delete", "/api/secrets/refresh")(req);
  if (authCheck instanceof Response) return authCheck;

  try {
    refreshSecretsCache();

    return jsonWithCors(
      {
        ok: true,
        message: "Secret cache cleared. Next access will refetch.",
      },
      undefined,
      origin
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[Secrets Refresh] Error:", msg);

    return jsonWithCors(
      {
        ok: false,
        error: "Cache refresh failed",
      },
      { status: 500 },
      origin
    );
  }
}
