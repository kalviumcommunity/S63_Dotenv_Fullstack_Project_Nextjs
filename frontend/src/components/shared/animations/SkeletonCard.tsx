"use client";

import SkeletonLoader from "./SkeletonLoader";

interface SkeletonCardProps {
  className?: string;
  showImage?: boolean;
  showTitle?: boolean;
  showDescription?: boolean;
  showFooter?: boolean;
}

export default function SkeletonCard({
  className = "",
  showImage = true,
  showTitle = true,
  showDescription = true,
  showFooter = false,
}: SkeletonCardProps) {
  return (
    <div
      className={`rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm ${className}`}
      role="status"
      aria-label="Loading content"
    >
      {showImage && (
        <SkeletonLoader height="200px" rounded="lg" className="mb-4" />
      )}
      {showTitle && (
        <SkeletonLoader height="1.5rem" rounded="md" className="mb-2" width="80%" />
      )}
      {showDescription && (
        <>
          <SkeletonLoader height="1rem" rounded="md" className="mb-2" />
          <SkeletonLoader height="1rem" rounded="md" width="60%" />
        </>
      )}
      {showFooter && (
        <div className="mt-4 flex items-center gap-2">
          <SkeletonLoader height="1.5rem" rounded="full" width="4rem" />
          <SkeletonLoader height="1.5rem" rounded="full" width="5rem" />
        </div>
      )}
    </div>
  );
}
