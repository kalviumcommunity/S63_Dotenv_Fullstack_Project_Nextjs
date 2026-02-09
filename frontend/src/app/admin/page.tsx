"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/common/layout/ProtectedRoute";

export default function AdminPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/ai/fairness", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || !json?.success) {
          throw new Error(json?.message || "Failed to load fairness metrics.");
        }
        if (!cancelled) setData(json.data || null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load fairness metrics.");
          setData(null);
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
    <ProtectedRoute requireRole="admin">
      <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Equity and oversight metrics computed from live issues (SLA and open-age signals) across wards.
          </p>
        </div>
        <Link
          href="/admin/issues"
          className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl"
        >
          Assign Issues
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-[var(--danger)]/40 bg-[var(--danger-bg)]/40 p-3 text-sm text-[var(--danger)]">
          {error}
        </div>
      )}

      {loading && !data && !error && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center text-[var(--muted)]">
          Loading fairness metrics…
        </div>
      )}

      {data ? (
        <div className="space-y-6">
          {data.note && (
            <p className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 text-xs text-[var(--muted)]">
              {data.note}
            </p>
          )}
          {data.topNeglect && data.topNeglect.length > 0 && (
            <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">Areas needing attention</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left text-[var(--muted)]">
                      <th className="pb-2 pr-4">Ward</th>
                      <th className="pb-2 pr-4">Neglect index</th>
                      <th className="pb-2 pr-4">Overdue rate</th>
                      <th className="pb-2 pr-4">Avg open (hrs)</th>
                      <th className="pb-2">Open / Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topNeglect.map((row) => (
                      <tr key={row.ward} className="border-b border-[var(--border)]/50">
                        <td className="py-2 pr-4 font-medium">{row.ward}</td>
                        <td className="py-2 pr-4">{(row.neglectIndex * 100).toFixed(1)}%</td>
                        <td className="py-2 pr-4">{(row.overdueRate * 100).toFixed(0)}%</td>
                        <td className="py-2 pr-4">{row.avgOpenAgeHours.toFixed(0)}</td>
                        <td className="py-2">{row.open} / {row.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          {data.wards && data.wards.length > 0 && (
            <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">Ward summary</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left text-[var(--muted)]">
                      <th className="pb-2 pr-4">Ward</th>
                      <th className="pb-2 pr-4">Total</th>
                      <th className="pb-2 pr-4">Open</th>
                      <th className="pb-2 pr-4">Resolved</th>
                      <th className="pb-2 pr-4">Resolution rate</th>
                      <th className="pb-2">Overdue rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.wards.map((w) => (
                      <tr key={w.ward} className="border-b border-[var(--border)]/50">
                        <td className="py-2 pr-4 font-medium">{w.ward}</td>
                        <td className="py-2 pr-4">{w.total}</td>
                        <td className="py-2 pr-4">{w.open}</td>
                        <td className="py-2 pr-4">{w.resolved}</td>
                        <td className="py-2 pr-4">{(w.resolutionRate * 100).toFixed(0)}%</td>
                        <td className="py-2">{(w.overdueRate * 100).toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          {(!data.wards || data.wards.length === 0) && (!data.topNeglect || data.topNeglect.length === 0) && (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center text-[var(--muted)]">
              No ward data yet. Report issues and assign wards to see metrics.
            </div>
          )}
        </div>
      ) : !loading && !error ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center text-[var(--muted)]">
          No ward data yet. Report issues and assign wards to see metrics.
        </div>
      ) : null}

      <p className="mt-4 text-sm text-[var(--muted)]">
        <Link href="/" className="text-[var(--primary)] underline">
          Back to City Pulse
        </Link>
      </p>
      </div>
    </ProtectedRoute>
  );
}
