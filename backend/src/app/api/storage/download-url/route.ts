import { NextRequest } from "next/server";
import { jsonWithCors, handleOptions } from "@/middleware/cors";
import { requirePermission } from "@/lib/rbac/middleware";
import {
  isStorageConfigured,
  createPresignedDownloadUrl,
} from "@/lib/storage";

/** Path traversal prevention for key param */
function isSafeKey(key: string): boolean {
  if (!key || typeof key !== "string") return false;
  const k = key.trim();
  if (!k) return false;
  if (k.includes("..")) return false;
  if (/[<>:"|?*]/.test(k)) return false;
  if (/^[\/\\]/.test(k)) return false;
  return true;
}

/**
 * Handle OPTIONS preflight
 */
export async function OPTIONS(req: NextRequest) {
  return handleOptions(req);
}

/**
 * POST /api/storage/download-url
 * Generate presigned GET URL for secure download.
 * Requires authentication (read permission).
 */
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");

  if (!isStorageConfigured()) {
    return jsonWithCors(
      {
        success: false,
        error: { code: "STORAGE_NOT_CONFIGURED" },
        message: "Storage service is not configured",
      },
      { status: 503 },
      origin
    );
  }

  const authCheck = await requirePermission("read", "/api/storage/download-url")(
    req
  );

  if (authCheck instanceof Response) {
    return authCheck;
  }

  try {
    const body = await req.json();
    const { key } = body;

    if (!key || typeof key !== "string") {
      return jsonWithCors(
        {
          success: false,
          error: { code: "VALIDATION_ERROR" },
          message: "key is required",
        },
        { status: 400 },
        origin
      );
    }

    if (!isSafeKey(key)) {
      return jsonWithCors(
        {
          success: false,
          error: { code: "VALIDATION_ERROR" },
          message: "Invalid key",
        },
        { status: 400 },
        origin
      );
    }

    const result = await createPresignedDownloadUrl(key);

    return jsonWithCors(
      {
        success: true,
        downloadUrl: result.downloadUrl,
        expiresInSeconds: result.expiresInSeconds,
      },
      undefined,
      origin
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[Storage] Download URL generation failed:", msg);

    return jsonWithCors(
      {
        success: false,
        error: { code: "INTERNAL_ERROR" },
        message:
          process.env.NODE_ENV === "production"
            ? "Failed to generate download URL"
            : msg,
      },
      { status: 500 },
      origin
    );
  }
}
