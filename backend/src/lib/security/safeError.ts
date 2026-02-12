/**
 * Safe Error Handling - OWASP
 *
 * Never expose stack traces, internal paths, or sensitive data in responses.
 */

const isProduction = process.env.NODE_ENV === "production";

export function getSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (isProduction) {
      return "An error occurred";
    }
    return error.message;
  }
  return "An error occurred";
}

export function getSafeErrorDetails(error: unknown): unknown {
  if (isProduction) {
    return undefined;
  }
  if (error instanceof Error && error.message) {
    return { message: error.message };
  }
  return undefined;
}
