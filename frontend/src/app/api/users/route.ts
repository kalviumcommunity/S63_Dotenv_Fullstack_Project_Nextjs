import { sendSuccess, sendError } from "@/lib/responseHandler";
import { ERROR_CODES } from "@/lib/errorCodes";

/**
 * GET /api/users
 */
export async function GET() {
  try {
    const users = [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ];

    return sendSuccess(users, "Users fetched successfully");
  } catch (err) {
    return sendError(
      "Failed to fetch users",
      ERROR_CODES.INTERNAL_ERROR,
      500,
      err
    );
  }
}

/**
 * POST /api/users
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.name) {
      return sendError(
        "Missing required field: name",
        ERROR_CODES.VALIDATION_ERROR,
        400
      );
    }

    return sendSuccess(
      body,
      "User created successfully",
      201
    );
  } catch (err) {
    return sendError(
      "User creation failed",
      ERROR_CODES.INTERNAL_ERROR,
      500,
      err
    );
  }
}