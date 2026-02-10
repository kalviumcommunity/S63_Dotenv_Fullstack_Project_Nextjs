import SkeletonLoader from "@/components/shared/animations/SkeletonLoader";
import SkeletonList from "@/components/shared/animations/SkeletonList";

export default function MapLoading() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading map">
      {/* Header */}
      <div className="space-y-2">
        <SkeletonLoader height="2rem" rounded="lg" width="40%" />
        <SkeletonLoader height="1rem" rounded="md" width="85%" />
      </div>

      {/* Search bar skeleton */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <SkeletonLoader height="2.5rem" rounded="md" />
      </div>

      {/* Map and sidebar skeleton */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(260px,360px)]">
        {/* Map skeleton */}
        <div className="h-[70vh] rounded-xl border border-[var(--border)] bg-[var(--card)] flex items-center justify-center">
          <div className="text-center space-y-2">
            <SkeletonLoader height="3rem" width="3rem" rounded="full" className="mx-auto" />
            <SkeletonLoader height="1rem" rounded="md" width="12rem" className="mx-auto" />
          </div>
        </div>

        {/* Sidebar skeleton */}
        <aside className="h-fit space-y-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="space-y-2">
            <SkeletonLoader height="1.25rem" rounded="md" width="60%" />
            <SkeletonLoader height="1rem" rounded="md" width="90%" />
          </div>
          <SkeletonList count={5} showAvatar={false} />
        </aside>
      </div>
    </div>
  );
}
