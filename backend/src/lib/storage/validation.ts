/**
 * File validation for storage uploads.
 * Prevents path traversal, enforces MIME whitelist, size limits.
 */

import { STORAGE_CONFIG } from "./config";

/** Path traversal and unsafe character patterns */
const UNSAFE_PATTERNS = [
  /\.\./,
  /[\/\\]/,
  /[<>:"|?*]/,
  /^\s*$/,
  /[\x00-\x1f]/,
  /^\./,
] as const;

/** Max length for sanitized file name */
const MAX_FILENAME_LENGTH = 255;

/**
 * Parse allowed MIME types from env (comma-separated) or use defaults.
 */
function getAllowedMimeTypes(): Set<string> {
  const custom = process.env.STORAGE_ALLOWED_MIME_TYPES;
  if (custom?.trim()) {
    const list = custom.split(",").map((m) => m.trim().toLowerCase()).filter(Boolean);
    return new Set(list);
  }
  return new Set(STORAGE_CONFIG.DEFAULT_ALLOWED_MIME_TYPES);
}

/**
 * Get max file size from env (bytes) or use default.
 */
function getMaxFileSize(): number {
  const val = process.env.STORAGE_MAX_FILE_SIZE_BYTES;
  if (!val) return STORAGE_CONFIG.DEFAULT_MAX_FILE_SIZE;
  const num = parseInt(val, 10);
  if (isNaN(num) || num <= 0) return STORAGE_CONFIG.DEFAULT_MAX_FILE_SIZE;
  return Math.min(num, 50 * 1024 * 1024); // Cap at 50MB
}

export interface FileValidationResult {
  valid: boolean;
  sanitizedFileName?: string;
  key?: string;
  contentLength?: number;
  error?: string;
}

/**
 * Validates fileName, fileType, and contentLength for storage upload.
 * Prevents path traversal, enforces whitelist, size limit, sanitizes input.
 */
export function validateUploadRequest(
  fileName: unknown,
  fileType: unknown,
  contentLength?: unknown,
  maxSizeBytes?: number
): FileValidationResult {
  if (fileName == null || typeof fileName !== "string") {
    return { valid: false, error: "fileName is required and must be a string" };
  }

  if (fileType == null || typeof fileType !== "string") {
    return { valid: false, error: "fileType is required and must be a string" };
  }

  const mime = fileType.trim().toLowerCase();
  const allowed = getAllowedMimeTypes();
  if (!allowed.has(mime)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed: ${[...allowed].join(", ")}`,
    };
  }

  const maxSize = maxSizeBytes ?? getMaxFileSize();
  if (maxSize <= 0) {
    return { valid: false, error: "Invalid max file size configuration" };
  }

  // Validate content length if provided (required for presigned URL size enforcement)
  let size: number | undefined;
  if (contentLength !== undefined && contentLength !== null) {
    const n = typeof contentLength === "number" ? contentLength : parseInt(String(contentLength), 10);
    if (isNaN(n) || n < 0) {
      return { valid: false, error: "contentLength must be a non-negative number" };
    }
    if (n > maxSize) {
      return { valid: false, error: `File size exceeds maximum allowed (${maxSize} bytes)` };
    }
    size = n;
  }

  // Sanitize fileName: remove path, unsafe chars, trim
  let safe = fileName.trim();
  if (!safe) return { valid: false, error: "fileName cannot be empty" };

  // Extract basename (prevent path injection)
  const basename = safe.replace(/^.*[\/\\]/, "");

  for (const pattern of UNSAFE_PATTERNS) {
    if (pattern.test(basename)) {
      return {
        valid: false,
        error: "fileName contains invalid or unsafe characters",
      };
    }
  }

  // Alphanumeric, dash, underscore, dot only
  const cleaned = basename.replace(/[^\w\-_.]/g, "_");
  if (!cleaned) return { valid: false, error: "fileName invalid after sanitization" };

  const sanitized = cleaned.slice(0, MAX_FILENAME_LENGTH);

  // Generate S3 key: uploads/{timestamp}-{sanitized} to avoid collisions
  const prefix = process.env.STORAGE_KEY_PREFIX?.trim() || "uploads";
  const key = `${prefix}/${Date.now()}-${sanitized}`;

  return {
    valid: true,
    sanitizedFileName: sanitized,
    key,
    contentLength: size,
  };
}

/** Get configured max file size in bytes */
export function getMaxFileSizeBytes(): number {
  return getMaxFileSize();
}
