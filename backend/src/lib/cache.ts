import { getRedisClient } from "./redis";

/** TTL in seconds. Default 60: list endpoints tolerate short staleness for better DB load. */
const DEFAULT_LIST_TTL = 60;
/** TTL for single-resource cache (e.g. one issue). Slightly shorter to reflect updates sooner. */
const DEFAULT_ONE_TTL = 30;

function getListTtl(): number {
  const ttl = process.env.CACHE_TTL_SECONDS;
  if (ttl != null && ttl !== "") {
    const n = parseInt(ttl, 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return DEFAULT_LIST_TTL;
}

function getOneTtl(): number {
  const ttl = process.env.CACHE_TTL_ONE_SECONDS;
  if (ttl != null && ttl !== "") {
    const n = parseInt(ttl, 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return DEFAULT_ONE_TTL;
}

const CACHE_KEY_PREFIX_LIST = "issues:list:";
const CACHE_KEY_PREFIX_ONE = "issues:one:";

/**
 * Get value from Redis. Returns null on miss or any Redis error (caller can fallback to DB).
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) return null;
  try {
    const raw = await redis.get(key);
    if (raw == null) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error("[Cache] get error:", (err as Error).message, "key:", key);
    return null;
  }
}

/**
 * Set value in Redis with TTL. Logs and ignores errors so API never crashes.
 */
export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  try {
    const serialized = JSON.stringify(value);
    await redis.setex(key, ttlSeconds, serialized);
  } catch (err) {
    console.error("[Cache] set error:", (err as Error).message, "key:", key);
  }
}

/**
 * Cache-aside: check cache first; on miss run fetch(), store result, return it.
 * On any Redis failure, runs fetch() and returns DB response (no crash).
 */
export async function cacheAside<T>(
  key: string,
  ttlSeconds: number,
  fetch: () => Promise<T>
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    console.log("[Cache] CACHE HIT key=" + key);
    return cached;
  }
  console.log("[Cache] CACHE MISS key=" + key);
  const data = await fetch();
  await cacheSet(key, data, ttlSeconds);
  return data;
}

/**
 * Invalidate all keys matching pattern (e.g. "issues:list:*"). Logs and ignores errors.
 */
export async function cacheInvalidatePattern(pattern: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log("[Cache] CACHE INVALIDATE pattern=" + pattern + " keys=" + keys.length);
    }
  } catch (err) {
    console.error("[Cache] invalidate error:", (err as Error).message, "pattern:", pattern);
  }
}

/**
 * Invalidate a single key. Logs and ignores errors.
 */
export async function cacheInvalidateKey(key: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  try {
    await redis.del(key);
    console.log("[Cache] CACHE INVALIDATE key=" + key);
  } catch (err) {
    console.error("[Cache] invalidate error:", (err as Error).message, "key:", key);
  }
}

// --- Issues-specific helpers ---

export function issuesListCacheKey(category: string | null, status: string | null, limit: number, offset: number): string {
  return `${CACHE_KEY_PREFIX_LIST}${category ?? ""}:${status ?? ""}:${limit}:${offset}`;
}

export function issuesOneCacheKey(id: string): string {
  return `${CACHE_KEY_PREFIX_ONE}${id}`;
}

export function getIssuesListTtl(): number {
  return getListTtl();
}

export function getIssuesOneTtl(): number {
  return getOneTtl();
}

/** Invalidate all issue list caches (call after POST/PATCH/DELETE that change list). */
export async function invalidateIssuesListCache(): Promise<void> {
  await cacheInvalidatePattern(CACHE_KEY_PREFIX_LIST + "*");
}

/** Invalidate one issue cache by id/publicId (call after PATCH that updates that issue). */
export async function invalidateIssueCache(id: string): Promise<void> {
  await cacheInvalidateKey(issuesOneCacheKey(id));
}
