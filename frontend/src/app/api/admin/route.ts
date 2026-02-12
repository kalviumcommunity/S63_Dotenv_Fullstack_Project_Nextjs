import { NextRequest } from "next/server";
import { sendSuccess } from "@/lib/config/responses";

/**
 * GET /api/admin (Protected Admin Route)
 * Accessible only to users with role "admin" (enforced by global middleware).
 */
export async function GET(req: NextRequest) {
  const email = req.headers.get("x-user-email") ?? "unknown";
  const role = req.headers.get("x-user-role") ?? "unknown";

  return sendSuccess(
    {
      message: "Admin route accessed successfully",
      email,
      role,
    },
    "Admin access granted"
  );
}

