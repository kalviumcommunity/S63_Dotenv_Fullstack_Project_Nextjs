import { NextRequest } from "next/server";
import { sendSuccess, sendError } from "@/lib/responseHandler";
import { ERROR_CODES } from "@/lib/errorCodes";
import { verifyAuthToken } from "@/lib/auth";
import { userSchema } from "@/lib/schemas/userSchema";
import { ZodError } from "zod";

/**
 * GET /api/users (Protected Route)
 */
export async function GET(req: NextRequest) {
  try {
    // Verify authentication token
    const authHeader = req.headers.get("authorization");
    verifyAuthToken(authHeader);

    // If token is valid, return users
    const users = [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ];

    return sendSuccess(users, "Users fetched successfully");
  } catch (err: any) {
    if (err.status) {
      return sendError(
        err.message || "Authentication failed",
        err.code || ERROR_CODES.VALIDATION_ERROR,
        err.status
      );
    }
    return sendError(
      "Failed to fetch users",
      ERROR_CODES.INTERNAL_ERROR,
      500,
      err instanceof Error ? err.message : "Unknown error"
    );
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

    return sendError(
      "Unexpected error",
      ERROR_CODES.INTERNAL_ERROR,
      500,
      error
    );
  }
}