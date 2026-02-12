"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSWRConfig } from "swr";
import IssueProgressCard from "@/components/features/issues/IssueProgressCard";
import SkeletonLoader from "@/components/shared/animations/SkeletonLoader";
import { fetchIssues, fetchIssueProgress } from "@/lib/api";
import ProtectedRoute from "@/components/common/layout/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

interface IssueWithProgress {
  id: string | number;
  publicId?: string | null;
  title: string;
  description?: string | null;
  category: string;
  status: string;
  createdAt?: string | null;
  progressPercentage?: number;
  expectedCompletionDate?: string | null;
  assignedTo?: {
    id: number;
    name: string;
    email: string;
    role: string;
  } | null;
  progressUpdates?: Array<{
    id: number;
    percentage: number;
    notes?: string | null;
    updatedBy: {
      id: number;
      name: string;
      email: string;
    };
    createdAt: string;
  }>;
}

export default function DashboardPage() {
  useAuth();
  const [issues, setIssues] = useState<IssueWithProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mutate } = useSWRConfig();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = (await fetchIssues({ limit: 200 })) as
          | { data?: { issues?: IssueWithProgress[]; total?: number } }
          | { issues?: IssueWithProgress[] }
          | IssueWithProgress[];
        let list: IssueWithProgress[] = [];
        if (Array.isArray(res)) list = res;
        else if ("data" in res && Array.isArray(res.data?.issues))
          list = res.data!.issues as IssueWithProgress[];
        else if ("issues" in res && Array.isArray(res.issues)) list = res.issues as IssueWithProgress[];

        // Fetch progress for each issue
        const issuesWithProgress = await Promise.all(
          list.map(async (issue) => {
            try {
              const progressData = await fetchIssueProgress(String(issue.id));
              return {
                ...issue,
                progressPercentage: progressData?.progressPercentage ?? 0,
                expectedCompletionDate: progressData?.expectedCompletionDate ?? null,
                assignedTo: progressData?.assignedTo ?? null,
                progressUpdates: progressData?.progressUpdates ?? [],
              };
            } catch (err) {
              // If progress fetch fails, return issue without progress
              return {
                ...issue,
                progressPercentage: 0,
                expectedCompletionDate: null,
                assignedTo: null,
                progressUpdates: [],
              };
            }
          })
        );

        if (!cancelled) setIssues(issuesWithProgress);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load issues.");
          setIssues([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();

    // Set up real-time refresh every 30 seconds
    const interval = setInterval(() => {
      if (!cancelled) {
        load();
      }
    }, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [mutate]);

  const handleRefresh = async (issueId: string | number) => {
    try {
      const progressData = await fetchIssueProgress(String(issueId));
      setIssues((prev) =>
        prev.map((issue) =>
          issue.id === issueId
            ? {
                ...issue,
                progressPercentage: progressData?.progressPercentage ?? issue.progressPercentage ?? 0,
                expectedCompletionDate: progressData?.expectedCompletionDate ?? issue.expectedCompletionDate ?? null,
                assignedTo: progressData?.assignedTo ?? issue.assignedTo ?? null,
                progressUpdates: progressData?.progressUpdates ?? issue.progressUpdates ?? [],
              }
            : issue
        )
      );
    } catch (err) {
      console.error("Failed to refresh progress:", err);
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">My Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Track your reported issues with real-time progress updates, expected completion dates, and assigned workers.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-[var(--danger)]/40 bg-[var(--danger-bg)]/40 p-3 text-sm text-[var(--danger)]">
            {error}
          </div>
        )}

        {loading && !issues.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white p-6">
                <SkeletonLoader height="200px" rounded="lg" />
              </div>
            ))}
          </div>
        ) : issues.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
            <p className="text-[var(--muted)]">No issues yet.</p>
            <Link
              href="/report"
              className="mt-4 inline-block rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--primary-dark)]"
            >
              Report an Issue
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
            {issues.map((issue) => (
              <IssueProgressCard
                key={String(issue.id)}
                issue={issue}
                progressPercentage={issue.progressPercentage ?? 0}
                expectedCompletionDate={issue.expectedCompletionDate ?? null}
                assignedTo={issue.assignedTo ?? null}
                progressUpdates={issue.progressUpdates ?? []}
                onRefresh={() => handleRefresh(issue.id)}
              />
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
