import Redis from "ioredis";

let client: Redis | null = null;
let clientError: boolean = false;
let connectionAttempted: boolean = false;

/**
 * Returns a single shared Redis client instance. Connection uses REDIS_URL from env.
 * Reuses the same instance to avoid multiple connections.
 * Returns null if Redis is unavailable or connection fails.
 */
export function getRedisClient(): Redis | null {
  // If we've already determined Redis is unavailable, don't try again
  if (clientError) return null;
  
  if (client) return client;

  const url = process.env.REDIS_URL;
  if (!url || url.trim() === "") {
    // Only log once
    if (!connectionAttempted) {
      console.log("[Redis] REDIS_URL not set, running without cache");
      connectionAttempted = true;
    }
    clientError = true;
    return null;
  }

  // Only attempt connection once
  if (connectionAttempted) {
    return client;
  }
  connectionAttempted = true;

  try {
    client = new Redis(url, {
      maxRetriesPerRequest: 1, // Reduce retries to fail faster
      retryStrategy(times) {
        // Fail immediately after first retry
        if (times > 1) {
          if (!clientError) {
            console.warn("[Redis] Connection failed, disabling cache. App will run without caching.");
            clientError = true;
          }
          return null; // Stop retrying
        }
        return 100; // Quick retry
      },
      lazyConnect: true,
      enableOfflineQueue: false, // Don't queue commands if disconnected
      connectTimeout: 2000, // 2 second timeout (faster failure)
      showFriendlyErrorStack: false,
    });

    // Suppress error spam - only log once
    let errorLogged = false;
    client.on("error", (err) => {
      if (!errorLogged && (err.message.includes("ECONNREFUSED") || err.message.includes("ENOTFOUND") || err.message.includes("connect ECONNREFUSED"))) {
        console.warn("[Redis] Cannot connect to Redis server. Running without cache.");
        errorLogged = true;
        clientError = true;
        // Clean up the client
        try {
          client?.disconnect();
        } catch {
          // Ignore disconnect errors
        }
        client = null;
      }
    });

    client.on("connect", () => {
      console.log("[Redis] Connected successfully");
      clientError = false;
    });

    client.on("close", () => {
      // Only log if we haven't already marked as error
      if (!clientError) {
        console.warn("[Redis] Connection closed");
      }
    });

    // Try to connect, but don't block
    client.connect().catch(() => {
      // Connection failed - already handled by error event
      clientError = true;
    });

    return client;
  } catch (err) {
    console.warn("[Redis] Failed to initialize Redis client. Running without cache.");
    clientError = true;
    return null;
  }
}
