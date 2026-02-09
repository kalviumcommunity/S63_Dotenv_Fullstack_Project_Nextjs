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

export async function createIssue(data: {
  title: string;
  description?: string;
  category: string;
  latitude?: number;
  longitude?: number;
  isAnonymous?: boolean;
  reportedById?: number;
}) {
  const token = localStorage.getItem("token");
  const res = await fetchWithTimeout(`${API_BASE}/api/issues`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to create issue" }));
    throw new Error(error.message || "Failed to create issue");
  }
  return res.json();
}

export async function updateIssue(
  id: string,
  data: {
    status?: string;
    assignedToId?: number;
    slaDeadline?: string;
    [key: string]: unknown;
  }
) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Authentication required");
  const res = await fetchWithTimeout(`${API_BASE}/api/issues/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to update issue" }));
    throw new Error(error.message || "Failed to update issue");
  }
  return res.json();
}

export async function fetchIssueProgress(id: string) {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/api/issues/${id}/progress`, {
      cache: "no-store",
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error("Failed to fetch progress");
    }
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (e) {
    if (isAbortError(e)) return null;
    return null; // Gracefully fail - progress is optional
  }
}

export async function fetchOfficers() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Authentication required");
  const res = await fetchWithTimeout(`${API_BASE}/api/users/officers`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch officers");
  const data = await res.json();
  return data.success ? data.data : [];
}

export async function fetchUnassignedIssues() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Authentication required");
  const res = await fetchWithTimeout(`${API_BASE}/api/issues/unassigned`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch unassigned issues");
  const data = await res.json();
  return data.success ? data.data : [];
}

export async function getAiAssignmentSuggestion(issueId: number, officers: any[], issue: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Authentication required");
  const res = await fetch(`${API_BASE}/api/ai/assign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ issueId, officers, issue }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to get AI suggestion");
  return data.success ? data.data : null;
}
