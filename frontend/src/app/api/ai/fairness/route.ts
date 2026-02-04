import { NextResponse } from "next/server";

type IssueLite = {
  id: number | string;
  ward?: string | null;
  status?: string | null;
  createdAt?: string | null;
  slaDeadline?: string | null;
};

function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") || "http://localhost:5000";
}

function hoursBetween(a: Date, b: Date): number {
  return Math.max(0, (b.getTime() - a.getTime()) / (1000 * 60 * 60));
}

export const runtime = "nodejs";

export async function GET() {
  try {
    let issues: IssueLite[] = [];
    try {
      const url = new URL(`${apiBase()}/api/issues`);
      url.searchParams.set("limit", "500");
      const res = await fetch(url.toString(), { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as any;
      const list = json?.data?.issues || json?.issues || json?.data || [];
      if (Array.isArray(list)) issues = list as IssueLite[];
    } catch {
      issues = [];
    }

    const now = new Date();
    const byWard = new Map<
      string,
      {
        ward: string;
        total: number;
        open: number;
        resolved: number;
        overdueOpen: number;
        avgOpenAgeHours: number;
      }
    >();

    const wardKey = (w?: string | null) => (w && w.trim() ? w.trim() : "Unknown");

    for (const i of issues) {
      const w = wardKey(i.ward);
      const rec =
        byWard.get(w) || { ward: w, total: 0, open: 0, resolved: 0, overdueOpen: 0, avgOpenAgeHours: 0 };

      const status = (i.status || "").toUpperCase();
      rec.total += 1;
      const isResolved = status === "RESOLVED";
      if (isResolved) rec.resolved += 1;
      else rec.open += 1;

      const createdAt = i.createdAt ? new Date(i.createdAt) : null;
      if (createdAt && !isResolved) {
        rec.avgOpenAgeHours += hoursBetween(createdAt, now);
      }

      if (!isResolved && i.slaDeadline) {
        const d = new Date(i.slaDeadline);
        if (Number.isFinite(d.getTime()) && d.getTime() < now.getTime()) rec.overdueOpen += 1;
      }

      byWard.set(w, rec);
    }

    const wards = Array.from(byWard.values()).map((w) => ({
      ...w,
      avgOpenAgeHours: w.open > 0 ? w.avgOpenAgeHours / w.open : 0,
      overdueRate: w.open > 0 ? w.overdueOpen / w.open : 0,
      resolutionRate: w.total > 0 ? w.resolved / w.total : 0,
    }));

    // Equity heuristics from real operational signals (no "fake AI"):
    // - High overdue rate + high avg open age suggests systemic neglect.
    const neglect = wards
      .map((w) => ({
        ward: w.ward,
        neglectIndex: 0.65 * w.overdueRate + 0.35 * Math.min(1, w.avgOpenAgeHours / 168), // cap at 7 days
        overdueRate: w.overdueRate,
        avgOpenAgeHours: w.avgOpenAgeHours,
        open: w.open,
        total: w.total,
      }))
      .sort((a, b) => b.neglectIndex - a.neglectIndex)
      .slice(0, 12);

    return NextResponse.json({
      success: true,
      data: {
        wards,
        topNeglect: neglect,
        note:
          "Equity monitoring is computed from real issue lifecycle signals (overdue rate and open age). It does not infer protected attributes.",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

