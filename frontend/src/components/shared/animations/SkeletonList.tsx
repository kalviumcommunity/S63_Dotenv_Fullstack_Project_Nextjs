"use client";

import SkeletonLoader from "./SkeletonLoader";

interface SkeletonListProps {
  count?: number;
  showAvatar?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  className?: string;
}

export default function SkeletonList({
  count = 3,
  showAvatar = false,
  showTitle = true,
  showSubtitle = true,
  className = "",
}: SkeletonListProps) {
  return (
    <div className={`space-y-3 ${className}`} role="status" aria-label="Loading list">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3"
        >
          {showAvatar && (
            <SkeletonLoader height="2.5rem" width="2.5rem" rounded="full" />
          )}
          <div className="flex-1 space-y-2">
            {showTitle && (
              <SkeletonLoader height="1rem" rounded="md" width="70%" />
            )}
            {showSubtitle && (
              <SkeletonLoader height="0.875rem" rounded="md" width="50%" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
