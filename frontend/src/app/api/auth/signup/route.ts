import { sendSuccess, sendError } from "@/lib/responseHandler";
import { ERROR_CODES } from "@/lib/errorCodes";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return sendError(
        "All fields are required",
        ERROR_CODES.VALIDATION_ERROR,
        400
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
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
        data.message || "Signup failed",
        data.error?.code || ERROR_CODES.INTERNAL_ERROR,
        response.status,
        data.error?.details
      );
    }

    const data = await response.json();

    return sendSuccess(
      data.data,
      data.message || "Signup successful",
      response.status
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return sendError(
      "Signup failed",
      ERROR_CODES.INTERNAL_ERROR,
      500,
      errorMessage
    );
  }
}