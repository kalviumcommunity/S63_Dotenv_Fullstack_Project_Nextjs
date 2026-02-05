import useSWR, { SWRConfiguration } from "swr";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

async function fetcher(url: string) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BACKEND_URL}${url}`, { headers });

  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.");
    (error as any).status = res.status;
    throw error;
  }

  return res.json();
}

export function useSWRFetch<T>(url: string | null, config?: SWRConfiguration<T>) {
  return useSWR<T>(url, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    ...config,
  });
}

export default fetcher;
