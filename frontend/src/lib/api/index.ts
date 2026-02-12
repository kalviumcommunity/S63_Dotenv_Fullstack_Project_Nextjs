import { apiGet, apiPost, apiPatch, apiDelete } from "./client";

export async function fetchIssues(params?: {
  category?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const url = new URL("/api/issues", process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") || "http://localhost:5000");
  if (params?.category) url.searchParams.set("category", params.category);
  if (params?.status) url.searchParams.set("status", params.status);
  if (params?.limit) url.searchParams.set("limit", String(params.limit));
  if (params?.offset) url.searchParams.set("offset", String(params.offset));
  
  return apiGet(url.toString(), { skipAuth: true });
}

export async function fetchIssue(id: string) {
  return apiGet(`/api/issues/${id}`, { skipAuth: true });
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
  return apiPost("/api/issues", data);
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
  return apiPatch(`/api/issues/${id}`, data);
}

export async function deleteIssue(id: string) {
  const result = await apiDelete<{ success: boolean; message?: string }>(`/api/issues/${id}`);
  return result;
}

export async function fetchIssueProgress(id: string) {
  try {
    const result = await apiGet(`/api/issues/${id}/progress`, { skipAuth: true });
    return result?.success ? result.data : null;
  } catch {
    return null; // Gracefully fail - progress is optional
  }
}

export async function fetchOfficers() {
  const result = await apiGet("/api/users/officers");
  return result?.success ? result.data : [];
}

export async function fetchUnassignedIssues() {
  const result = await apiGet("/api/issues/unassigned");
  return result?.success ? result.data : [];
}

export async function getAiAssignmentSuggestion(issueId: number, officers: any[], issue: any) {
  const result = await apiPost("/api/ai/assign", { issueId, officers, issue });
  return result?.success ? result.data : null;
}
