"use client";

function getProgress(deadline: string, reportedAt: string, resolved?: string) {
  if (resolved) return 100;
  const start = new Date(reportedAt).getTime();
  const end = new Date(deadline).getTime();
  const now = Date.now();
  if (now >= end) return 100;
  const total = end - start;
  const elapsed = now - start;
  return Math.min(100, (elapsed / total) * 100);
}

export default function SlaRing({
  deadline,
  reportedAt,
  resolvedAt,
  size = 120,
}: {
  deadline: string;
  reportedAt: string;
  resolvedAt?: string;
  size?: number;
}) {
  const progress = getProgress(deadline, reportedAt, resolvedAt);
  const isOverdue = !resolvedAt && new Date(deadline) < new Date();
  const stroke = size * 0.08;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={isOverdue ? "var(--danger)" : resolvedAt ? "var(--success)" : "var(--primary)"}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <span className="absolute text-center text-xs font-semibold text-[var(--foreground)]">
        {resolvedAt ? "Done" : isOverdue ? "Overdue" : `${Math.round(100 - progress)}%`}
      </span>
    </div>
  );
}
