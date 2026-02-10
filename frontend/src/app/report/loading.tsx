import SkeletonLoader from "@/components/shared/animations/SkeletonLoader";

export default function ReportLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6" role="status" aria-label="Loading report form">
      {/* Header */}
      <div className="space-y-2">
        <SkeletonLoader height="2rem" rounded="lg" width="35%" />
        <SkeletonLoader height="1rem" rounded="md" width="70%" />
      </div>

      {/* Form skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        {/* Main form */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
          <SkeletonLoader height="1.5rem" rounded="md" width="20%" />
          <SkeletonLoader height="2.5rem" rounded="md" />
          
          <SkeletonLoader height="1.5rem" rounded="md" width="25%" />
          <SkeletonLoader height="6rem" rounded="md" />
          
          <SkeletonLoader height="1.5rem" rounded="md" width="20%" />
          <SkeletonLoader height="2.5rem" rounded="md" />
          
          <SkeletonLoader height="1.5rem" rounded="md" width="15%" />
          <SkeletonLoader height="8rem" rounded="md" />
          
          <SkeletonLoader height="1.5rem" rounded="md" width="20%" />
          <div className="flex gap-2">
            <SkeletonLoader height="2.5rem" rounded="md" width="12rem" />
            <SkeletonLoader height="2.5rem" rounded="md" width="12rem" />
          </div>
          
          <div className="flex gap-3 mt-6">
            <SkeletonLoader height="2.5rem" rounded="lg" width="10rem" />
            <SkeletonLoader height="2.5rem" rounded="lg" width="8rem" />
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:sticky lg:top-6 h-fit">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
            <SkeletonLoader height="1.5rem" rounded="md" width="40%" className="mx-auto" />
            <SkeletonLoader height="1rem" rounded="md" width="90%" className="mx-auto" />
            
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 space-y-3">
                <SkeletonLoader height="1.25rem" rounded="md" width="50%" />
                <SkeletonLoader height="1rem" rounded="md" width="80%" />
                <SkeletonLoader height="2rem" rounded="md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
