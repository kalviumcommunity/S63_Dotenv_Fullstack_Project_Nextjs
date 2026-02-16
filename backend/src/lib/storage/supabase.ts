/**
 * Supabase Storage client and signed URL generation.
 * Private bucket only. No public access. Uses service role for server-side signing.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getStorageConfig, STORAGE_CONFIG } from "./config";

let supabaseClient: SupabaseClient | null = null;

/**
 * Returns a configured Supabase client (singleton) with service role.
 * Validates env on first call. Service role bypasses RLS for storage operations.
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const config = getStorageConfig();
    supabaseClient = createClient(config.url, config.serviceRoleKey, {
      auth: { persistSession: false },
    });
  }
  return supabaseClient;
}

export interface PresignedUploadResult {
  uploadUrl: string;
  key: string;
  token: string;
  expiresInSeconds: number;
}

/**
 * Generate signed upload URL for Supabase Storage.
 * Bucket must be private. Client uploads via PUT to the returned URL.
 */
export async function createPresignedUploadUrl(
  key: string,
  _contentType: string,
  _contentLength?: number
): Promise<PresignedUploadResult> {
  const config = getStorageConfig();
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.storage
    .from(config.bucket)
    .createSignedUploadUrl(key, { upsert: false });

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.signedUrl || !data?.path || !data?.token) {
    throw new Error("Invalid response from Supabase Storage");
  }

  return {
    uploadUrl: data.signedUrl,
    key: data.path,
    token: data.token,
    expiresInSeconds: STORAGE_CONFIG.UPLOAD_EXPIRY_SECONDS,
  };
}

export interface PresignedDownloadResult {
  downloadUrl: string;
  expiresInSeconds: number;
}

/**
 * Generate signed download URL for Supabase Storage.
 * Short expiry. No public exposure.
 */
export async function createPresignedDownloadUrl(
  key: string
): Promise<PresignedDownloadResult> {
  const config = getStorageConfig();
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.storage
    .from(config.bucket)
    .createSignedUrl(key, STORAGE_CONFIG.DOWNLOAD_EXPIRY_SECONDS);

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.signedUrl) {
    throw new Error("Invalid response from Supabase Storage");
  }

  return {
    downloadUrl: data.signedUrl,
    expiresInSeconds: STORAGE_CONFIG.DOWNLOAD_EXPIRY_SECONDS,
  };
}
