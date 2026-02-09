"use client";

import { useEffect, useMemo, useState } from "react";
import IssueCard, { type IssueCardIssue } from "@/components/features/issues/IssueCard";
import { CATEGORIES, STATUSES } from "@/constants/mockData";
import { fetchIssues, fetchIssueProgress } from "@/lib/api";
import SkeletonLoader from "@/components/shared/animations/SkeletonLoader";

export default function FeedPage() {
  const [category, setCategory] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [issues, setIssues] = useState<IssueCardIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise<null>((resolve) => 
          setTimeout(() => resolve(null), 10000)
        );
        
        const fetchPromise = fetchIssues({ limit: 200 }) as Promise<
          | { data?: { issues?: IssueCardIssue[]; total?: number } }
          | { issues?: IssueCardIssue[] }
          | IssueCardIssue[]
        >;
        
        const res = await Promise.race([fetchPromise, timeoutPromise]);
        
        if (!res || cancelled) {
          if (!cancelled) {
            setLoading(false);
            setIssues([]);
          }
          return;
        }
        
        let list: IssueCardIssue[] = [];
        if (Array.isArray(res)) list = res;
        else if ("data" in res && Array.isArray(res.data?.issues)) list = res.data!.issues as IssueCardIssue[];
        else if ("issues" in res && Array.isArray(res.issues)) list = res.issues as IssueCardIssue[];

        // Fetch progress data for all issues in parallel (batch fetch for efficiency)
        if (!cancelled && list.length > 0) {
          // Fetch progress for all issues in parallel with timeout protection
          const progressPromises = list.map(async (issue) => {
            try {
              // Add timeout to prevent hanging
              const progressData = await Promise.race([
                fetchIssueProgress(String(issue.id)),
                new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
              ]);
              return {
                ...issue,
                progressPercentage: progressData?.progressPercentage ?? 0,
                assignedTo: progressData?.assignedTo ?? null,
              };
            } catch (err) {
              // If progress fetch fails, return issue without progress
              return {
                ...issue,
                progressPercentage: 0,
                assignedTo: null,
              };
            }
          });

          const issuesWithProgress = await Promise.all(progressPromises);
          if (!cancelled) {
            setIssues(issuesWithProgress);
          }
        } else if (!cancelled) {
          setIssues(list);
        }
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

    // Auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(() => {
      if (!cancelled) {
        load();
      }
    }, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const filtered = useMemo(() => {
    let list = [...issues];
    if (category) list = list.filter((i) => i.category === category);
    if (status) list = list.filter((i) => i.status === status);
    if (location)
      list = list.filter((i) =>
        String(i.ward || i.location || "")
          .toLowerCase()
          .includes(location.toLowerCase())
      );
    return list;
  }, [category, status, location, issues]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Public Issue Feed</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Live issues from the city database. Filter by category, status, or location and upvote what matters to you.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-[var(--muted)]">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm"
          >
            <option value="">All</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-[var(--muted)]">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm"
          >
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-[var(--muted)]">Ward</span>
          <input
            type="text"
            placeholder="e.g. Ward 12"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-28 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      {/* Grid – live data */}
      {error && (
        <div className="rounded-xl border border-[var(--danger)]/40 bg-[var(--danger-bg)]/40 p-3 text-sm text-[var(--danger)]">
          {error}
        </div>
      )}
      {loading && !filtered.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-4">
              <SkeletonLoader height="200px" rounded="lg" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((issue) => (
              <IssueCard key={String(issue.id)} issue={issue} />
            ))}
          </div>

          {filtered.length === 0 && !loading && (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center text-[var(--muted)]">
              No issues match your filters.
            </div>
          )}
        </>
      )}
    </div>
  );
}
