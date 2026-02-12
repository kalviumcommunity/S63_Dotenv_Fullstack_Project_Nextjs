import useSWR, { SWRConfiguration } from "swr";

import { apiGet } from "./api/client";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

async function fetcher<T = unknown>(url: string): Promise<T> {
  const fullUrl = url.startsWith("http") ? url : `${BACKEND_URL}${url}`;
  return apiGet<T>(fullUrl, { skipAuth: url.includes("/api/issues") });
}

export function useSWRFetch<T>(url: string | null, config?: SWRConfiguration<T>) {
  return useSWR<T>(url || undefined, url ? ((u: string) => fetcher<T>(u)) : null, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    ...config,
  });
}

export default fetcher;
