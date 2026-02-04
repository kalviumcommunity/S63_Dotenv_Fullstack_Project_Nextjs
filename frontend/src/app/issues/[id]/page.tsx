"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { getCategoryLabel, formatSlaDeadline } from "@/lib/utils";
import { fetchIssue } from "@/lib/api";
import type { IssueCardIssue } from "@/components/IssueCard";

type IssueDetail = IssueCardIssue & {
  description?: string | null;
  ward?: string | null;
  slaDeadline?: string | null;
  reportedBy?: { id: number; name: string } | null;
  assignedTo?: { id: number; name: string } | null;
};

export default function IssueDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const issueId = params?.id;
  const [issue, setIssue] = useState<IssueDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!issueId) return;
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchIssue(String(issueId));
        const anyRes = res as any;
        const data = anyRes?.data || anyRes;
        if (!cancelled) {
          if (!data || Object.keys(data).length === 0) {
            setError("Issue not found.");
            setIssue(null);
          } else {
            setIssue(data as IssueDetail);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load issue.");
          setIssue(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [issueId]);

  if (!issueId) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[var(--muted)]">Invalid issue id.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Issue {issue?.publicId || `#${issueId}`}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            View the details, category, location, and SLA status for this reported issue.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-1.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--border)]/50"
        >
          Back
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-[var(--danger)]/40 bg-[var(--danger-bg)]/40 p-3 text-sm text-[var(--danger)]">
          {error}
        </div>
      )}

      {loading && !issue && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center text-[var(--muted)]">
          Loading issue…
        </div>
      )}

      {issue && (
        <section className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-[var(--muted)]">
                  {issue.publicId || `#${issue.id}`}
                </span>
                <StatusBadge status={issue.status} />
              </div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                {issue.title}
              </h2>
              {issue.description && (
                <p className="text-sm text-[var(--muted)] whitespace-pre-line">
                  {issue.description}
                </p>
              )}
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--muted)]">
              <p>
                Category:{" "}
                <span className="font-medium text-[var(--foreground)]">
                  {getCategoryLabel(issue.category)}
                </span>
              </p>
              {issue.ward && (
                <p>
                  Ward:{" "}
                  <span className="font-medium text-[var(--foreground)]">
                    {issue.ward}
                  </span>
                </p>
              )}
              {issue.slaDeadline && (
                <p>
                  SLA:{" "}
                  <span className="font-medium text-[var(--foreground)]">
                    {formatSlaDeadline(issue.slaDeadline).text}
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1 rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-xs text-[var(--muted)]">
              <p className="font-semibold text-[var(--foreground)]">Reporter</p>
              <p>
                {issue.reportedBy?.name
                  ? `${issue.reportedBy.name} (ID ${issue.reportedBy.id})`
                  : issue.isOverdue
                  ? "Citizen (anonymous)"
                  : "Citizen"}
              </p>
              {issue.createdAt && (
                <p>
                  Reported:{" "}
                  {new Date(issue.createdAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              )}
            </div>
            <div className="space-y-1 rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-xs text-[var(--muted)]">
              <p className="font-semibold text-[var(--foreground)]">Assignment</p>
              <p>
                Assigned to:{" "}
                {issue.assignedTo?.name
                  ? `${issue.assignedTo.name} (ID ${issue.assignedTo.id})`
                  : "Not yet assigned"}
              </p>
              {issue.slaDeadline && (
                <p>
                  SLA deadline:{" "}
                  {new Date(issue.slaDeadline).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              )}
            </div>
          </div>

          {issue.latitude != null && issue.longitude != null && (
            <p className="text-xs text-[var(--muted)]">
              Location: {issue.latitude}, {issue.longitude} ·{" "}
              <Link
                href={`/map?lat=${issue.latitude}&lng=${issue.longitude}`}
                className="text-[var(--primary)] underline"
              >
                View on map
              </Link>
            </p>
          )}
        </section>
      )}
    </div>
  );
}

