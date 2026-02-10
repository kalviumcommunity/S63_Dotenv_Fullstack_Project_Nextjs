import useSWR, { SWRConfiguration } from "swr";

import { apiGet } from "./api/client";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

async function fetcher(url: string) {
  // Use the secure API client which handles token refresh automatically
  const fullUrl = url.startsWith("http") ? url : `${BACKEND_URL}${url}`;
  return apiGet(fullUrl, { skipAuth: url.includes("/api/issues") });
}

export function useSWRFetch<T>(url: string | null, config?: SWRConfiguration<T>) {
  return useSWR<T>(url, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    ...config,
  });
}

export default fetcher;
