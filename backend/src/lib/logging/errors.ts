/**
 * Error Categorization - For structured logging and alerting
 *
 * Categories:
 * - validation_error: Invalid input, schema failures
 * - auth_error: Auth failures, token issues
 * - system_error: Internal errors (DB, config)
 * - external_service_error: Supabase, third-party API failures
 */

export type ErrorCategory =
  | "validation_error"
  | "auth_error"
  | "system_error"
  | "external_service_error";

export function categorizeError(error: unknown): ErrorCategory {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes("validation") ||
      msg.includes("invalid") ||
      msg.includes("schema") ||
      msg.includes("required")
    )
      return "validation_error";
    if (
      msg.includes("unauthorized") ||
      msg.includes("forbidden") ||
      msg.includes("token") ||
      msg.includes("jwt") ||
      msg.includes("authentication") ||
      msg.includes("password")
    )
      return "auth_error";
    if (
      msg.includes("connection") ||
      msg.includes("econnrefused") ||
      msg.includes("timeout") ||
      msg.includes("database") ||
      msg.includes("prisma")
    )
      return "system_error";
    if (
      msg.includes("supabase") ||
      msg.includes("external") ||
      msg.includes("fetch") ||
      msg.includes("api")
    )
      return "external_service_error";
  }
  return "system_error";
}
