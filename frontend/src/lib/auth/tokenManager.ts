/**
 * Secure token management - memory-only storage
 * Never stores tokens in localStorage or sessionStorage
 */

let accessToken: string | null = null;
let tokenRefreshPromise: Promise<string> | null = null;

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") || "http://localhost:5000";

/**
 * Set access token (memory only)
 */
export function setAccessToken(token: string | null): void {
  accessToken = token;
}

/**
 * Get access token (memory only)
 */
export function getAccessToken(): string | null {
  return accessToken;
}

/**
 * Clear access token
 */
export function clearAccessToken(): void {
  accessToken = null;
  tokenRefreshPromise = null;
}

/**
 * Refresh access token using refresh token cookie
 * Implements request deduplication to prevent multiple simultaneous refresh calls
 */
export async function refreshAccessToken(): Promise<string> {
  // If already refreshing, return the existing promise
  if (tokenRefreshPromise) {
    return tokenRefreshPromise;
  }

  tokenRefreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        credentials: "include", // Include cookies
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Clear token on failure
        clearAccessToken();
        throw new Error(data.message || "Token refresh failed");
      }

      const newAccessToken = data.data?.accessToken;
      if (!newAccessToken) {
        clearAccessToken();
        throw new Error("No access token in refresh response");
      }

      setAccessToken(newAccessToken);
      return newAccessToken;
    } catch (error) {
      clearAccessToken();
      throw error;
    } finally {
      // Clear promise after completion
      tokenRefreshPromise = null;
    }
  })();

  return tokenRefreshPromise;
}

/**
 * Check if token is expired (basic check - JWT expiry is validated server-side)
 * This is a client-side approximation
 */
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;

  try {
    // Decode without verification (client-side only)
    const payload = JSON.parse(atob(token.split(".")[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();

    // Consider expired if less than 1 minute remaining
    return exp - now < 60 * 1000;
  } catch {
    return true;
  }
}

/**
 * Decode JWT payload (for UI display only; backend always verifies).
 * Returns { id, email, role } when token is valid.
 */
export function decodeTokenPayload(token: string | null): { id: number; email: string; role: string } | null {
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.id != null && payload.email != null && payload.role != null) {
      return { id: payload.id, email: payload.email, role: payload.role };
    }
  } catch {
    /* ignore */
  }
  return null;
}
