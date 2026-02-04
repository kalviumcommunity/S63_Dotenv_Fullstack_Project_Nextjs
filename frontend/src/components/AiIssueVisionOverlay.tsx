"use client";

import { useMemo } from "react";

export type VisionBox = { xmin: number; ymin: number; xmax: number; ymax: number };
export type VisionDetection = { label: string; score: number; box: VisionBox };

export default function AiIssueVisionOverlay({
  imageUrl,
  imageWidth,
  imageHeight,
  detections,
}: {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  detections: VisionDetection[];
}) {
  const top = detections.slice(0, 12);

  const boxes = useMemo(() => {
    if (!imageWidth || !imageHeight) return [];
    return top.map((d, idx) => {
      const x = (d.box.xmin / imageWidth) * 100;
      const y = (d.box.ymin / imageHeight) * 100;
      const w = ((d.box.xmax - d.box.xmin) / imageWidth) * 100;
      const h = ((d.box.ymax - d.box.ymin) / imageHeight) * 100;
      return { ...d, idx, x, y, w, h };
    });
  }, [top, imageWidth, imageHeight]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-[var(--border)] bg-black/5">
      <img src={imageUrl} alt="Uploaded issue" className="block h-auto w-full select-none" />

      {/* Boxes */}
      <div className="pointer-events-none absolute inset-0">
        {boxes.map((b) => (
          <div
            key={`${b.label}-${b.idx}`}
            className="absolute rounded-md border border-emerald-300/90 bg-emerald-400/10 shadow-[0_0_0_1px_rgba(0,0,0,0.1)]"
            style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }}
          >
            <div className="absolute -top-6 left-0 rounded-md bg-black/70 px-2 py-1 text-[11px] font-medium text-white">
              {b.label} · {(b.score * 100).toFixed(0)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

