import { sendSuccess, sendError } from "@/lib/responseHandler";
import { ERROR_CODES } from "@/lib/errorCodes";

/**
 * GET /api/tasks
 */
export async function GET() {
  try {
    return sendSuccess([], "Tasks fetched successfully");
  } catch (err) {
    return sendError(
      "Failed to fetch tasks",
      ERROR_CODES.INTERNAL_ERROR,
      500,
      err
    );
  }
}