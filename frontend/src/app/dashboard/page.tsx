"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import IssueCard, { type IssueCardIssue } from "@/components/IssueCard";
import { fetchIssues } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function DashboardPage() {
  const [issues, setIssues] = useState<IssueCardIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = (await fetchIssues({ limit: 200 })) as
          | { data?: { issues?: IssueCardIssue[]; total?: number } }
          | { issues?: IssueCardIssue[] }
          | IssueCardIssue[];
        let list: IssueCardIssue[] = [];
        if (Array.isArray(res)) list = res;
        else if ("data" in res && Array.isArray(res.data?.issues)) list = res.data!.issues as IssueCardIssue[];
        else if ("issues" in res && Array.isArray(res.issues)) list = res.issues as IssueCardIssue[];
        if (!cancelled) setIssues(list);
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
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">My Issues</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Issues reported in the system and their status. When sign-in is enabled this view will show only your submissions.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-[var(--danger)]/40 bg-[var(--danger-bg)]/40 p-3 text-sm text-[var(--danger)]">
            {error}
          </div>
        )}

        {loading && !issues.length ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center">
            <p className="text-[var(--muted)]">Loading issues…</p>
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {issues.map((issue) => (
              <IssueCard key={String(issue.id)} issue={issue} />
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
