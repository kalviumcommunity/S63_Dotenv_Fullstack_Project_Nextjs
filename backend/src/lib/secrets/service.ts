/**
 * Unified secret service - Supabase Vault or .env fallback.
 * Never logs secret values.
 */

import {
  getSecretProvider,
  isCloudSecretsEnabled,
  validateSupabaseVaultConfig,
} from "./config";
import { fetchSecretsSupabase } from "./supabase";
import { clearCache } from "./supabase";

/**
 * Fetch all secrets from the configured cloud provider.
 * Returns empty object if cloud is not configured.
 */
export async function fetchAllSecrets(): Promise<Record<string, string>> {
  const provider = getSecretProvider();
  if (provider === "supabase") {
    validateSupabaseVaultConfig();
    return fetchSecretsSupabase();
  }
  return {};
}

/**
 * Get a single secret by key.
 * Uses cloud provider if configured, else falls back to process.env.
 */
export async function getSecret(key: string): Promise<string | undefined> {
  if (isCloudSecretsEnabled()) {
    const secrets = await fetchAllSecrets();
    return secrets[key];
  }
  const val = process.env[key];
  return val != null && val !== "" ? val : undefined;
}

/**
 * Load cloud secrets into process.env (for startup injection).
 * Only sets keys that are NOT already set (env takes precedence for overrides).
 * Call from instrumentation.ts before server starts.
 */
export async function loadSecretsIntoEnv(): Promise<{ keysLoaded: string[]; keysSkipped: string[] }> {
  if (!isCloudSecretsEnabled()) return { keysLoaded: [], keysSkipped: [] };

  const secrets = await fetchAllSecrets();
  const keysLoaded: string[] = [];
  const keysSkipped: string[] = [];

  for (const [key, value] of Object.entries(secrets)) {
    if (value == null || value === "") continue;
    if (process.env[key] != null && process.env[key] !== "") {
      keysSkipped.push(key);
      continue;
    }
    process.env[key] = value;
    keysLoaded.push(key);
  }

  return { keysLoaded, keysSkipped };
}

/**
 * Manually refresh cache (for rotation).
 * Clears in-memory cache; next getSecret will refetch.
 */
export function refreshSecretsCache(): void {
  clearCache();
}
