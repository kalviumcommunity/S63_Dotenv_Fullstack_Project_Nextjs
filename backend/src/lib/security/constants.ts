/**
 * Security Constants - OWASP-aligned limits and patterns
 *
 * Input length limits prevent buffer overflow and denial-of-service.
 * Deny suspicious patterns by default (fail-closed).
 */

/** Max length for text fields stored in DB */
export const INPUT_LIMITS = {
  title: 500,
  description: 10_000,
  resolutionNotes: 5_000,
  notes: 2_000,
  name: 200,
  email: 254,
} as const;

/** Patterns that indicate potential XSS or injection attempts */
export const SUSPICIOUS_PATTERNS = [
  /<script\b[^>]*>[\s\S]*?<\/script>/gi,
  /javascript\s*:/gi,
  /on\w+\s*=\s*["'][^"']*["']/gi,
  /on\w+\s*=\s*[^\s>]+/gi,
  /<iframe/gi,
  /<object\b/gi,
  /<embed\b/gi,
  /<form\b/gi,
  /data\s*:\s*text\/html/gi,
  /vbscript\s*:/gi,
  /expression\s*\(/gi,
] as const;

/** SQL injection indicator patterns (for logging; Prisma parameterizes queries) */
export const SQLI_PATTERNS = [
  /'\s*or\s+['"]?\d+['"]?\s*=\s*['"]?\d+/gi,
  /;\s*drop\s+table/gi,
  /;\s*delete\s+from/gi,
  /union\s+select/gi,
  /or\s+1\s*=\s*1/gi,
  /'\s*;\s*--/gi,
  /--\s*$/,
  /\/\*[\s\S]*?\*\//,
] as const;
