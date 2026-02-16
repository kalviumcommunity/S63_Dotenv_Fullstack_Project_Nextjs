/**
 * Next.js instrumentation - runs before server starts.
 * Loads cloud secrets into process.env when SECRET_PROVIDER is set.
 * Registers global error handlers for unhandled rejections and uncaught exceptions.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  registerGlobalErrorHandlers();

  const provider = process.env.SECRET_PROVIDER?.trim().toLowerCase();
  if (provider !== "supabase") return;

  try {
    const { loadSecretsIntoEnv } = await import("./src/lib/secrets/service");
    const { keysLoaded, keysSkipped } = await loadSecretsIntoEnv();
    if (keysLoaded.length > 0) {
      console.info("[Secrets] Loaded keys from cloud:", keysLoaded.sort().join(", "));
    }
    if (keysSkipped.length > 0) {
      console.info("[Secrets] Skipped (already in env):", keysSkipped.length);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.warn("[Secrets] Failed to load from cloud, using .env fallback:", msg);
    // Do not throw - allow app to start with .env values
  }
}

function registerGlobalErrorHandlers(): void {
  process.on("unhandledRejection", (reason: unknown) => {
    const msg = reason instanceof Error ? reason.message : String(reason);
    const stack = reason instanceof Error ? reason.stack : undefined;
    const entry = {
      timestamp: new Date().toISOString(),
      level: "error",
      message: "unhandledRejection",
      environment: process.env.NODE_ENV ?? "development",
      error: msg,
      ...(process.env.NODE_ENV !== "production" && stack ? { stack } : {}),
    };
    console.error(JSON.stringify(entry));
  });

  process.on("uncaughtException", (err: Error) => {
    const entry = {
      timestamp: new Date().toISOString(),
      level: "error",
      message: "uncaughtException",
      environment: process.env.NODE_ENV ?? "development",
      error: err.message,
      ...(process.env.NODE_ENV !== "production" && err.stack ? { stack: err.stack } : {}),
    };
    console.error(JSON.stringify(entry));
    process.exit(1);
  });
}
