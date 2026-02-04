const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") || "http://localhost:5000";

const FETCH_TIMEOUT_MS = 12_000;

function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
}

function isAbortError(e: unknown): boolean {
  if (e instanceof Error) return e.name === "AbortError" || /abort|signal/i.test(e.message);
  return false;
}

export async function fetchIssues(params?: {
  category?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const url = new URL(`${API_BASE}/api/issues`);
  if (params?.category) url.searchParams.set("category", params.category);
  if (params?.status) url.searchParams.set("status", params.status);
  if (params?.limit) url.searchParams.set("limit", String(params.limit));
  if (params?.offset) url.searchParams.set("offset", String(params.offset));
  try {
    const res = await fetchWithTimeout(url.toString(), { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch issues");
    return res.json();
  } catch (e) {
    if (isAbortError(e))
      throw new Error(`Backend not responding. Is the API server running at ${API_BASE}?`);
    throw e;
  }
}

export async function fetchIssue(id: string) {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/api/issues/${id}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch issue");
    return res.json();
  } catch (e) {
    if (isAbortError(e))
      throw new Error(`Backend not responding. Is the API server running at ${API_BASE}?`);
    throw e;
  }
}

export async function createIssue(body: {
  title: string;
  description?: string;
  category: string;
  latitude?: number;
  longitude?: number;
  isAnonymous?: boolean;
  reportedById?: number;
}) {
  const res = await fetch(`${API_BASE}/api/issues`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create issue");
  return data;
}

export async function updateIssue(
  id: string,
  body: {
    status?: string;
    assignedToId?: number | null;
    resolutionNotes?: string;
    proofUrls?: unknown;
  }
) {
  const res = await fetch(`${API_BASE}/api/issues/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update issue");
  return data;
}
