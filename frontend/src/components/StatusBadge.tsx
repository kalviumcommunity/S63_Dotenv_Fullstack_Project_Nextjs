const STATUS_CLASS: Record<string, string> = {
  REPORTED: "badge-reported",
  ASSIGNED: "badge-assigned",
  IN_PROGRESS: "badge-in_progress",
  RESOLVED: "badge-resolved",
};

export default function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_CLASS[status] ?? "bg-gray-100 text-gray-800";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
