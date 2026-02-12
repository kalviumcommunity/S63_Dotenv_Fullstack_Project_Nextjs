/**
 * Security Headers - HTTPS, HSTS, CSP
 *
 * Environment-aware: strict in production, relaxed in development.
 */

const isProduction = process.env.NODE_ENV === "production";

const HSTS_MAX_AGE = "31536000"; // 1 year

/**
 * Redirect HTTP to HTTPS (production only).
 * Uses X-Forwarded-Proto when behind a proxy.
 */
export function shouldRedirectToHttps(request: Request): boolean {
  if (!isProduction) return false;

  const proto = request.headers.get("x-forwarded-proto");
  if (proto === "https") return false;
  if (proto === "http") return true;

  const host = request.headers.get("host") ?? "";
  if (host.startsWith("localhost") || host.startsWith("127.0.0.1")) return false;

  return false;
}

/**
 * Build HTTPS redirect URL (308 permanent)
 */
export function buildHttpsRedirectUrl(request: Request): string {
  const url = new URL(request.url);
  url.protocol = "https:";
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) url.host = forwardedHost;
  return url.toString();
}

/**
 * Get HSTS header value (production only)
 */
export function getHstsHeader(): string | null {
  if (!isProduction) return null;
  return `max-age=${HSTS_MAX_AGE}; includeSubDomains; preload`;
}

/**
 * Get CSP header - strict in production, dev-friendly in development
 */
export function getCspHeader(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const connectSrc = ["'self'", "https:"];
  if (apiUrl) {
    try {
      const u = new URL(apiUrl);
      connectSrc.push(u.origin);
    } catch {
      /* ignore invalid URL */
    }
  }

  if (isProduction) {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      `connect-src ${[...new Set(connectSrc)].join(" ")}`,
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");
  }

  const devConnect = ["'self'", "https:", "ws:", "wss:"];
  if (apiUrl) {
    try {
      devConnect.push(new URL(apiUrl).origin);
    } catch {
      /* ignore */
    }
  }

  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    `connect-src ${devConnect.join(" ")}`,
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

/**
 * Get Permissions-Policy
 */
export function getPermissionsPolicyHeader(): string {
  return [
    "camera=()",
    "microphone=()",
    "geolocation=(self)",
    "payment=()",
    "usb=()",
    "magnetometer=()",
    "gyroscope=()",
    "accelerometer=()",
  ].join(", ");
}

/**
 * Apply security headers to a response
 */
export function applySecurityHeaders(headers: Headers, options?: { hsts?: boolean }): void {
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-XSS-Protection", "1; mode=block");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Content-Security-Policy", getCspHeader());
  headers.set("Permissions-Policy", getPermissionsPolicyHeader());

  const hsts = getHstsHeader();
  if (hsts && options?.hsts !== false) {
    headers.set("Strict-Transport-Security", hsts);
  }
}
