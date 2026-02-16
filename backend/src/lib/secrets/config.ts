/**
 * Secret provider configuration - Supabase Vault.
 * Never logs secret values.
 */

export type SecretProvider = "supabase" | "";

export const SECRET_CONFIG = {
  /** Default cache TTL in seconds */
  DEFAULT_CACHE_TTL_SECONDS: 300,
  /** Max cache TTL (1 hour) */
  MAX_CACHE_TTL_SECONDS: 3600,
} as const;

/**
 * Returns the configured secret provider (supabase or empty for .env only).
 */
export function getSecretProvider(): SecretProvider {
  const p = process.env.SECRET_PROVIDER?.trim().toLowerCase();
  if (p === "supabase") return "supabase";
  return "";
}

/**
 * Returns true if cloud secret provider is configured.
 */
export function isCloudSecretsEnabled(): boolean {
  return getSecretProvider() !== "";
}

/**
 * Validates required env vars for Supabase Vault.
 */
export function validateSupabaseVaultConfig(): void {
  const missing: string[] = [];
  if (!process.env.SUPABASE_DATABASE_URL?.trim())
    missing.push("SUPABASE_DATABASE_URL");
  if (missing.length > 0) {
    throw new Error(
      `[Secrets] Supabase Vault config incomplete: ${missing.join(", ")}. ` +
        "Set SUPABASE_DATABASE_URL (Postgres connection string from Supabase Dashboard → Settings → Database)."
    );
  }
}

/**
 * Returns cache TTL in seconds from env or default.
 */
export function getCacheTtlSeconds(): number {
  const val = process.env.SECRET_CACHE_TTL_SECONDS;
  if (!val) return SECRET_CONFIG.DEFAULT_CACHE_TTL_SECONDS;
  const n = parseInt(val, 10);
  if (isNaN(n) || n < 60) return SECRET_CONFIG.DEFAULT_CACHE_TTL_SECONDS;
  return Math.min(n, SECRET_CONFIG.MAX_CACHE_TTL_SECONDS);
}
