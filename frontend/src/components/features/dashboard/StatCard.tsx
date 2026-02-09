"use client";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  delay?: number;
}

export default function StatCard({ label, value, sub, trend, delay = 0 }: StatCardProps) {
  return (
    <div
      className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm transition hover:shadow-md"
      style={{
        animation: `fade-in 0.4s ease-out ${delay}ms forwards`,
        opacity: delay > 0 ? 0 : 1,
      }}
    >
      <p className="text-sm font-medium text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-[var(--muted)]">{sub}</p>}
      {trend && (
        <span
          className={`mt-2 inline-block text-xs font-medium ${
            trend === "up" ? "text-[var(--success)]" : trend === "down" ? "text-[var(--danger)]" : "text-[var(--muted)]"
          }`}
        >
          {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} vs last month
        </span>
      )}
    </div>
  );
}
