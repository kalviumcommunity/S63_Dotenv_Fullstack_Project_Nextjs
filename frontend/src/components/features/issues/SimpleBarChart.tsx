"use client";

interface BarItem {
  label: string;
  value: number;
  max?: number;
  color?: string;
}

export default function SimpleBarChart({ data, max }: { data: BarItem[]; max?: number }) {
  const top = max ?? Math.max(...data.map((d) => d.value));

  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="w-24 truncate text-sm text-[var(--foreground)]">{item.label}</span>
          <div className="flex-1 overflow-hidden rounded-full bg-[var(--border)]">
            <div
              className="h-6 rounded-full bg-[var(--primary)] transition-all duration-500"
              style={{
                width: `${Math.min(100, (item.value / top) * 100)}%`,
                backgroundColor: item.color ?? "var(--primary)",
              }}
            />
          </div>
          <span className="w-12 text-right text-sm font-medium text-[var(--muted)]">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
