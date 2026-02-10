import SkeletonLoader from "@/components/shared/animations/SkeletonLoader";
import SkeletonCard from "@/components/shared/animations/SkeletonCard";

export default function IssueDetailLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading issue details">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2 flex-1">
          <SkeletonLoader height="2rem" rounded="lg" width="40%" />
          <SkeletonLoader height="1rem" rounded="md" width="60%" />
        </div>
        <SkeletonLoader height="2.5rem" rounded="lg" width="5rem" />
      </div>

      {/* Issue details card */}
      <SkeletonCard showImage={false} showFooter={false} className="p-6" />

      {/* Progress section */}
      <div className="space-y-4">
        <SkeletonCard showImage={false} showFooter={false} className="p-6" />
        <SkeletonCard showImage={false} showFooter={false} className="p-6" />
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <SkeletonLoader height="1.5rem" rounded="md" width="30%" className="mb-4" />
          <SkeletonLoader height="200px" rounded="lg" />
        </div>
      </div>
    </div>
  );
}
