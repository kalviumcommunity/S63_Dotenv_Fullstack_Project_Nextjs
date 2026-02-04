"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import IndiaMap from "@/components/IndiaMap";
import LocationSearch from "@/components/LocationSearch";
import { CATEGORIES, STATUSES } from "@/lib/mockData";
import { reverseGeocode } from "@/lib/geocode";
import { fetchIssues } from "@/lib/api";
import type { IssueCardIssue } from "@/components/IssueCard";

export default function MapPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const wardFromUrl = searchParams.get("ward");
  const returnToReport = searchParams.get("returnTo") === "report";
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [highlightWard, setHighlightWard] = useState<string | null>(null);
  const [useForReportLoading, setUseForReportLoading] = useState(false);
  const [issues, setIssues] = useState<IssueCardIssue[]>([]);
  const [fairness, setFairness] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (wardFromUrl) setHighlightWard(wardFromUrl);
  }, [wardFromUrl]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [issuesRes, fairnessRes] = await Promise.all([
          fetchIssues({ limit: 500 }) as Promise<
            { data?: { issues?: IssueCardIssue[]; total?: number } } | { issues?: IssueCardIssue[] } | IssueCardIssue[]
          >,
          fetch("/api/ai/fairness").then((r) => r.json()),
        ]);

        // Issues
        let list: IssueCardIssue[] = [];
        if (Array.isArray(issuesRes)) list = issuesRes;
        else if ("data" in issuesRes && Array.isArray(issuesRes.data?.issues))
          list = issuesRes.data!.issues as IssueCardIssue[];
        else if ("issues" in issuesRes && Array.isArray(issuesRes.issues))
          list = issuesRes.issues as IssueCardIssue[];

        // Fairness
        const fairnessData = (fairnessRes as any)?.data || fairnessRes;

        if (!cancelled) {
          setIssues(list);
          setFairness(fairnessData || null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load issues or fairness metrics.");
          setIssues([]);
          setFairness(null);
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

  const mapMarkers = useMemo(() => {
    return issues
      .filter((i) => typeof i.latitude === "number" && typeof i.longitude === "number")
      .map((issue) => ({
        id: issue.id,
        lat: Number(issue.latitude),
        lng: Number(issue.longitude),
        title: issue.title,
        status: issue.status,
      }));
  }, [issues]);

  function handleLocationSelect(lat: number, lng: number) {
    setSelectedLocation({ lat, lng });
    setCenter([lat, lng]);
  }

  function handleSearchSelect(lat: number, lng: number, displayName?: string) {
    setSelectedLocation({ lat, lng });
    setCenter([lat, lng]);
  }

  async function handleUseLocationForReport() {
    if (!selectedLocation) return;
    setUseForReportLoading(true);
    try {
      const address = await reverseGeocode(selectedLocation.lat, selectedLocation.lng);
      const params = new URLSearchParams({
        lat: selectedLocation.lat.toFixed(6),
        lng: selectedLocation.lng.toFixed(6),
        address: address || `${selectedLocation.lat}, ${selectedLocation.lng}`,
      });
      router.push(`/report?${params.toString()}`);
    } catch {
      const params = new URLSearchParams({
        lat: selectedLocation.lat.toFixed(6),
        lng: selectedLocation.lng.toFixed(6),
        address: `${selectedLocation.lat}, ${selectedLocation.lng}`,
      });
      router.push(`/report?${params.toString()}`);
    } finally {
      setUseForReportLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Interactive Map View</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Search for a place (e.g. Jaipur, Malviya Nagar Jaipur), use your live location, or click on the map to select a location for reporting.
        </p>
        {error && (
          <p className="mt-2 rounded-lg border border-[var(--danger)]/40 bg-[var(--danger-bg)]/40 px-3 py-2 text-sm text-[var(--danger)]">
            {error}
          </p>
        )}
        {highlightWard && (
          <p className="mt-2 rounded-lg border border-[var(--primary)] bg-[var(--primary-light)]/30 px-3 py-2 text-sm font-medium text-[var(--primary)]">
            Viewing: {highlightWard} — issues in this ward appear on the map below.
          </p>
        )}
      </div>

      {/* Location search + Use my location */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
        <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
          Search location
        </label>
        <LocationSearch
          onSelect={handleSearchSelect}
          placeholder="e.g. Jaipur, Malviya Nagar Jaipur, Pink City"
        />
      </div>

      {/* Selected location info */}
      {selectedLocation && (
        <div className="rounded-lg border border-[var(--primary)] bg-[var(--primary-light)]/30 p-4 animate-fade-in">
          <p className="text-sm font-semibold text-[var(--primary)]">Location selected</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Latitude: {selectedLocation.lat.toFixed(6)}, Longitude: {selectedLocation.lng.toFixed(6)}
          </p>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Use this location when reporting an issue, or change it by searching again or clicking on the map.
          </p>
          {returnToReport && (
            <div className="mt-3">
              <button
                type="button"
                onClick={handleUseLocationForReport}
                disabled={useForReportLoading}
                className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-[var(--primary-dark)] disabled:opacity-50"
              >
                {useForReportLoading ? "Preparing…" : "Use this location for report"}
              </button>
              <p className="mt-1 text-xs text-[var(--muted)]">
                You’ll be taken to the report form with this location pre-filled.
              </p>
            </div>
          )}
        </div>
      )}
      {returnToReport && !selectedLocation && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <p className="text-sm text-[var(--muted)]">
            Search for a place or click on the map to select a location, then use{" "}
            <strong className="text-[var(--foreground)]">Use this location for report</strong> to fill the report form.
          </p>
        </div>
      )}

      {/* Map + AI insights */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(260px,360px)]">
        <IndiaMap
          onLocationSelect={handleLocationSelect}
          markers={mapMarkers}
          height="70vh"
          center={center}
          selectedLocation={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : null}
        />

        <aside className="h-fit space-y-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-[var(--foreground)]">AI: City equity & clusters</h2>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                Uses real issue SLA/age signals and spatial grouping from the live database.
              </p>
            </div>
          </div>

          {/* Equity heat (top neglected wards) */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[var(--foreground)]">Equity heat</p>
            {fairness?.topNeglect?.length ? (
              <ul className="space-y-2">
                {fairness.topNeglect.slice(0, 5).map((w: any) => (
                  <li key={w.ward} className="space-y-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[var(--foreground)]">{w.ward}</span>
                      <span className="text-[11px] text-[var(--muted)]">
                        Neglect {(w.neglectIndex * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[var(--border)]/60">
                      <div
                        className="h-full bg-[var(--danger)]"
                        style={{ width: `${Math.min(100, w.neglectIndex * 100)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-[var(--muted)]">
                      Overdue: {(w.overdueRate * 100).toFixed(0)}% · Avg open age: {Math.round(w.avgOpenAgeHours)}h · Open:{" "}
                      {w.open}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-2 text-[11px] text-[var(--muted)]">
                When data is available, wards with the highest overdue rate and open-age appear here.
              </p>
            )}
          </div>

          {/* Clusters (issue load by ward) */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[var(--foreground)]">Issue clusters</p>
            {fairness?.wards?.length ? (
              <ul className="space-y-1">
                {fairness.wards
                  .slice()
                  .sort((a: any, b: any) => b.total - a.total)
                  .slice(0, 5)
                  .map((w: any) => (
                    <li key={w.ward} className="flex items-center justify-between text-[11px] text-[var(--muted)]">
                      <span className="font-medium text-[var(--foreground)]">{w.ward}</span>
                      <span>
                        {w.total} issues · open {w.open} · resolved {w.resolved}
                      </span>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-2 text-[11px] text-[var(--muted)]">
                Clusters summarize how many issues sit in each ward/zone so officers can size impact.
              </p>
            )}
          </div>
        </aside>
      </div>

      {/* Status legend */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2">
        <span className="text-xs font-medium text-[var(--muted)]">Status</span>
        {STATUSES.map((s) => (
          <span key={s.id} className={`badge-${s.id.toLowerCase()} rounded-full px-2 py-0.5 text-xs`}>
            {s.label}
          </span>
        ))}
        <span className="text-xs text-[var(--muted)]">·</span>
        <span className="text-xs text-[var(--muted)]">Categories: {CATEGORIES.map((c) => c.label).join(", ")}</span>
      </div>

      {issues.length === 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-center">
          <p className="text-sm text-[var(--muted)]">No issues on the map yet. Report an issue to see it here.</p>
        </div>
      )}
    </div>
  );
}
