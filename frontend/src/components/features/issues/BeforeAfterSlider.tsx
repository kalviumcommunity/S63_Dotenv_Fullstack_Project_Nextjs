"use client";

import { useState } from "react";

export default function BeforeAfterSlider({
  beforeLabel = "Before",
  afterLabel = "After",
}: {
  beforeLabel?: string;
  afterLabel?: string;
}) {
  const [position, setPosition] = useState(50);

  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
      <div className="relative aspect-video w-full">
        {/* Before - placeholder */}
        <div
          className="absolute inset-0 bg-[var(--border)]"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <div className="flex h-full items-center justify-center bg-slate-200 text-[var(--muted)]">
            <span>{beforeLabel}</span>
          </div>
        </div>
        {/* After - placeholder */}
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 0 0 ${position}%)` }}
        >
          <div className="flex h-full items-center justify-center bg-emerald-100 text-[var(--success)]">
            <span>{afterLabel}</span>
          </div>
        </div>
        {/* Slider handle */}
        <div
          className="absolute top-0 bottom-0 w-1 cursor-ew-resize bg-[var(--foreground)]"
          style={{ left: `${position}%`, transform: "translateX(-50%)" }}
          onMouseDown={(e) => {
            const start = e.clientX;
            const startPos = position;
            const move = (e2: MouseEvent) => {
              const delta = ((e2.clientX - start) / (e.currentTarget.parentElement?.offsetWidth ?? 1)) * 100;
              setPosition(Math.min(100, Math.max(0, startPos + delta)));
            };
            const up = () => {
              document.removeEventListener("mousemove", move);
              document.removeEventListener("mouseup", up);
            };
            document.addEventListener("mousemove", move);
            document.addEventListener("mouseup", up);
          }}
        >
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--foreground)] p-1 text-white text-xs">
            ⟷
          </span>
        </div>
      </div>
      <div className="flex justify-between px-3 py-2 text-xs text-[var(--muted)]">
        <span>{beforeLabel}</span>
        <span>{afterLabel}</span>
      </div>
    </div>
  );
}
