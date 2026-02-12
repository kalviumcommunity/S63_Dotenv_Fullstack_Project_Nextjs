"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { fetchIssues } from "@/lib/api";
import { getCategoryLabel, formatSlaDeadline } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import AnimatedCard from "@/components/shared/animations/AnimatedCard";
import { safeVariants } from "@/lib/animations";
import type { IssueCardIssue } from "@/components/features/issues/IssueCard";
import ProtectedRoute from "@/components/common/layout/ProtectedRoute";

const columns = [
  { id: "ASSIGNED", title: "Assigned", color: "amber" },
  { id: "IN_PROGRESS", title: "In Progress", color: "blue" },
  { id: "RESOLVED", title: "Resolved", color: "emerald" },
];

type IssueLite = IssueCardIssue & {
  slaDeadline?: string | null;
  isOverdue?: boolean | null;
};

type AiScore = {
  urgencyScore: number;
  expectedResolutionHours: number;
  slaBreachProbability: number;
  priorityBand: "low" | "medium" | "high" | "critical";
};

export default function OfficerDashboardPage() {
  const { user } = useAuth();
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [aiScores, setAiScores] = useState<Record<string, AiScore>>({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [issues, setIssues] = useState<IssueLite[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [issuesError, setIssuesError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    async function load() {
      try {
        setLoadingIssues(true);
        setIssuesError(null);
        const res = (await fetchIssues({ limit: 500 })) as
          | { data?: { issues?: IssueLite[]; total?: number } }
          | { issues?: IssueLite[] }
          | IssueLite[];
        let list: IssueLite[] = [];
        if (Array.isArray(res)) list = res;
        else if ("data" in res && Array.isArray(res.data?.issues)) list = res.data!.issues as IssueLite[];
        else if ("issues" in res && Array.isArray(res.issues)) list = res.issues as IssueLite[];
        
        // Filter to show only issues assigned to this officer
        const assignedIssues = list.filter((issue) => {
          // Check if issue has assignedTo field and it matches current user
          if (issue.assignedTo && typeof issue.assignedTo === 'object' && 'id' in issue.assignedTo) {
            return issue.assignedTo.id === user?.id;
          }
          // Fallback: check if status is ASSIGNED or IN_PROGRESS (assuming they're assigned)
          return issue.status === "ASSIGNED" || issue.status === "IN_PROGRESS";
        });
        
        if (!cancelled) setIssues(assignedIssues);
      } catch (e) {
        if (!cancelled) {
          setIssuesError(e instanceof Error ? e.message : "Failed to load issues.");
          setIssues([]);
        }
      } finally {
        if (!cancelled) setLoadingIssues(false);
      }
    }
    load();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (!cancelled) load();
    }, 30000);
    
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user?.id]);

  const byStatus = useMemo(() => {
    return columns.reduce(
      (acc, col) => {
        acc[col.id] = issues.filter((i) => i.status === col.id);
        return acc;
      },
      {} as Record<string, IssueLite[]>
    );
  }, [issues]);

  const prioritizedByStatus = useMemo(() => {
    if (!Object.keys(aiScores).length) return byStatus;
    const clone: Record<string, IssueLite[]> = {};
    for (const col of columns) {
      const list = [...(byStatus[col.id] || [])];
      list.sort((a, b) => {
        const sa = aiScores[String(a.id)]?.slaBreachProbability ?? 0;
        const sb = aiScores[String(b.id)]?.slaBreachProbability ?? 0;
        return sb - sa;
      });
      clone[col.id] = list;
    }
    return clone;
  }, [byStatus, aiScores]);

  /* Priority: first overdue, then in progress, then highest AI risk (if available) */
  const priorityIssue: IssueLite | undefined = useMemo(() => {
    const overdue = issues.find((i) => i.isOverdue && i.status !== "RESOLVED");
    if (overdue) return overdue;
    const inProgress = issues.find((i) => i.status === "IN_PROGRESS");
    if (inProgress) return inProgress;
    const scored = Object.entries(aiScores)
      .map(([id, s]) => ({ id, score: s }))
      .sort((a, b) => b.score.slaBreachProbability - a.score.slaBreachProbability)[0];
    if (!scored) return undefined;
    return issues.find((i) => String(i.id) === scored.id);
  }, [issues, aiScores]);

  async function runAiPrioritization() {
    setAiError("");
    setAiLoading(true);
    try {
      const targets = issues.filter(
        (i) => i.status === "ASSIGNED" || i.status === "IN_PROGRESS"
      );
      const nextScores: Record<string, AiScore> = {};

      for (const issue of targets) {
        try {
          const res = await fetch("/api/ai/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: issue.title,
              description: issue.description,
              category: issue.category,
              locationName: issue.ward,
            }),
          });
          const data = await res.json();
          if (!res.ok || !data?.success) continue;
          nextScores[String(issue.id)] = data.data as AiScore;
        } catch {
          // Skip individual failures; keep others.
          continue;
        }
      }

      setAiScores(nextScores);
      if (!Object.keys(nextScores).length) {
        setAiError("AI could not score any issues. Try again after some issues are loaded.");
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI prioritization failed.");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <ProtectedRoute requireRole="officer">
      <div className="space-y-8">
        <motion.div
          variants={safeVariants.fadeIn}
          initial="initial"
          animate="animate"
        >
          <h1 className="text-3xl font-bold text-[var(--foreground)] bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            My Assignment Dashboard
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Manage your assigned issues. Update progress, status, and upload proof of work.
          </p>
        </motion.div>
        
        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <AnimatedCard className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">My Assignments</p>
                <p className="mt-1 text-3xl font-bold text-blue-900">{issues.length}</p>
              </div>
              <div className="rounded-full bg-blue-200 p-3">
                <svg className="h-8 w-8 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </AnimatedCard>
          
          <AnimatedCard className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">In Progress</p>
                <p className="mt-1 text-3xl font-bold text-amber-900">
                  {issues.filter((i) => i.status === "IN_PROGRESS").length}
                </p>
              </div>
              <div className="rounded-full bg-amber-200 p-3">
                <svg className="h-8 w-8 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </AnimatedCard>
          
          <AnimatedCard className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700">Resolved</p>
                <p className="mt-1 text-3xl font-bold text-emerald-900">
                  {issues.filter((i) => i.status === "RESOLVED").length}
                </p>
              </div>
              <div className="rounded-full bg-emerald-200 p-3">
                <svg className="h-8 w-8 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </AnimatedCard>
        </div>

      {issuesError && (
        <div className="rounded-xl border border-[var(--danger)]/40 bg-[var(--danger-bg)]/40 p-3 text-sm text-[var(--danger)]">
          {issuesError}
        </div>
      )}

      {/* Daily priority (with AI band when available) */}
      {priorityIssue && (
        <section className="rounded-xl border-2 border-[var(--primary)] bg-[var(--primary-light)]/30 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[var(--primary)]">Today&apos;s Priority</h2>
              <Link
                href={`/issues/${priorityIssue.id}`}
                className="mt-2 block font-medium text-[var(--foreground)] hover:text-[var(--primary)]"
              >
                {priorityIssue.publicId} – {priorityIssue.title}
              </Link>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {getCategoryLabel(priorityIssue.category)} ·{" "}
                {priorityIssue.slaDeadline ? formatSlaDeadline(priorityIssue.slaDeadline).text : "—"}
              </p>
            </div>
            {aiScores[String(priorityIssue.id)] && (
              <div className="rounded-lg bg-[var(--card)] px-3 py-2 text-right">
                <p className="text-[11px] font-semibold text-[var(--foreground)]">
                  AI: {aiScores[String(priorityIssue.id)].priorityBand.toUpperCase()}
                </p>
                <p className="text-[11px] text-[var(--muted)]">
                  SLA risk {(aiScores[String(priorityIssue.id)].slaBreachProbability * 100).toFixed(0)}%
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* AI prioritization controls */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              AI: SLA risk–based queue ordering
            </h2>
            <p className="mt-0.5 text-xs text-[var(--muted)]">
              Uses real text + category to estimate urgency and SLA breach probability per issue.
            </p>
          </div>
          <button
            type="button"
            onClick={runAiPrioritization}
            disabled={aiLoading || !issues.length}
            className="rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--primary-dark)] disabled:opacity-50"
          >
            {aiLoading ? "Running…" : "Run AI ordering"}
          </button>
        </div>
        {aiError && <p className="mt-2 text-xs text-[var(--danger)]">{aiError}</p>}
      </section>

      {/* Proof upload UI (mock) */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">Upload Proof</h2>
        <div
          className={`flex min-h-[120px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--background)] p-6 transition ${
            dragOver ? "border-[var(--primary)] bg-[var(--primary-light)]/20" : ""
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver("proof");
          }}
          onDragLeave={() => setDragOver(null)}
        >
          <p className="text-sm font-medium text-[var(--muted)]">Drag & drop before/after images</p>
          <p className="mt-1 text-xs text-[var(--muted)]">or click to browse</p>
        </div>
      </section>

      {/* Kanban */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">My Assigned Issues</h2>
        {loadingIssues && !issues.length ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center text-sm text-[var(--muted)]">
            Loading issues…
          </div>
        ) : issues.length === 0 ? (
          <AnimatedCard className="text-center py-12">
            <div className="mx-auto max-w-md">
              <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">No Assignments Yet</h3>
              <p className="text-sm text-[var(--muted)]">
                You don't have any assigned issues at the moment. Check back later or contact your administrator.
              </p>
            </div>
          </AnimatedCard>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {columns.map((col) => (
              <div
                key={col.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm"
              >
                <h3 className="mb-3 font-semibold text-[var(--foreground)]">{col.title}</h3>
                <div className="space-y-3">
                  {prioritizedByStatus[col.id]?.map((issue) => {
                    const sla = issue.slaDeadline
                      ? formatSlaDeadline(issue.slaDeadline)
                      : { text: "SLA pending", urgent: false };
                    const score = aiScores[String(issue.id)];
                    return (
                      <Link
                        key={issue.id}
                        href={`/issues/${issue.id}`}
                        className={`block rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 transition hover:shadow-md ${
                          sla.urgent && issue.status !== "RESOLVED" ? "border-[var(--danger)]/50" : ""
                        }`}
                      >
                        <span className="font-mono text-xs text-[var(--muted)]">
                          {issue.publicId || `#${issue.id}`}
                        </span>
                        <p className="mt-1 font-medium text-[var(--foreground)] line-clamp-2">
                          {issue.title}
                        </p>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {sla.text}
                          {sla.urgent && issue.status !== "RESOLVED" && (
                            <span className="ml-1 text-[var(--danger)]">⚠ SLA alert</span>
                          )}
                          {score && (
                            <span className="ml-1 text-[var(--muted)]">
                              · AI {score.priorityBand} ·{" "}
                              {(score.slaBreachProbability * 100).toFixed(0)}% risk
                            </span>
                          )}
                        </p>
                      </Link>
                    );
                  })}
                  {(!byStatus[col.id] || byStatus[col.id].length === 0) && !loadingIssues && (
                    <p className="py-4 text-center text-sm text-[var(--muted)]">No issues</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      </div>
    </ProtectedRoute>
  );
}
