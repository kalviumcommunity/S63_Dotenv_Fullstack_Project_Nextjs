/**
 * Production-ready database configuration.
 * - Validates DATABASE_URL at runtime
 * - Enables SSL in production
 * - Configures connection pooling for serverless
 * - Never logs or exposes credentials
 */

const ENV = process.env.NODE_ENV ?? "development";
const isProduction = ENV === "production";

/** Connection pool limit for serverless (prevents connection exhaustion) */
const DEFAULT_CONNECTION_LIMIT = 10;

/** SSL mode for production. Use 'require' for cloud providers. */
const PRODUCTION_SSL_MODE = "require";

/**
 * Validates that DATABASE_URL is defined.
 * @throws Error with clear message if DATABASE_URL is missing
 */
export function validateDatabaseEnv(): void {
  const url = process.env.DATABASE_URL;
  if (!url || typeof url !== "string" || url.trim() === "") {
    throw new Error(
      "[Database] DATABASE_URL is not defined. Set DATABASE_URL in your .env file. " +
        "Example: postgresql://user:password@host:5432/database"
    );
  }
}

/** Append query params without parsing URL (avoids credential exposure) */
function appendParams(url: string, params: Record<string, string>): string {
  const qs = new URLSearchParams(params).toString();
  if (!qs) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}${qs}`;
}

/** Check if URL already has a query param (case-insensitive key match) */
function hasParam(url: string, key: string): boolean {
  const match = url.match(/\?([^#]*)/);
  if (!match) return false;
  const params = match[1];
  const re = new RegExp(`(^|&)${key}(=|&|$)`, "i");
  return re.test(params);
}

/**
 * Returns the production-ready database URL with:
 * - SSL enforced in production (sslmode=require unless already set)
 * - Connection pool limit (for serverless compatibility)
 * @throws Error if DATABASE_URL is missing
 */
export function getDatabaseUrl(): string {
  validateDatabaseEnv();
  let url = process.env.DATABASE_URL!.trim();

  const params: Record<string, string> = {};

  // Production: enforce SSL
  if (isProduction && !hasParam(url, "sslmode")) {
    params.sslmode = PRODUCTION_SSL_MODE;
  }

  // Serverless-safe: limit connections to prevent exhaustion
  if (!hasParam(url, "connection_limit")) {
    const limit =
      process.env.DATABASE_CONNECTION_LIMIT || String(DEFAULT_CONNECTION_LIMIT);
    params.connection_limit = limit;
  }

  if (Object.keys(params).length === 0) {
    return url;
  }

  return appendParams(url, params);
}

/**
 * Returns true if running in production.
 */
export function isProductionEnv(): boolean {
  return isProduction;
}
