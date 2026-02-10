import SkeletonCard from "@/components/shared/animations/SkeletonCard";
import SkeletonLoader from "@/components/shared/animations/SkeletonLoader";

export default function DashboardLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading dashboard">
      {/* Header */}
      <div className="space-y-2">
        <SkeletonLoader height="2rem" rounded="lg" width="35%" />
        <SkeletonLoader height="1rem" rounded="md" width="80%" />
      </div>

      {/* Issue cards grid */}
      <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} showImage={false} showFooter={true} />
        ))}
      </div>
    </div>
  );
}
