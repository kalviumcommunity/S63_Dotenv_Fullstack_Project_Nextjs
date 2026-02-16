/**
 * Security Headers - HTTPS, HSTS, CSP, CORS
 *
 * Environment-aware: strict in production, relaxed in development.
 */

const isProduction = process.env.NODE_ENV === "production";

/** Production: 1 year minimum for HSTS preload list eligibility */
const HSTS_MAX_AGE = "31536000"; // 1 year in seconds

/**
 * Redirect HTTP to HTTPS (production only).
 * Uses X-Forwarded-Proto when behind a proxy (Vercel, nginx, etc.).
 */
export function shouldRedirectToHttps(request: Request): boolean {
  if (!isProduction) return false;
  if (process.env.SKIP_HTTPS_REDIRECT === "1") return false;

  const proto = request.headers.get("x-forwarded-proto");
  if (proto === "https") return false;
  if (proto === "http") return true;

  // When no header: localhost/dev/docker local should not redirect
  const host = (request.headers.get("host") ?? "").split(":")[0];
  if (["localhost", "127.0.0.1", "0.0.0.0"].includes(host)) return false;

  // Behind proxy without x-forwarded-proto: assume HTTPS (proxy terminated TLS)
  return false;
}

/**
 * Build HTTPS redirect URL (308 permanent, preserves method for POST)
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
 * Get CSP header - strict in production, allows dev tools in development
 */
export function getCspHeader(): string {
  if (isProduction) {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");
  }

  // Development: allow unsafe-eval for HMR, websocket for dev server
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https: ws: wss:",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

/**
 * Get Permissions-Policy (restrict sensitive features)
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
 * Apply standard security headers to a response
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
