import { STATUSES } from "@/constants/mockData";

export default function StatusLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)]/80 px-4 py-2 backdrop-blur">
      <span className="text-xs font-medium text-[var(--muted)]">Status</span>
      {STATUSES.map((s) => (
        <span
          key={s.id}
          className={`badge-${s.id.toLowerCase()} rounded-full px-2.5 py-0.5 text-xs font-medium`}
        >
          {s.label}
        </span>
      ))}
    </div>
  );
}
