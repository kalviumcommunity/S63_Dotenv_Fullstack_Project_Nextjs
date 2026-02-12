"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import StatusBadge from "@/components/features/dashboard/StatusBadge";
import { getCategoryLabel, formatSlaDeadline } from "@/lib/utils";
import { fetchIssueProgress } from "@/lib/api";

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
  progressPercentage?: number;
  assignedTo?: {
    id: number;
    name: string;
    email: string;
    role: string;
  } | null;
};

export default function IssueCard({ issue }: { issue: IssueCardIssue }) {
  const [upvotes, setUpvotes] = useState<number>(Number(issue.upvotes ?? 0));
  const [voted, setVoted] = useState(false);
  const [progressData, setProgressData] = useState<{
    progressPercentage: number;
    assignedTo: IssueCardIssue["assignedTo"];
  } | null>(null);
  const [, setLoadingProgress] = useState(false);

  const computedOverdue =
    typeof issue.isOverdue === "boolean"
      ? issue.isOverdue
      : issue.slaDeadline
        ? new Date(issue.slaDeadline).getTime() < Date.now()
        : false;
  const isOverdue = computedOverdue || issue.status === "REPORTED";
  const when = issue.reportedAt || issue.createdAt;

  // Fetch progress data if not already provided
  useEffect(() => {
    if (issue.progressPercentage !== undefined && issue.assignedTo !== undefined) {
      setProgressData({
        progressPercentage: issue.progressPercentage,
        assignedTo: issue.assignedTo,
      });
      return;
    }

    // Fetch progress data
    let cancelled = false;
    async function loadProgress() {
      try {
        setLoadingProgress(true);
        const data = await fetchIssueProgress(String(issue.id));
        if (!cancelled && data) {
          setProgressData({
            progressPercentage: data.progressPercentage ?? 0,
            assignedTo: (data.assignedTo ?? null) as IssueCardIssue["assignedTo"],
          });
        }
      } catch (err) {
        // Silently fail - progress is optional
        if (!cancelled) {
          setProgressData({
            progressPercentage: 0,
            assignedTo: null,
          });
        }
      } finally {
        if (!cancelled) setLoadingProgress(false);
      }
    }
    loadProgress();
    return () => {
      cancelled = true;
    };
  }, [issue.id, issue.progressPercentage, issue.assignedTo]);

  const progressPercentage = progressData?.progressPercentage ?? issue.progressPercentage ?? 0;
  const assignedTo = progressData?.assignedTo ?? issue.assignedTo ?? null;
  const expectedCompletionDate = issue.slaDeadline;

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
      {/* Progress Bar */}
      {progressPercentage > 0 && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">Progress</span>
            <span className="text-xs font-bold text-cyan-600">{progressPercentage}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-200">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-600"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      {/* Assigned Worker */}
      {assignedTo && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-cyan-100 bg-cyan-50/50 px-2 py-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-bold text-white">
            {assignedTo.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-semibold text-gray-900">{assignedTo.name}</p>
            <p className="text-xs text-gray-600">
              {assignedTo.role === "officer" ? "Officer" : assignedTo.role}
            </p>
          </div>
        </div>
      )}

      {/* Expected Completion Date */}
      {expectedCompletionDate && (
        <div
          className={`mt-3 rounded-lg border px-2 py-1.5 text-xs ${
            isOverdue && progressPercentage < 100
              ? "border-red-200 bg-red-50/50 text-red-700"
              : new Date(expectedCompletionDate).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000
                ? "border-yellow-200 bg-yellow-50/50 text-yellow-700"
                : "border-blue-200 bg-blue-50/50 text-blue-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium">Expected Completion:</span>
            <span className="font-semibold">
              {new Date(expectedCompletionDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      )}

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
