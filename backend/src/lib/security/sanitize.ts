/**
 * Input Sanitization - OWASP XSS Prevention
 *
 * Centralized sanitization for all user input before:
 * - Database writes
 * - Logging
 * - Returning in responses
 *
 * Uses xss library: removes script tags, event handlers,
 * malicious attributes. whiteList: {} strips all HTML for plain-text.
 */

import filterXSS from "xss";
import {
  INPUT_LIMITS,
  SUSPICIOUS_PATTERNS,
  SQLI_PATTERNS,
} from "./constants";
import { logSanitization, logRejectedInput } from "./logging";

export interface SanitizeResult {
  /** Sanitized value safe for storage/display */
  value: string;
  /** True if input was modified (had dangerous content) */
  wasModified: boolean;
  /** True if input matched suspicious patterns (rejected) */
  rejected: boolean;
  /** Reason for rejection if rejected */
  rejectReason?: string;
}

/**
 * Sanitize string for plain-text storage and display.
 * Strips ALL HTML; preserves safe plain text.
 * Use before DB writes and when returning user-generated content.
 */
export function sanitizeString(
  input: unknown,
  options: {
    maxLength?: number;
    allowReject?: boolean;
    fieldName?: string;
  } = {}
): SanitizeResult {
  if (input == null) {
    return { value: "", wasModified: false, rejected: false };
  }

  const str = typeof input === "string" ? input : String(input);
  const { maxLength = 50_000, allowReject = true, fieldName = "input" } = options;

  // Reject suspicious patterns (fail-closed)
  if (allowReject) {
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (new RegExp(pattern.source, pattern.flags).test(str)) {
        logRejectedInput(fieldName, "XSS_PATTERN");
        return {
          value: "",
          wasModified: true,
          rejected: true,
          rejectReason: "Input contains disallowed content",
        };
      }
    }
    for (const pattern of SQLI_PATTERNS) {
      if (new RegExp(pattern.source, pattern.flags).test(str)) {
        logRejectedInput(fieldName, "SQLI_PATTERN");
        return {
          value: "",
          wasModified: true,
          rejected: true,
          rejectReason: "Input contains disallowed content",
        };
      }
    }
  }

  // Length limit
  const truncated = str.length > maxLength ? str.slice(0, maxLength) : str;
  const wasTruncated = str.length > maxLength;

  // xss with empty whiteList strips all HTML, leaves plain text
  const sanitized = filterXSS(truncated, { whiteList: {}, stripIgnoreTag: true }).trim();

  const wasModified = sanitized !== str || wasTruncated;
  if (wasModified) {
    logSanitization(fieldName, wasTruncated);
  }

  return {
    value: sanitized,
    wasModified,
    rejected: false,
  };
}

/**
 * Sanitize with field-specific max length
 */
export function sanitizeForField(
  input: unknown,
  field: keyof typeof INPUT_LIMITS
): SanitizeResult {
  const maxLength = INPUT_LIMITS[field] ?? INPUT_LIMITS.description;
  return sanitizeString(input, { maxLength, fieldName: field });
}

/**
 * Sanitize a single string field. Rejects on suspicious patterns.
 */
export function sanitizeField(
  input: unknown,
  fieldLimit: keyof typeof INPUT_LIMITS
): string {
  const res = sanitizeForField(input, fieldLimit);
  if (res.rejected) {
    throw new Error(res.rejectReason ?? "Invalid input");
  }
  return res.value;
}

/**
 * Sanitize query param for safe use (cache keys, etc.)
 */
export function sanitizeQueryParam(input: unknown, maxLength = 200): string | null {
  if (input == null) return null;
  const str = typeof input === "string" ? input : String(input);
  const res = sanitizeString(str, { maxLength, allowReject: true });
  return res.rejected ? null : res.value;
}
