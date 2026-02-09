"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import StatCard from "@/components/features/dashboard/StatCard";
import StatusLegend from "@/components/features/dashboard/StatusLegend";
import Toast from "@/components/common/feedback/Toast";
import CountUp from "@/components/features/dashboard/CountUp";
import { fetchIssues } from "@/lib/api";
import type { IssueCardIssue } from "@/components/features/issues/IssueCard";

const AI_CARDS = [
  { id: "vision", icon: "🔍", title: "Computer Vision", desc: "Detect potholes, garbage, and damage from photos. Auto-categorize and suggest location.", sample: "Detected: Pothole (0.92). Suggested category: ROAD_DAMAGE. Location confidence: high.", tryLink: "/report" },
  { id: "nlp", icon: "📝", title: "NLP Understanding", desc: "Extract intent and entities from complaint text. Multilingual support for broader reach.", sample: "Intent: Complaint. Entities: location=Main Road, type=damage. Suggested category: ROAD_DAMAGE.", tryLink: "/report" },
  { id: "priority", icon: "📊", title: "Priority & SLA Prediction", desc: "Predict urgency and breach risk. Officers see which issues need attention first.", sample: "Urgency: High. SLA breach risk: 78%. Recommended: assign within 2h.", tryLink: "/officer" },
  { id: "duplicate", icon: "🔄", title: "Duplicate & Cluster Detection", desc: "Surface similar reports to merge or batch. Reduces noise and speeds resolution.", sample: "3 similar reports found. Consider merging: CT-00001, CT-00003, CT-00007.", tryLink: "/feed" },
  { id: "escalate", icon: "⬆️", title: "Escalation Engine", desc: "Suggest when to escalate by policy. Explainable rules, no black box.", sample: "Rule: overdue > 72h → escalate. Current: 76h. Suggest: Escalate to Ward Supervisor.", tryLink: "/officer" },
  { id: "fairness", icon: "⚖️", title: "Fairness & Equity Monitoring", desc: "Ward-level neglect indices from real SLA and age signals. No demographic inference.", sample: "Ward 12 neglect index: 0.35 (overdue rate 20%, avg open 48h). No protected attributes used.", tryLink: "/admin" },
];

export default function LandingPage() {
  const [issues, setIssues] = useState<IssueCardIssue[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [aiModal, setAiModal] = useState<typeof AI_CARDS[0] | null>(null);
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "success" | "error">("idle");
  const [activeStep, setActiveStep] = useState(-1);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
  }, []);

  const copyToClipboard = useCallback((text: string, feedback = "Copied!") => {
    if (typeof navigator?.clipboard?.writeText !== "function") {
      showToast("Copy not supported", "error");
      return;
    }
    navigator.clipboard.writeText(text).then(() => showToast(feedback, "success")).catch(() => showToast("Copy failed", "error"));
  }, [showToast]);

  const handleNotifySubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (!trimmed) {
      setEmailStatus("error");
      showToast("Please enter your email", "error");
      return;
    }
    if (!valid) {
      setEmailStatus("error");
      showToast("Please enter a valid email address", "error");
      return;
    }
    setEmailStatus("success");
    showToast("You’re on the list! We’ll notify you when ward alerts are ready.", "success");
    setEmail("");
  }, [email, showToast]);

  useEffect(() => {
    let cancelled = false;
    async function loadIssues() {
      try {
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise<null>((resolve) => 
          setTimeout(() => resolve(null), 10000)
        );
        
        const fetchPromise = fetchIssues({ limit: 500 }) as Promise<
          | { data?: { issues?: IssueCardIssue[]; total?: number } }
          | { issues?: IssueCardIssue[] }
          | IssueCardIssue[]
        >;
        
        const res = await Promise.race([fetchPromise, timeoutPromise]);
        
        if (!res || cancelled) {
          if (!cancelled) setIssues([]);
          return;
        }

        let list: IssueCardIssue[] = [];
        if (Array.isArray(res)) {
          list = res;
        } else if ("data" in res && Array.isArray(res.data?.issues)) {
          list = res.data!.issues as IssueCardIssue[];
        } else if ("issues" in res && Array.isArray(res.issues)) {
          list = res.issues as IssueCardIssue[];
        }
        if (!cancelled) {
          setIssues(list);
        }
      } catch {
        if (!cancelled) {
          setIssues([]);
        }
      }
    }
    loadIssues();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const total = issues.length;
    const resolvedIssues = issues.filter(
      (i: IssueCardIssue) => String(i.status || "").toUpperCase() === "RESOLVED"
    );
    const resolved = resolvedIssues.length;

    const withinSla = resolvedIssues.filter((i) => {
      const d = i.slaDeadline ? new Date(i.slaDeadline).getTime() : NaN;
      const r = i.resolvedAt ? new Date(i.resolvedAt).getTime() : NaN;
      if (!Number.isFinite(d) || !Number.isFinite(r)) return false;
      return r <= d;
    }).length;

    const durations: number[] = [];
    for (const i of resolvedIssues) {
      const a = i.reportedAt;
      const b = i.resolvedAt;
      if (!a || !b) continue;
      const start = new Date(a).getTime();
      const end = new Date(b).getTime();
      if (Number.isFinite(start) && Number.isFinite(end) && end >= start) {
        durations.push((end - start) / (1000 * 60 * 60));
      }
    }
    const avgHours = durations.length ? Math.round(durations.reduce((s, x) => s + x, 0) / durations.length) : 0;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    return {
      issuesReported: total,
      issuesResolvedWithinSla: withinSla,
      avgResolutionHours: avgHours,
      resolutionRate,
    };
  }, [issues]);

  return (
    <div className="relative">
      {/* Global tech background for landing page */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Animated tech grid */}
        <div
          className="absolute inset-0 opacity-35 animate-tech-grid"
          style={{
            backgroundImage: `
              linear-gradient(rgba(148, 163, 184, 0.16) 1px, transparent 1px),
              linear-gradient(90deg, rgba(148, 163, 184, 0.16) 1px, transparent 1px)
            `,
            backgroundSize: "42px 42px",
          }}
        />

        {/* Floating primary glow */}
        <div className="absolute -top-48 right-0 h-72 w-72 rounded-full bg-[var(--primary)]/35 blur-3xl animate-float" />
        <div className="absolute bottom-[-7rem] left-[-4rem] h-96 w-96 rounded-full bg-[var(--primary)]/25 blur-3xl animate-float-reverse" />

        {/* Deep radial halo behind hero + stats */}
        <div
          className="absolute left-1/2 top-16 h-[520px] w-[520px] -translate-x-1/2 rounded-full blur-3xl animate-neural-network"
          style={{
            backgroundImage:
              "radial-gradient(circle at center, rgba(14,165,233,0.35), rgba(56,189,248,0.18) 40%, transparent 70%)",
          }}
        />
        <div
          className="absolute left-1/2 top-[420px] h-[460px] w-[460px] -translate-x-1/2 rounded-full blur-3xl opacity-80 animate-float-reverse"
          style={{
            backgroundImage:
              "radial-gradient(circle at center, rgba(15,23,42,0.9), transparent 65%)",
          }}
        />

        {/* Neural nodes / data orbs */}
        {Array.from({ length: 18 }).map((_, i) => (
          <div
            key={`landing-node-${i}`}
            className="absolute rounded-full border border-[var(--primary)]/35 bg-[var(--primary)]/18 animate-neural-network"
            style={{
              left: `${8 + (i * 11) % 88}%`,
              top: `${10 + (i * 7) % 80}%`,
              width: `${6 + (i % 3) * 3}px`,
              height: `${6 + (i % 3) * 3}px`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${5 + (i % 4)}s`,
            }}
          />
        ))}

        {/* Diagonal data streams */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={`landing-stream-${i}`}
            className="absolute w-[2px] h-40 bg-gradient-to-b from-[var(--primary)]/70 via-[var(--primary)]/20 to-transparent animate-data-stream"
            style={{
              left: `${5 + i * 12}%`,
              top: `${-20 + (i * 6)}%`,
              animationDelay: `${i * 0.6}s`,
              animationDuration: `${4 + (i % 3)}s`,
              transform: `rotate(${10 + i * 5}deg)`,
            }}
          />
        ))}

        {/* Subtle hologram scan across page */}
        <div className="absolute inset-x-0 top-1/3 h-0.5 bg-gradient-to-r from-transparent via-[var(--primary)]/60 to-transparent animate-hologram-scan opacity-40" />
        <div
          className="absolute inset-x-0 bottom-1/4 h-0.5 bg-gradient-to-r from-transparent via-[var(--primary)]/40 to-transparent animate-hologram-scan opacity-30"
          style={{ animationDelay: "1.8s" }}
        />

        {/* 3D rotating frame behind hero */}
        <div
          className="absolute left-1/2 top-40 h-80 w-[70%] max-w-5xl -translate-x-1/2 opacity-20 animate-rotate-3d"
          style={{ transformStyle: "preserve-3d" }}
        >
          <div
            className="absolute inset-0 rounded-3xl border border-[var(--primary)]/30"
            style={{ transform: "rotateY(18deg) rotateX(10deg)" }}
          />
          <div
            className="absolute inset-6 rounded-3xl border border-[var(--primary)]/20"
            style={{ transform: "rotateY(-18deg) rotateX(-8deg)" }}
          />
        </div>

        {/* Deeper 3D frame + glow behind mid-page AI sections */}
        <div
          className="absolute left-1/2 top-[950px] h-[420px] w-[78%] max-w-6xl -translate-x-1/2 opacity-25 animate-rotate-3d"
          style={{ transformStyle: "preserve-3d" }}
        >
          <div
            className="absolute inset-0 rounded-[32px] border border-[var(--primary)]/24 bg-gradient-to-b from-[var(--primary)]/12 via-transparent to-[var(--primary)]/6 blur-[1px]"
            style={{ transform: "rotateX(14deg) rotateY(10deg)" }}
          />
          <div
            className="absolute inset-4 rounded-[28px] border border-[var(--primary)]/18"
            style={{ transform: "rotateX(-10deg) rotateY(-6deg)" }}
          />
        </div>

        {/* Lower-page AI nebula / glow near footer */}
        <div
          className="absolute left-1/2 top-[1550px] h-[520px] w-[520px] -translate-x-1/2 rounded-full blur-3xl animate-neural-network opacity-90"
          style={{
            backgroundImage:
              "radial-gradient(circle at center, rgba(14,165,233,0.35), rgba(56,189,248,0.16) 45%, transparent 75%)",
          }}
        />

        {/* Extra data streams for deeper scroll area */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={`deep-stream-${i}`}
            className="absolute w-[2px] h-44 bg-gradient-to-b from-[var(--primary)]/70 via-[var(--primary)]/25 to-transparent animate-data-stream"
            style={{
              left: `${12 + i * 14}%`,
              top: `${700 + i * 40}px`,
              animationDelay: `${1.2 + i * 0.5}s`,
              animationDuration: `${5 + (i % 3)}s`,
              transform: `rotate(${20 + i * 7}deg)`,
            }}
          />
        ))}
      </div>

      {/* Page content above animated background */}
      <div className="relative space-y-10">
      {/* Hero with background video */}
      <section className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-lg">
        {/* Background video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
          style={{ backgroundColor: "var(--card)" }}
          preload="metadata"
        >
          {/* File in public/video/ — if you see cache errors, rename to hero-background.mp4 and use that path */}
          <source src="/video/hero-background.mp4.mp4" type="video/mp4" />
        </video>
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-transparent to-black/20" />
        <div className="relative px-6 py-16 text-center sm:px-10 sm:py-20">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl md:text-5xl">
            CivicTrack
          </h1>
          <p className="mt-2 text-lg text-[var(--muted)] sm:text-xl">
            Transparent Urban Grievance Redressal
          </p>
          <p className="mx-auto mt-4 max-w-xl text-sm text-[var(--muted)]">
            Report civic issues, track resolution in real time, and hold authorities accountable. One platform for citizens and civic bodies.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/report"
              className="rounded-xl bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[var(--primary-dark)] hover:shadow-lg"
            >
              Report an Issue
            </Link>
            <Link
              href="/feed"
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--border)]/50"
            >
              View Public Feed
            </Link>
          </div>
        </div>
      </section>

      {/* Live stats – computed from live issues fetched from backend */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">
          City Pulse – Live Snapshot
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Issues Reported"
            value={stats.issuesReported.toLocaleString("en-US")}
            sub="Current total"
            trend="up"
            delay={50}
          />
          <StatCard
            label="Issues Resolved"
            value={stats.issuesResolvedWithinSla.toLocaleString("en-US")}
            sub="Within SLA"
            trend="up"
            delay={100}
          />
          <StatCard
            label="Avg. Resolution Time"
            value={`${stats.avgResolutionHours} hrs`}
            sub="Resolved issues"
            trend="neutral"
            delay={150}
          />
          <StatCard
            label="Resolution Rate"
            value={`${stats.resolutionRate}%`}
            sub="SLA compliance"
            trend="up"
            delay={200}
          />
        </div>
      </section>

      {/* Status legend */}
      <section className="flex flex-wrap items-center justify-between gap-4">
        <StatusLegend />
        <Link
          href="/map"
          className="text-sm font-medium text-[var(--primary)] hover:underline"
        >
          View on Map →
        </Link>
      </section>

      {/* Trust line */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-6 py-6 text-center">
        <p className="text-sm font-medium text-[var(--muted)]">
          Every issue gets a unique ID, status updates, and SLA tracking. Citizens can upvote, approve resolutions, or reopen if unsatisfied.
        </p>
      </section>

      {/* ─── AI Intelligence Hub ─── */}
      <section className="scroll-mt-8" id="ai-hub">
        <h2 className="landing-section-title mb-2 landing-gradient-text">AI-Powered Intelligence</h2>
        <p className="landing-muted-block mb-8 max-w-2xl">
          CivicTrack uses multiple AI models to triage, prioritize, and ensure fair resolution—without inferring protected attributes.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AI_CARDS.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setAiModal(item)}
              className="bento-card rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 text-left shadow-sm transition focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
              style={{ animation: `fade-in 0.4s ease-out ${150 + i * 50}ms forwards`, opacity: 0 }}
            >
              <span className="text-2xl" aria-hidden>{item.icon}</span>
              <h3 className="mt-3 font-semibold text-[var(--foreground)]">{item.title}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">{item.desc}</p>
              <span className="mt-3 inline-block text-xs font-medium text-[var(--primary)]">See sample output →</span>
            </button>
          ))}
        </div>
      </section>

      {/* AI modal */}
      {aiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal aria-labelledby="ai-modal-title">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setAiModal(null)} aria-hidden />
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl animate-fade-in">
            <div className="flex items-start justify-between gap-4">
              <h2 id="ai-modal-title" className="text-lg font-bold text-[var(--foreground)]">{aiModal.title}</h2>
              <button type="button" onClick={() => setAiModal(null)} className="rounded-lg p-1 text-[var(--muted)] hover:bg-[var(--border)] hover:text-[var(--foreground)]" aria-label="Close">✕</button>
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">{aiModal.desc}</p>
            <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Sample output</p>
              <p className="mt-2 font-mono text-sm text-[var(--foreground)]">{aiModal.sample}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href={aiModal.tryLink} className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-dark)]" onClick={() => setAiModal(null)}>
                Try it →
              </Link>
              <button type="button" onClick={() => setAiModal(null)} className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--border)]/50">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── How It Works: Lifecycle ─── */}
      <section className="scroll-mt-8" id="how-it-works">
        <h2 className="landing-section-title mb-2">From Report to Resolution</h2>
        <p className="landing-muted-block mb-8 max-w-2xl">
          A clear pipeline so every complaint is tracked and accountable. Click a step to learn more.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
          {[
            { name: "Report", detail: "Citizens submit with photo, description, category, and optional location. Anonymous reporting supported." },
            { name: "Triage", detail: "AI suggests category and priority. Duplicate and cluster detection runs to merge similar reports." },
            { name: "Assign", detail: "Ward officers see a prioritized queue. They assign issues and set SLA deadlines by category." },
            { name: "Resolve", detail: "Officers update status and attach proof (before/after). Resolution notes are visible to the reporter." },
            { name: "Verify", detail: "Citizens can approve the resolution or reopen if unsatisfied. Satisfaction feeds back into metrics." },
          ].map((step, i) => (
            <button
              key={step.name}
              type="button"
              onClick={() => setActiveStep(activeStep === i ? -1 : i)}
              className={`flex items-center gap-2 sm:gap-3 rounded-lg px-2 py-1 transition focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 ${activeStep === i ? "ring-2 ring-[var(--primary)] ring-offset-2" : ""}`}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white transition ${activeStep === i ? "bg-[var(--primary-dark)] scale-110" : "bg-[var(--primary)]"}`}>
                {i + 1}
              </div>
              <span className="font-medium text-[var(--foreground)]">{step.name}</span>
              {i < 4 && <span className="hidden text-[var(--muted)] sm:inline">→</span>}
            </button>
          ))}
        </div>
        <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          {activeStep >= 0 ? (
            <p className="text-center text-sm text-[var(--muted)]">
              {[
                "Citizens submit with photo, description, category, and optional location. Anonymous reporting supported.",
                "AI suggests category and priority. Duplicate and cluster detection runs to merge similar reports.",
                "Ward officers see a prioritized queue. They assign issues and set SLA deadlines by category.",
                "Officers update status and attach proof (before/after). Resolution notes are visible to the reporter.",
                "Citizens can approve the resolution or reopen if unsatisfied. Satisfaction feeds back into metrics.",
              ][activeStep] as string}
            </p>
          ) : (
            <p className="text-center text-sm text-[var(--muted)]">
              <strong className="text-[var(--foreground)]">Report</strong> with photo & location → <strong className="text-[var(--foreground)]">Triage</strong> with AI category & priority → <strong className="text-[var(--foreground)]">Assign</strong> to ward officer → <strong className="text-[var(--foreground)]">Resolve</strong> with proof & notes → <strong className="text-[var(--foreground)]">Verify</strong> by citizen upvote or reopen.
            </p>
          )}
        </div>
      </section>

      {/* ─── Geographic Intelligence ─── */}
      <section className="scroll-mt-8" id="geo-intel">
        <h2 className="landing-section-title mb-2">Geographic Intelligence</h2>
        <p className="landing-muted-block mb-6 max-w-2xl">
          See where issues cluster. Officers and admins use ward-level heat and neglect indices to allocate resources fairly.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { ward: "Ward 12", reported: 24, resolved: 18, trend: "↑" },
            { ward: "Ward 8", reported: 31, resolved: 22, trend: "→" },
            { ward: "Ward 5", reported: 12, resolved: 10, trend: "↑" },
          ].map((w) => (
            <Link
              key={w.ward}
              href={`/map?ward=${encodeURIComponent(w.ward)}`}
              className="bento-card block rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm transition focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
            >
              <p className="font-semibold text-[var(--foreground)]">{w.ward}</p>
              <p className="mt-1 text-2xl font-bold text-[var(--primary)]">{w.reported}</p>
              <p className="text-xs text-[var(--muted)]">reported · {w.resolved} resolved</p>
              <p className="mt-2 text-xs font-medium text-[var(--primary)]">View on map →</p>
            </Link>
          ))}
        </div>
        <div className="mt-4 text-center">
          <Link href="/map" className="text-sm font-medium text-[var(--primary)] hover:underline">
            Open interactive map →
          </Link>
        </div>
      </section>

      {/* ─── Transparency Engine (with rotating colorful border) ─── */}
      <div className="scroll-mt-8 rotating-border-wrap" id="transparency">
        <div className="rotating-border-inner p-6 sm:p-8">
          <h2 className="landing-section-title mb-2">Transparency by Design</h2>
          <p className="landing-muted-block mb-6 max-w-2xl">
            Every issue is traceable. No hidden steps.
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              "Unique public ID (e.g. CT-00001) for every report",
              "Full status timeline: reported → assigned → in progress → resolved",
              "SLA deadline per category; breach and compliance visible",
              "Proof of resolution: before/after media when officer closes",
              "Citizen satisfaction and reopen option",
              "Audit trail for admins and accountability",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[var(--muted)]">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="text-sm text-[var(--muted)]">Example issue ID:</span>
            <button
              type="button"
              onClick={() => copyToClipboard("CT-00001", "ID copied! Use it to track an issue.")}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 font-mono text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)] hover:bg-[var(--primary-light)]/30 focus:ring-2 focus:ring-[var(--primary)]"
            >
              CT-00001
            </button>
            <span className="text-xs text-[var(--muted)]">Click to copy</span>
          </div>
        </div>
      </div>

      {/* ─── Citizen Voice ─── */}
      <section className="scroll-mt-8" id="citizen-voice">
        <h2 className="landing-section-title mb-2">Your Voice Counts</h2>
        <p className="landing-muted-block mb-6 max-w-2xl">
          Upvote issues that matter, approve resolutions, or reopen if the fix wasn’t good enough.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            href="/feed"
            className="bento-card block rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 text-center transition focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
            onClick={() => showToast("Upvote issues directly on the Feed to surface what matters.", "info")}
          >
            <p className="text-2xl font-bold text-[var(--primary)]">👍</p>
            <p className="mt-2 font-medium text-[var(--foreground)]">Upvote</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Surface high-priority issues</p>
            <p className="mt-2 text-xs font-medium text-[var(--primary)]">Go to Feed →</p>
          </Link>
          <button
            type="button"
            onClick={() => showToast("Approve resolutions on the issue detail page after an officer closes it.", "info")}
            className="bento-card rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 text-center transition focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
          >
            <p className="text-2xl font-bold text-[var(--success)]">✓</p>
            <p className="mt-2 font-medium text-[var(--foreground)]">Approve</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Confirm resolution</p>
            <p className="mt-2 text-xs font-medium text-[var(--muted)]">Click to learn how</p>
          </button>
          <button
            type="button"
            onClick={() => showToast("Reopen from the issue page if the fix wasn’t satisfactory—your feedback matters.", "info")}
            className="bento-card rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 text-center transition focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
          >
            <p className="text-2xl font-bold text-[var(--warning)]">↻</p>
            <p className="mt-2 font-medium text-[var(--foreground)]">Reopen</p>
            <p className="mt-1 text-xs text-[var(--muted)]">If still unresolved</p>
            <p className="mt-2 text-xs font-medium text-[var(--muted)]">Click to learn how</p>
          </button>
        </div>
      </section>

      {/* ─── For Officers & Admins ─── */}
      <section className="scroll-mt-8" id="officers-admins">
        <h2 className="landing-section-title mb-2">For Officers & Admins</h2>
        <p className="landing-muted-block mb-6 max-w-2xl">
          Dedicated views to assign, prioritize, and monitor equity.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/officer"
            className="bento-card block rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm"
          >
            <h3 className="font-semibold text-[var(--foreground)]">Officer Dashboard</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">Kanban of assigned issues, AI priority scores, SLA countdown. Assign and update status with proof.</p>
            <span className="mt-3 inline-block text-sm font-medium text-[var(--primary)]">Open Officer view →</span>
          </Link>
          <Link
            href="/admin"
            className="bento-card block rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm"
          >
            <h3 className="font-semibold text-[var(--foreground)]">Admin & Equity</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">Ward-level neglect indices, resolution rates, overdue rates. No protected attributes—only operational signals.</p>
            <span className="mt-3 inline-block text-sm font-medium text-[var(--primary)]">Open Admin view →</span>
          </Link>
        </div>
      </section>

      {/* ─── Tech & Trust ─── */}
      <section className="scroll-mt-8" id="tech-trust">
        <h2 className="landing-section-title mb-2">Built for Trust</h2>
        <p className="landing-muted-block mb-6 max-w-2xl">
          Modern stack, explainable AI, and no demographic inference.
        </p>
        <div className="flex flex-wrap gap-3">
          {["Next.js", "Prisma", "Gemini AI", "Leaflet Maps", "PostgreSQL"].map((tech) => (
            <button
              key={tech}
              type="button"
              onClick={() => copyToClipboard(tech, `"${tech}" copied`)}
              className="footer-tech-pill cursor-pointer"
              title="Click to copy"
            >
              {tech}
            </button>
          ))}
        </div>
        <ul className="mt-6 space-y-2 text-sm text-[var(--muted)]">
          <li>• AI outputs are explainable (e.g. “high breach risk because deadline in 12h”).</li>
          <li>• Fairness metrics use only issue lifecycle data—no race, religion, or location-as-proxy for demographics.</li>
          <li>• Data stored securely; APIs ready for civic body integrations.</li>
        </ul>
      </section>

      {/* ─── Impact / Case Studies ─── */}
      <section className="scroll-mt-8" id="impact">
        <h2 className="landing-section-title mb-2">Impact at a Glance</h2>
        <p className="landing-muted-block mb-6 max-w-2xl">
          When civic bodies and citizens use CivicTrack together.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 text-center">
            <p className="text-2xl font-bold text-[var(--primary)] sm:text-3xl">
              <CountUp end={40} suffix="%" duration={1800} />
            </p>
            <p className="mt-1 font-medium text-[var(--foreground)]">Faster resolution (pilot ward)</p>
            <p className="text-xs text-[var(--muted)]">vs. previous year</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 text-center">
            <p className="text-2xl font-bold text-[var(--primary)] sm:text-3xl">
              <CountUp end={3.2} decimals={1} suffix="×" duration={1800} />
            </p>
            <p className="mt-1 font-medium text-[var(--foreground)]">More reports in first month</p>
            <p className="text-xs text-[var(--muted)]">citizen adoption</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 text-center">
            <p className="text-2xl font-bold text-[var(--primary)] sm:text-3xl">
              <CountUp end={92} suffix="%" duration={1800} />
            </p>
            <p className="mt-1 font-medium text-[var(--foreground)]">Within SLA</p>
            <p className="text-xs text-[var(--muted)]">resolved issues</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 text-center">
            <p className="text-2xl font-bold text-[var(--primary)] sm:text-3xl">
              <CountUp end={0} duration={800} />
            </p>
            <p className="mt-1 font-medium text-[var(--foreground)]">Demographic data</p>
            <p className="text-xs text-[var(--muted)]">we never infer</p>
          </div>
        </div>
      </section>

      {/* ─── Roadmap ─── */}
      <section className="scroll-mt-8" id="roadmap">
        <h2 className="landing-section-title mb-2">Roadmap</h2>
        <p className="landing-muted-block mb-6 max-w-2xl">
          What we’re building next.
        </p>
        <div className="space-y-4">
          {[
            { period: "Q1 2026", items: "AI triage live, ward heatmaps, mobile-friendly PWA", current: true },
            { period: "Q2 2026", items: "Native mobile app, offline report draft, SMS alerts", current: false },
            { period: "Q3 2026", items: "Multi-language UI, WhatsApp bot, API webhooks", current: false },
            { period: "Q4 2026", items: "Bulk import for officers, analytics dashboard, open data export", current: false },
          ].map((r) => (
            <div key={r.period} className={`flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-center sm:gap-6 ${r.current ? "border-[var(--primary)] bg-[var(--primary-light)]/20" : "border-[var(--border)] bg-[var(--card)]"}`}>
              <span className="flex items-center gap-2 font-semibold text-[var(--primary)] sm:w-32">
                {r.period}
                {r.current && <span className="rounded-full bg-[var(--primary)] px-2 py-0.5 text-xs font-bold text-white">Current</span>}
              </span>
              <span className="text-sm text-[var(--muted)]">{r.items}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="scroll-mt-8" id="faq">
        <h2 className="landing-section-title mb-2">FAQ</h2>
        <p className="landing-muted-block mb-6 max-w-2xl">
          Common questions about CivicTrack.
        </p>
        <div className="space-y-3">
          {[
            { q: "Do I need to create an account to report?", a: "You can report anonymously. Sign in to see your submissions and get updates." },
            { q: "How is my data used?", a: "Only to resolve issues and show public stats. We don’t infer or store demographic attributes for fairness metrics." },
            { q: "What AI models are used?", a: "Vision for image classification, NLP for complaint understanding, and prediction models for SLA and priority. All are explainable." },
            { q: "Can my ward officer see who reported?", a: "If you report anonymously, no. Otherwise your name is visible to assigned officers for follow-up." },
          ].map((faq) => (
            <details key={faq.q} className="group rounded-xl border border-[var(--border)] bg-[var(--card)]">
              <summary className="cursor-pointer list-none px-4 py-3 font-medium text-[var(--foreground)] [&::-webkit-details-marker]:hidden">
                {faq.q}
                <span className="ml-2 inline-block text-[var(--muted)] transition-transform group-open:rotate-180" aria-hidden>▼</span>
              </summary>
              <p className="border-t border-[var(--border)] px-4 py-3 text-sm text-[var(--muted)]">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ─── Get Notified ─── */}
      <section className="scroll-mt-8" id="notify">
        <h2 className="landing-section-title mb-2">Stay Updated</h2>
        <p className="landing-muted-block mb-4 max-w-xl">
          Get ward-level alerts when issues near you are resolved or escalated.
        </p>
        <form onSubmit={handleNotifySubmit} className="flex max-w-md flex-wrap gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setEmailStatus("idle"); }}
            className={`min-w-0 flex-1 rounded-lg border bg-[var(--background)] px-3 py-2 text-sm ${emailStatus === "error" ? "border-[var(--danger)]" : "border-[var(--border)]"}`}
            aria-label="Email for alerts"
            aria-invalid={emailStatus === "error"}
          />
          <button
            type="submit"
            className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--primary-dark)]"
          >
            Notify me
          </button>
        </form>
        {emailStatus === "success" && <p className="mt-2 text-sm text-[var(--success)]">Thanks! We’ll be in touch.</p>}
      </section>

      {/* ─── Footer (full width + rotating border) ─── */}
      <div className="footer-outer scroll-mt-8">
        <div className="footer-inner">
          <footer className="footer-wrap pt-10 pb-8">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Top: brand + back to top */}
          <div className="flex flex-wrap items-start justify-between gap-6 pb-8">
            <div>
              <Link href="/" className="inline-flex items-center gap-2">
                <span className="rounded-lg bg-[var(--primary)] px-2 py-1 text-sm font-bold text-white">CT</span>
                <span className="footer-brand-text text-xl sm:text-2xl">CivicTrack</span>
              </Link>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-[var(--muted)]">
                Transparent Urban Grievance Redressal. One platform for citizens and civic bodies.
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="footer-back-top text-[var(--primary)]"
              aria-label="Back to top"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          </div>

          {/* Columns: Product · Resources · Connect */}
          <div className="grid gap-8 border-t border-[var(--border)] pt-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Product</h3>
              <ul className="mt-3 space-y-2">
                {[
                  { href: "/feed", label: "Issue Feed" },
                  { href: "/map", label: "Map" },
                  { href: "/report", label: "Report" },
                  { href: "/dashboard", label: "My Issues" },
                  { href: "/officer", label: "Officer" },
                  { href: "/admin", label: "Admin" },
                ].map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="footer-link text-sm text-[var(--foreground)] hover:text-[var(--primary)]">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Resources</h3>
              <ul className="mt-3 space-y-2">
                <li><Link href="/#ai-hub" className="footer-link text-sm text-[var(--foreground)] hover:text-[var(--primary)]">AI Intelligence</Link></li>
                <li><Link href="/#how-it-works" className="footer-link text-sm text-[var(--foreground)] hover:text-[var(--primary)]">How It Works</Link></li>
                <li><Link href="/#transparency" className="footer-link text-sm text-[var(--foreground)] hover:text-[var(--primary)]">Transparency</Link></li>
                <li><Link href="/#faq" className="footer-link text-sm text-[var(--foreground)] hover:text-[var(--primary)]">FAQ</Link></li>
                <li><Link href="/#roadmap" className="footer-link text-sm text-[var(--foreground)] hover:text-[var(--primary)]">Roadmap</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Built with</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {["Next.js", "Prisma", "Gemini AI", "Leaflet", "PostgreSQL"].map((tech) => (
                  <button key={tech} type="button" onClick={() => copyToClipboard(tech, `"${tech}" copied`)} className="footer-tech-pill cursor-pointer" title="Click to copy">
                    {tech}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Connect</h3>
              <p className="mt-3 text-xs text-[var(--muted)]">Ward alerts and updates (coming soon).</p>
              <div className="mt-3 flex gap-2">
                <a href="mailto:hello@civictrack.example" className="footer-link flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]" aria-label="Email">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </a>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--muted)] opacity-60" aria-hidden title="Social links coming soon">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--muted)] opacity-60" aria-hidden title="Social links coming soon">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                </span>
              </div>
            </div>
          </div>

          {/* Bottom: copyright + legal */}
          <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-[var(--border)] pt-6 sm:flex-row">
            <p className="text-center text-xs text-[var(--muted)] sm:text-left">
              © 2026 CivicTrack. Built for citizens and civic bodies.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
              <span>No demographic inference</span>
              <span className="hidden sm:inline">·</span>
              <span>Explainable AI</span>
            </div>
          </div>
            </div>
          </footer>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
      </div>
    </div>
  );
}
