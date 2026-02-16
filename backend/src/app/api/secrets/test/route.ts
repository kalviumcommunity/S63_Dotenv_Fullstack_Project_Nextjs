import { NextRequest } from "next/server";
import { jsonWithCors } from "@/middleware/cors";
import {
  isCloudSecretsEnabled,
  fetchAllSecrets,
  getSecretProvider,
} from "@/lib/secrets";

/**
 * GET /api/secrets/test
 * Verifies secret retrieval without exposing values.
 * Returns only metadata: provider, keys retrieved (not values).
 */
export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin");

  try {
    if (!isCloudSecretsEnabled()) {
      return jsonWithCors(
        {
          ok: true,
          provider: "none",
          message: "Cloud secrets not configured (using .env)",
          keysRetrieved: [],
        },
        undefined,
        origin
      );
    }

    const secrets = await fetchAllSecrets();
    const keys = Object.keys(secrets).sort();

    return jsonWithCors(
      {
        ok: true,
        provider: getSecretProvider(),
        keysRetrieved: keys,
        keyCount: keys.length,
        message: "Secrets retrieved successfully (values not exposed)",
      },
      undefined,
      origin
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[Secrets Test] Error:", msg);

    return jsonWithCors(
      {
        ok: false,
        error: "Secret retrieval failed",
        message: process.env.NODE_ENV === "production" ? "Secret retrieval failed" : msg,
      },
      { status: 503 },
      origin
    );
  }
}
