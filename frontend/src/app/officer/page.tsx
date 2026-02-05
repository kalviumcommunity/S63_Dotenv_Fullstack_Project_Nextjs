"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchIssues } from "@/lib/api";
import { getCategoryLabel, formatSlaDeadline } from "@/lib/utils";
import type { IssueCardIssue } from "@/components/IssueCard";
import ProtectedRoute from "@/components/ProtectedRoute";

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
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [aiScores, setAiScores] = useState<Record<string, AiScore>>({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [issues, setIssues] = useState<IssueLite[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [issuesError, setIssuesError] = useState<string | null>(null);

  useEffect(() => {
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
        if (!cancelled) setIssues(list);
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
    return () => {
      cancelled = true;
    };
  }, []);

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
    <ProtectedRoute>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Officer Dashboard</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Manage assigned issues. Update status and upload proof of work.
        </p>
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
                {formatSlaDeadline(priorityIssue.slaDeadline).text}
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
        <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">Assigned Issues</h2>
        {loadingIssues && !issues.length ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center text-sm text-[var(--muted)]">
            Loading issues…
          </div>
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
