"use client";

import Link from "next/link";
import { useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { getCategoryLabel, formatSlaDeadline } from "@/lib/utils";

export type IssueCardIssue = {
  id: string | number;
  publicId?: string | null;
  title: string;
  description?: string | null;
  category: string;
  status: string;
  ward?: string | null;
  reportedAt?: string | null;
  createdAt?: string | null;
  resolvedAt?: string | null;
  slaDeadline?: string | null;
  upvotes?: number | null;
  isOverdue?: boolean | null;
};

export default function IssueCard({ issue }: { issue: IssueCardIssue }) {
  const [upvotes, setUpvotes] = useState<number>(Number(issue.upvotes ?? 0));
  const [voted, setVoted] = useState(false);
  const computedOverdue =
    typeof issue.isOverdue === "boolean"
      ? issue.isOverdue
      : issue.slaDeadline
        ? new Date(issue.slaDeadline).getTime() < Date.now()
        : false;
  const isOverdue = computedOverdue || issue.status === "REPORTED";
  const when = issue.reportedAt || issue.createdAt;

  function handleUpvote(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (voted) return;
    setVoted(true);
    setUpvotes((n) => n + 1);
  }

  return (
    <Link
      href={`/issues/${issue.id}`}
      className={`group block rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm transition hover:shadow-md ${
        computedOverdue ? "border-[var(--danger)]/50 animate-countdown-urgent" : ""
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="font-mono text-xs text-[var(--muted)]">{issue.publicId || `#${issue.id}`}</span>
        <StatusBadge status={issue.status} />
      </div>
      <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)]">
        {issue.title}
      </h3>
      {issue.description && (
        <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">{issue.description}</p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
        <span>{getCategoryLabel(issue.category)}</span>
        <span>·</span>
        <span>{issue.ward || "—"}</span>
        <span>·</span>
        <span>{when ? new Date(when).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" }) : "—"}</span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div
          className={`text-xs font-medium ${
            isOverdue && issue.status !== "RESOLVED" ? "text-[var(--danger)]" : "text-[var(--muted)]"
          }`}
          suppressHydrationWarning
        >
          {issue.status === "RESOLVED"
            ? "Resolved"
            : issue.slaDeadline
              ? formatSlaDeadline(issue.slaDeadline).text
              : "SLA pending"}
        </div>
        <button
          type="button"
          onClick={handleUpvote}
          className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition ${
            voted ? "bg-[var(--primary-light)] text-[var(--primary)]" : "hover:bg-[var(--border)]/50"
          }`}
          aria-label="Upvote"
        >
          <span className="text-base">👍</span>
          <span>{upvotes}</span>
        </button>
      </div>
    </Link>
  );
}
