import { NextRequest } from "next/server";
import { sendSuccess, sendError } from "@/lib/responseHandler";
import { ERROR_CODES } from "@/lib/errorCodes";
import { verifyAuthToken } from "@/lib/auth";
import { userSchema } from "@/lib/schemas/userSchema";
import { ZodError } from "zod";
import { handleError } from "@/lib/errorHandler";

/**
 * GET /api/users (Protected Route)
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    verifyAuthToken(authHeader);

    const users = [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ];

    return sendSuccess(users, "Users fetched successfully");
  } catch (err) {
    if (err && typeof err === "object" && "status" in err && typeof (err as { status: number }).status === "number") {
      return sendError(
        (err as { message?: string }).message || "Authentication failed",
        (err as { code?: string }).code || ERROR_CODES.VALIDATION_ERROR,
        (err as { status: number }).status
      );
    }
    return handleError(err, { route: "/api/users", method: "GET" });
  }
}

/**
 * POST /api/users (with Zod validation)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 🔒 Zod Validation
    const validatedData = userSchema.parse(body);

    return sendSuccess(
      validatedData,
      "User created successfully",
      201
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return sendError(
        "Validation Error",
        ERROR_CODES.VALIDATION_ERROR,
        400,
        error.issues.map((e) => ({
          field: e.path[0],
          message: e.message,
        }))
      );
    }
    return handleError(error, { route: "/api/users", method: "POST" });
  }
}