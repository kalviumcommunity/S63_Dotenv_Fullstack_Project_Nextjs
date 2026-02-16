/**
 * Security Logging - OWASP safe logging
 *
 * Logs sanitization events and rejected inputs.
 * Does NOT store raw malicious payloads or sensitive user data.
 * Uses structured JSON format for log aggregation.
 */

import { logger } from "../logging";

export function logSanitization(fieldName: string, wasTruncated: boolean): void {
  const action = wasTruncated ? "truncated" : "sanitized";
  logger.info("security_sanitization", { action, fieldName, errorCategory: "validation_error" });
}

export function logRejectedInput(fieldName: string, reason: string): void {
  logger.warn("security_rejected_input", { fieldName, reason, errorCategory: "validation_error" });
}

export function logSuspiciousInput(context: string, patternType: string): void {
  logger.warn("security_suspicious_input", { context, patternType, errorCategory: "validation_error" });
}
