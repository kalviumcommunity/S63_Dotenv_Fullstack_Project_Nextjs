"use client";

interface Slice {
  label: string;
  value: number;
  color: string;
}

export default function SimplePieChart({ data }: { data: Slice[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  let acc = 0;
  const conic = data
    .map((d) => {
      const p = (d.value / total) * 100;
      const start = acc;
      acc += p;
      return `${d.color} ${start}% ${acc}%`;
    })
    .join(", ");

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div
        className="h-40 w-40 shrink-0 rounded-full transition-all duration-500"
        style={{ background: `conic-gradient(${conic})` }}
      />
      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-sm text-[var(--foreground)]">{d.label}</span>
            <span className="text-sm text-[var(--muted)]">
              {((d.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
