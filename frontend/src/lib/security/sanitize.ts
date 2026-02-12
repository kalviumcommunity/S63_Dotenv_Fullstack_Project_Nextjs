/**
 * Frontend Sanitization - OWASP XSS Prevention
 *
 * Use for any user-generated content that might be rendered.
 * React escapes by default for {variable}; use this only when
 * strictly necessary (e.g. limited HTML from trusted source).
 *
 * Prefer plain text rendering - do NOT use dangerouslySetInnerHTML
 * with unsanitized content.
 */

import filterXSS from "xss";

/**
 * Sanitize string to safe plain text (strips all HTML)
 */
export function sanitizePlainText(input: unknown): string {
  if (input == null) return "";
  const str = typeof input === "string" ? input : String(input);
  return filterXSS(str, { whiteList: {}, stripIgnoreTag: true }).trim();
}
