"use client";

import SkeletonLoader from "./SkeletonLoader";

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export default function SkeletonTable({
  rows = 5,
  columns = 4,
  className = "",
}: SkeletonTableProps) {
  return (
    <div
      className={`rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden ${className}`}
      role="status"
      aria-label="Loading table"
    >
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-[var(--background)] p-4">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <SkeletonLoader
              key={i}
              height="1rem"
              rounded="md"
              width={i === 0 ? "20%" : i === columns - 1 ? "15%" : "25%"}
            />
          ))}
        </div>
      </div>
      {/* Rows */}
      <div className="divide-y divide-[var(--border)]">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="flex gap-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <SkeletonLoader
                  key={colIndex}
                  height="1rem"
                  rounded="md"
                  width={
                    colIndex === 0
                      ? "20%"
                      : colIndex === columns - 1
                        ? "15%"
                        : "25%"
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
