/**
 * Structured JSON Logger - Enterprise observability
 *
 * - JSON format for log aggregation (Railway, Render, Fly.io, Logtail, Axiom)
 * - Correlation ID for request tracing
 * - No sensitive data (passwords, tokens, secrets)
 * - Production-safe: no stack traces in user responses
 */

const ENV = process.env.NODE_ENV ?? "development";
const LOG_LEVEL = (process.env.LOG_LEVEL ?? (ENV === "production" ? "info" : "debug")).toLowerCase();
const LEVELS: Record<string, number> = { debug: 0, info: 1, warn: 2, error: 3 };

/** Fields that must never appear in logs */
const SENSITIVE_KEYS = new Set(
  [
    "password",
    "token",
    "secret",
    "authorization",
    "cookie",
    "jwt",
    "refresh_token",
    "access_token",
    "api_key",
    "apikey",
    "credential",
  ].map((k) => k.toLowerCase())
);

function shouldLog(level: string): boolean {
  return (LEVELS[level] ?? 0) >= (LEVELS[LOG_LEVEL] ?? 1);
}

function maskSensitive(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const keyLower = k.toLowerCase();
    if (SENSITIVE_KEYS.has(keyLower) || keyLower.includes("password") || keyLower.includes("secret")) {
      out[k] = "[REDACTED]";
    } else if (v != null && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date)) {
      out[k] = maskSensitive(v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogContext = {
  requestId?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  latency?: number;
  environment?: string;
  errorCategory?: "validation_error" | "auth_error" | "system_error" | "external_service_error";
  [key: string]: unknown;
};

function createLogEntry(
  level: LogLevel,
  message: string,
  context: LogContext = {}
): Record<string, unknown> {
  const sanitized = maskSensitive(
    Object.fromEntries(
      Object.entries(context).filter(([, v]) => v !== undefined && v !== null)
    ) as Record<string, unknown>
  );
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    environment: ENV,
    ...sanitized,
  };
}

function write(entry: Record<string, unknown>, level: LogLevel): void {
  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
  } else {
    console.log(line);
  }
}

/**
 * Create a child logger bound to a request (correlation ID).
 */
export function createRequestLogger(requestId: string, endpoint?: string, method?: string) {
  const base: Partial<LogContext> = { requestId, endpoint, method, environment: ENV };
  return {
    debug(message: string, extra?: LogContext): void {
      if (!shouldLog("debug")) return;
      write(createLogEntry("debug", message, { ...base, ...extra }), "debug");
    },
    info(message: string, extra?: LogContext): void {
      if (!shouldLog("info")) return;
      write(createLogEntry("info", message, { ...base, ...extra }), "info");
    },
    warn(message: string, extra?: LogContext): void {
      if (!shouldLog("warn")) return;
      write(createLogEntry("warn", message, { ...base, ...extra }), "warn");
    },
    error(
      message: string,
      extra?: LogContext & { stack?: string; errorCategory?: LogContext["errorCategory"] }
    ): void {
      if (!shouldLog("error")) return;
      const entry = createLogEntry("error", message, { ...base, ...extra });
      if (extra?.stack && ENV !== "production") {
        entry.stack = extra.stack;
      }
      write(entry, "error");
    },
    request(endpoint: string, method: string): void {
      if (!shouldLog("info")) return;
      write(
        createLogEntry("info", "request_start", {
          ...base,
          endpoint,
          method,
        }),
        "info"
      );
    },
    response(endpoint: string, method: string, statusCode: number, latency: number): void {
      if (!shouldLog("info")) return;
      const level: LogLevel = statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";
      write(
        createLogEntry(level, "request_complete", {
          ...base,
          endpoint,
          method,
          statusCode,
          latency,
        }),
        level
      );
    },
  };
}

/**
 * Global logger (no request context). Use for startup, shutdown, background tasks.
 */
export const logger = {
  debug(message: string, extra?: LogContext): void {
    if (!shouldLog("debug")) return;
    write(createLogEntry("debug", message, { ...extra }), "debug");
  },
  info(message: string, extra?: LogContext): void {
    if (!shouldLog("info")) return;
    write(createLogEntry("info", message, { ...extra }), "info");
  },
  warn(message: string, extra?: LogContext): void {
    if (!shouldLog("warn")) return;
    write(createLogEntry("warn", message, { ...extra }), "warn");
  },
  error(
    message: string,
    extra?: LogContext & { stack?: string; errorCategory?: LogContext["errorCategory"] }
  ): void {
    if (!shouldLog("error")) return;
    const entry = createLogEntry("error", message, { ...extra });
    if (extra?.stack && ENV !== "production") {
      entry.stack = extra.stack;
    }
    write(entry, "error");
  },
};
