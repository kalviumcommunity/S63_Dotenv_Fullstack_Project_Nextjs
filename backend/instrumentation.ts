/**
 * Next.js instrumentation - runs before server starts.
 * Loads cloud secrets into process.env when SECRET_PROVIDER is set.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

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
