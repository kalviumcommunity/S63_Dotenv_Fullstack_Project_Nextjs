/**
 * Secure API client with automatic token refresh
 * Handles 401 errors by refreshing tokens and retrying requests
 */

import { getAccessToken, refreshAccessToken, clearAccessToken } from "@/lib/auth/tokenManager";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") || "http://localhost:5000";
const FETCH_TIMEOUT_MS = 12_000;

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  retryOn401?: boolean;
}

let isRefreshing = false;
let refreshSubscribers: Array<{ resolve: (token: string) => void; reject: (error: Error) => void }> = [];

function subscribeTokenRefresh(resolve: (token: string) => void, reject: (error: Error) => void) {
  refreshSubscribers.push({ resolve, reject });
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach(({ resolve }) => resolve(token));
  refreshSubscribers = [];
}

function onTokenRefreshFailed(error: Error) {
  refreshSubscribers.forEach(({ reject }) => reject(error));
  refreshSubscribers = [];
}

function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
}

function isAbortError(e: unknown): boolean {
  if (e instanceof Error) return e.name === "AbortError" || /abort|signal/i.test(e.message);
  return false;
}

/**
 * Make authenticated API request with automatic token refresh
 */
export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { skipAuth = false, retryOn401 = true, ...fetchOptions } = options;
  
  // Build headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers && typeof fetchOptions.headers === "object" && !(fetchOptions.headers instanceof Headers)
      ? (fetchOptions.headers as Record<string, string>)
      : {}),
  };

  if (!skipAuth) {
    const token = getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  // Make request
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;
  let response: Response;

  try {
    response = await fetchWithTimeout(url, {
      ...fetchOptions,
      headers,
      credentials: "include", // Always include cookies for refresh token
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw new Error(`Backend not responding. Is the API server running at ${API_BASE}?`);
    }
    throw error;
  }

  // Handle 401 Unauthorized - try to refresh token
  if (response.status === 401 && retryOn401 && !skipAuth) {
    // If we're already refreshing, wait for it
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh(
          async (newToken: string) => {
            try {
              // Retry request with new token
              const retryResponse = await fetchWithTimeout(url, {
                ...fetchOptions,
                headers: {
                  ...headers,
                  Authorization: `Bearer ${newToken}`,
                },
                credentials: "include",
              });
              
              if (!retryResponse.ok) {
                const errorData = await retryResponse.json().catch(() => ({ message: "Request failed" }));
                throw new Error(errorData.message || "Request failed");
              }
              
              resolve(retryResponse.json());
            } catch (err) {
              reject(err);
            }
          },
          (error) => reject(error)
        );
      });
    }

    // Start refresh process
    isRefreshing = true;

    try {
      const newToken = await refreshAccessToken();
      isRefreshing = false;
      onTokenRefreshed(newToken);

      // Retry original request with new token
      const retryResponse = await fetchWithTimeout(url, {
        ...fetchOptions,
        headers: {
          ...headers,
          Authorization: `Bearer ${newToken}`,
        },
        credentials: "include",
      });

      if (!retryResponse.ok) {
        const errorData = await retryResponse.json().catch(() => ({ message: "Request failed" }));
        throw new Error(errorData.message || "Request failed");
      }

      return retryResponse.json();
    } catch (refreshError) {
      isRefreshing = false;
      clearAccessToken();
      onTokenRefreshFailed(refreshError as Error);
      
      // If refresh failed, throw error
      throw new Error("Session expired. Please log in again.");
    }
  }

  // Handle other errors
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  return response.json();
}

/**
 * GET request helper
 */
export function apiGet<T = unknown>(endpoint: string, options?: RequestOptions): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: "GET" });
}

/**
 * POST request helper
 */
export function apiPost<T = unknown>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PATCH request helper
 */
export function apiPatch<T = unknown>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: "PATCH",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE request helper
 */
export function apiDelete<T = unknown>(endpoint: string, options?: RequestOptions): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: "DELETE" });
}
