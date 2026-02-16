/**
 * Supabase Vault integration.
 * Queries vault.decrypted_secrets via Postgres connection.
 * Never logs secret values.
 */

import { Pool } from "pg";
import { getCacheTtlSeconds } from "./config";
import {
  getCached,
  setCache,
  clearCache,
  getFetchPromise,
  setFetchPromise,
} from "./cache";

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const url = process.env.SUPABASE_DATABASE_URL!.trim();
    pool = new Pool({
      connectionString: url,
      max: 2,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pool;
}

/**
 * Fetch all secrets from Supabase Vault.
 * Uses vault.decrypted_secrets view. Secrets are stored with unique names.
 * Uses cache to reduce DB calls.
 */
export async function fetchSecretsSupabase(): Promise<Record<string, string>> {
  const cached = getCached(getCacheTtlSeconds());
  if (cached) return cached;

  const inFlight = getFetchPromise();
  if (inFlight) return inFlight;

  const ttl = getCacheTtlSeconds();

  const promise = (async (): Promise<Record<string, string>> => {
    const client = await getPool().connect();
    try {
      const res = await client.query(
        `SELECT name, decrypted_secret FROM vault.decrypted_secrets WHERE name IS NOT NULL AND decrypted_secret IS NOT NULL`
      );

      const secrets: Record<string, string> = {};
      const keysFilter = process.env.SUPABASE_VAULT_KEYS?.trim()
        ? new Set(process.env.SUPABASE_VAULT_KEYS.split(",").map((k) => k.trim()).filter(Boolean))
        : null;

      for (const row of res.rows) {
        const name = row.name ? String(row.name) : "";
        const value = row.decrypted_secret ? String(row.decrypted_secret) : "";
        if (!name || !value) continue;
        if (keysFilter && !keysFilter.has(name)) continue;
        secrets[name] = value;
      }

      setCache(secrets, ttl);
      setFetchPromise(null);
      return secrets;
    } catch (err) {
      setFetchPromise(null);
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (msg.includes("permission") || msg.includes("does not exist") || msg.includes("relation")) {
        throw new Error(`[Secrets] Supabase Vault access error: ${msg}`);
      }
      throw err;
    } finally {
      client.release();
    }
  })();

  setFetchPromise(promise);
  return promise;
}

export { clearCache };
