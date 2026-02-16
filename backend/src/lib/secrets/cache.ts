/**
 * In-memory secret cache with TTL.
 * Prevents redundant cloud calls. Thread-safe via single-threaded Node.
 */

interface CacheEntry {
  value: Record<string, string>;
  expiresAt: number;
}

let cache: CacheEntry | null = null;
let fetchPromise: Promise<Record<string, string>> | null = null;

/**
 * Get cached secrets if still valid.
 */
export function getCached(ttlSeconds: number): Record<string, string> | null {
  if (!cache) return null;
  if (Date.now() >= cache.expiresAt) {
    cache = null;
    return null;
  }
  return cache.value;
}

/**
 * Set cache with TTL.
 */
export function setCache(value: Record<string, string>, ttlSeconds: number): void {
  cache = {
    value: { ...value },
    expiresAt: Date.now() + ttlSeconds * 1000,
  };
}

/**
 * Clear cache (for manual refresh / rotation).
 */
export function clearCache(): void {
  cache = null;
  fetchPromise = null;
}

/**
 * Get or set in-flight fetch promise to prevent race conditions.
 */
export function getFetchPromise(): Promise<Record<string, string>> | null {
  return fetchPromise;
}

export function setFetchPromise(p: Promise<Record<string, string>> | null): void {
  fetchPromise = p;
}
