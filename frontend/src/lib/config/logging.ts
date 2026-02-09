/**
 * Structured JSON logger – console only, no external libs.
 * Supports info and error levels; each log includes level, message, meta, timestamp.
 */

export type LogLevel = "info" | "error";

export type LogMeta = Record<string, unknown>;

function formatLog(level: LogLevel, message: string, meta?: LogMeta): string {
  const payload = {
    level,
    message,
    meta: meta ?? {},
    timestamp: new Date().toISOString(),
  };
  return JSON.stringify(payload);
}

export function logInfo(message: string, meta?: LogMeta): void {
  console.log(formatLog("info", message, meta));
}

export function logError(message: string, meta?: LogMeta): void {
  console.error(formatLog("error", message, meta));
}
