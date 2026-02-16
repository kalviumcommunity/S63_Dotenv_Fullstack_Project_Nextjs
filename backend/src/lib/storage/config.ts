/**
 * Storage configuration - Supabase environment variable validation.
 * Never logs or exposes credentials.
 */

export const STORAGE_CONFIG = {
  /** Default max file size in bytes (2MB) */
  DEFAULT_MAX_FILE_SIZE: 2 * 1024 * 1024,
  /** Presigned upload URL expiry (Supabase uses default; documented for client) */
  UPLOAD_EXPIRY_SECONDS: 90,
  /** Presigned download URL expiry (seconds) */
  DOWNLOAD_EXPIRY_SECONDS: 60,
  /** Default allowed MIME types */
  DEFAULT_ALLOWED_MIME_TYPES: [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "application/pdf",
  ] as readonly string[],
} as const;

/**
 * Validates required Supabase Storage environment variables.
 * @throws Error with clear message if any required variable is missing
 */
export function validateStorageEnv(): void {
  const missing: string[] = [];
  if (!process.env.SUPABASE_URL?.trim()) missing.push("SUPABASE_URL");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim())
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!process.env.SUPABASE_BUCKET?.trim()) missing.push("SUPABASE_BUCKET");

  if (missing.length > 0) {
    throw new Error(
      `[Storage] Missing required environment variables: ${missing.join(", ")}. ` +
        "Set these in your .env file for Supabase Storage integration."
    );
  }
}

/**
 * Returns Supabase Storage configuration from environment.
 * Call validateStorageEnv() first or this will throw.
 */
export function getStorageConfig(): {
  url: string;
  serviceRoleKey: string;
  bucket: string;
} {
  validateStorageEnv();
  return {
    url: process.env.SUPABASE_URL!.trim().replace(/\/$/, ""),
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!.trim(),
    bucket: process.env.SUPABASE_BUCKET!.trim(),
  };
}

/**
 * Returns true if storage is configured (all required vars present).
 */
export function isStorageConfigured(): boolean {
  try {
    validateStorageEnv();
    return true;
  } catch {
    return false;
  }
}
