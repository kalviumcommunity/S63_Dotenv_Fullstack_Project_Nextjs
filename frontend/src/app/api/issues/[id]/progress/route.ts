import { sendSuccess, sendError } from "@/lib/responseHandler";
import { ERROR_CODES } from "@/lib/errorCodes";
import { handleError } from "@/lib/errorHandler";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000";

type ParamsPromise = { params: Promise<{ id: string }> };

export async function GET(req: Request, context: ParamsPromise) {
  try {
    const { id } = await context.params;
    const response = await fetch(`${BACKEND_URL}/api/issues/${id}/progress`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        return sendError(
          `Backend error: ${text.substring(0, 100)}`,
          ERROR_CODES.INTERNAL_ERROR,
          response.status
        );
      }
      return sendError(
        data.message || "Failed to fetch progress",
        data.error?.code || ERROR_CODES.INTERNAL_ERROR,
        response.status,
        data.error?.details
      );
    }

    const data = await response.json();
    return sendSuccess(data.data, data.message || "Progress fetched successfully");
  } catch (err) {
    return handleError(err, { route: "/api/issues/[id]/progress", method: "GET" });
  }
}

export async function POST(req: Request, context: ParamsPromise) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { percentage, notes } = body;

    if (typeof percentage !== "number" || percentage < 0 || percentage > 100) {
      return sendError(
        "Invalid percentage (must be 0-100)",
        ERROR_CODES.VALIDATION_ERROR,
        400
      );
    }

    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return sendError("Unauthorized", ERROR_CODES.UNAUTHORIZED, 401);
    }

    const response = await fetch(`${BACKEND_URL}/api/issues/${id}/progress`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ percentage, notes }),
    });

    if (!response.ok) {
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        return sendError(
          `Backend error: ${text.substring(0, 100)}`,
          ERROR_CODES.INTERNAL_ERROR,
          response.status
        );
      }
      return sendError(
        data.message || "Failed to update progress",
        data.error?.code || ERROR_CODES.INTERNAL_ERROR,
        response.status,
        data.error?.details
      );
    }

    const data = await response.json();
    return sendSuccess(data.data, data.message || "Progress updated successfully");
  } catch (err) {
    return handleError(err, { route: "/api/issues/[id]/progress", method: "POST" });
  }
}
