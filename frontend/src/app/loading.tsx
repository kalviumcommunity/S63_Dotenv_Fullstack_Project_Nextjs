import SkeletonLoader from "@/components/shared/animations/SkeletonLoader";
import SkeletonCard from "@/components/shared/animations/SkeletonCard";

export default function Loading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading page">
      {/* Header skeleton */}
      <div className="space-y-2">
        <SkeletonLoader height="2rem" rounded="lg" width="40%" />
        <SkeletonLoader height="1rem" rounded="md" width="60%" />
      </div>

      {/* Content skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
