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
        if (times > 3) {
          console.error("[Redis] Max retries exceeded");
          return null;
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    client.on("error", (err) => {
      console.error("[Redis] Client error:", err.message);
    });

    client.on("connect", () => {
      console.log("[Redis] Client connected");
    });

    return client;
  } catch (err) {
    console.error("[Redis] Failed to create client:", (err as Error).message);
    return null;
  }
}
