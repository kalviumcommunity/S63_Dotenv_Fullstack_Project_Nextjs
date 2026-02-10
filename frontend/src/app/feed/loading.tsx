import SkeletonCard from "@/components/shared/animations/SkeletonCard";
import SkeletonLoader from "@/components/shared/animations/SkeletonLoader";

export default function FeedLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading issue feed">
      {/* Header */}
      <div className="space-y-2">
        <SkeletonLoader height="2rem" rounded="lg" width="40%" />
        <SkeletonLoader height="1rem" rounded="md" width="70%" />
      </div>

      {/* Filters skeleton */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="flex flex-wrap gap-4">
          <SkeletonLoader height="2rem" rounded="md" width="8rem" />
          <SkeletonLoader height="2rem" rounded="md" width="8rem" />
          <SkeletonLoader height="2rem" rounded="md" width="8rem" />
        </div>
      </div>

      {/* Issue cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} showFooter={true} />
        ))}
      </div>
    </div>
  );
}
