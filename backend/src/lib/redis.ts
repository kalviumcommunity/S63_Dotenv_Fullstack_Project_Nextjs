import Redis from "ioredis";

let client: Redis | null = null;

/**
 * Returns a single shared Redis client instance. Connection uses REDIS_URL from env.
 * Reuses the same instance to avoid multiple connections.
 */
export function getRedisClient(): Redis | null {
  if (client) return client;

  const url = process.env.REDIS_URL;
  if (!url || url.trim() === "") {
    return null;
  }

  try {
    client = new Redis(url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    client.on("error", (err) => {
      console.error("[Redis] connection error:", err.message);
    });

    client.on("connect", () => {
      console.log("[Redis] connected");
    });

    return client;
  } catch (err) {
    console.error("[Redis] failed to create client:", err);
    return null;
  }
}

/**
 * Ensures Redis connection is established. Safe to call; failures are logged only.
 */
export async function ensureRedisConnection(): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;
  try {
    await redis.connect();
    return true;
  } catch {
    return false;
  }
}
