import SkeletonTable from "@/components/shared/animations/SkeletonTable";
import SkeletonLoader from "@/components/shared/animations/SkeletonLoader";

export default function AdminLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading admin dashboard">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2 flex-1">
          <SkeletonLoader height="2rem" rounded="lg" width="35%" />
          <SkeletonLoader height="1rem" rounded="md" width="70%" />
        </div>
        <SkeletonLoader height="2.5rem" rounded="lg" width="8rem" />
      </div>

      {/* Table skeleton */}
      <SkeletonTable rows={5} columns={5} />

      {/* Second table skeleton */}
      <SkeletonTable rows={5} columns={6} />
    </div>
  );
}
