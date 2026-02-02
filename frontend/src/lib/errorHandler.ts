import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";

export type ErrorHandlerContext = {
  route: string;
  method: string;
};

const PRODUCTION_MESSAGE = "Something went wrong. Please try again later.";

/**
 * Centralized error handler. Use in API route catch blocks.
 * - Development: returns actual error message and stack in JSON.
 * - Production: returns generic message only; never exposes stack to client.
 * - Always logs full error internally via structured logger.
 */
export function handleError(
  error: unknown,
  context: ErrorHandlerContext
): NextResponse {
  const isDev = process.env.NODE_ENV !== "production";
  const err = error instanceof Error ? error : new Error(String(error));
  const status = (error as { status?: number }).status ?? 500;
  const message = err.message;
  const stack = err.stack;

  // Always log full error internally (for observability; stack included)
  logError(`Error in ${context.method} ${context.route}`, {
    message,
    stack: stack ?? "N/A",
  });

  if (isDev) {
    return NextResponse.json(
      {
        success: false,
        message,
        stack: stack ?? undefined,
        timestamp: new Date().toISOString(),
      },
      { status }
    );
  }

  return NextResponse.json(
    {
      success: false,
      message: PRODUCTION_MESSAGE,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}
