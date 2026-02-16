import { NextRequest } from "next/server";
import { jsonWithCors, handleOptions } from "@/middleware/cors";
import { requireAnyPermission } from "@/lib/rbac/middleware";
import {
  isStorageConfigured,
  createPresignedUploadUrl,
  validateUploadRequest,
  getMaxFileSizeBytes,
} from "@/lib/storage";

/**
 * Handle OPTIONS preflight
 */
export async function OPTIONS(req: NextRequest) {
  return handleOptions(req);
}

/**
 * POST /api/storage/upload-url
 * Generate presigned PUT URL for secure upload.
 * Requires authentication (create or update permission).
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

  const authCheck = await requireAnyPermission(
    ["create", "update"],
    "/api/storage/upload-url"
  )(req);

  if (authCheck instanceof Response) {
    return authCheck;
  }

  try {
    const body = await req.json();
    const { fileName, fileType, contentLength } = body;

    const validation = validateUploadRequest(
      fileName,
      fileType,
      contentLength,
      getMaxFileSizeBytes()
    );

    if (!validation.valid || !validation.key) {
      return jsonWithCors(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: validation.error },
          message: validation.error,
        },
        { status: 400 },
        origin
      );
    }

    const result = await createPresignedUploadUrl(
      validation.key,
      fileType.trim().toLowerCase(),
      validation.contentLength
    );

    const responsePayload: Record<string, unknown> = {
      success: true,
      uploadUrl: result.uploadUrl,
      key: result.key,
      expiresInSeconds: result.expiresInSeconds,
      contentType: fileType.trim().toLowerCase(),
    };
    if (validation.contentLength !== undefined) {
      responsePayload.contentLength = validation.contentLength;
    }
    if ("token" in result && result.token) {
      responsePayload.token = result.token;
    }
    return jsonWithCors(responsePayload, undefined, origin);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[Storage] Upload URL generation failed:", msg);

    return jsonWithCors(
      {
        success: false,
        error: { code: "INTERNAL_ERROR" },
        message: process.env.NODE_ENV === "production" ? "Failed to generate upload URL" : msg,
      },
      { status: 500 },
      origin
    );
  }
}
