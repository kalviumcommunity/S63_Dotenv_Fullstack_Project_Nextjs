/**
 * Security Logging - OWASP safe logging
 *
 * Logs sanitization events and rejected inputs.
 * Does NOT store raw malicious payloads or sensitive user data.
 */

const LOG_PREFIX = "[SEC]";

export function logSanitization(fieldName: string, wasTruncated: boolean): void {
  const action = wasTruncated ? "truncated" : "sanitized";
  console.log(`${LOG_PREFIX} ${action} field=${fieldName}`);
}

export function logRejectedInput(fieldName: string, reason: string): void {
  console.warn(`${LOG_PREFIX} rejected field=${fieldName} reason=${reason}`);
}

export function logSuspiciousInput(context: string, patternType: string): void {
  console.warn(`${LOG_PREFIX} suspicious input context=${context} pattern=${patternType}`);
}
