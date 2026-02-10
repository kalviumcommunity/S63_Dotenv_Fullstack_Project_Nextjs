import SkeletonCard from "@/components/shared/animations/SkeletonCard";
import SkeletonLoader from "@/components/shared/animations/SkeletonLoader";

export default function OfficerLoading() {
  return (
    <div className="space-y-8" role="status" aria-label="Loading officer dashboard">
      {/* Header */}
      <div className="space-y-2">
        <SkeletonLoader height="2.5rem" rounded="lg" width="45%" />
        <SkeletonLoader height="1rem" rounded="md" width="75%" />
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6"
          >
            <SkeletonLoader height="1rem" rounded="md" width="60%" className="mb-4" />
            <SkeletonLoader height="2.5rem" rounded="md" width="40%" />
          </div>
        ))}
      </div>

      {/* Priority section */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <SkeletonLoader height="1.5rem" rounded="md" width="30%" className="mb-4" />
        <SkeletonLoader height="1rem" rounded="md" width="80%" />
      </div>

      {/* Kanban columns skeleton */}
      <div className="space-y-4">
        <SkeletonLoader height="1.5rem" rounded="md" width="25%" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
            >
              <SkeletonLoader height="1.25rem" rounded="md" width="40%" className="mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, j) => (
                  <SkeletonCard key={j} showImage={false} showFooter={false} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
