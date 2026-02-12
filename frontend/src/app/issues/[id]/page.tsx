"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import StatusBadge from "@/components/features/dashboard/StatusBadge";
import ProgressGraph from "@/components/features/issues/ProgressGraph";
import AnimatedCard from "@/components/shared/animations/AnimatedCard";
import SkeletonLoader from "@/components/shared/animations/SkeletonLoader";
import PermissionGate from "@/components/rbac/PermissionGate";
import { getCategoryLabel } from "@/lib/utils";
import { fetchIssue, fetchIssueProgress, fetchOfficers, updateIssue, deleteIssue } from "@/lib/api";
import { safeVariants } from "@/lib/animations";
import type { IssueCardIssue } from "@/components/features/issues/IssueCard";

interface AssignedWorker {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface ProgressUpdate {
  id: number;
  percentage: number;
  notes?: string | null;
  updatedBy: {
    id: number;
    name: string;
    email: string;
  };
  createdAt: string;
}

interface Officer {
  id: number;
  name: string;
  email: string;
  activeAssignments: number;
}

type IssueDetail = IssueCardIssue & {
  description?: string | null;
  ward?: string | null;
  slaDeadline?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  reportedBy?: { id: number; name: string } | null;
  assignedTo?: { id: number; name: string; email?: string; role?: string } | null;
  progressPercentage?: number;
};

export default function IssueDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const issueId = params?.id;
  const [issue, setIssue] = useState<IssueDetail | null>(null);
  const [progressData, setProgressData] = useState<{
    progressPercentage: number;
    expectedCompletionDate: string | null;
    assignedTo: AssignedWorker | null;
    progressUpdates: ProgressUpdate[];
  } | null>(null);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [loadingOfficers, setLoadingOfficers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState<number | null>(null);
  const [slaDeadline, setSlaDeadline] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadIssue = async () => {
    if (!issueId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetchIssue(String(issueId));
      const anyRes = res as any;
      const data = anyRes?.data || anyRes;
      if (!data || Object.keys(data).length === 0) {
        setError("Issue not found.");
        setIssue(null);
      } else {
        setIssue(data as IssueDetail);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load issue.");
      setIssue(null);
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async () => {
    if (!issueId) return;
    try {
      setLoadingProgress(true);
      const data = await fetchIssueProgress(String(issueId));
      if (data) {
        setProgressData({
          progressPercentage: data.progressPercentage ?? 0,
          expectedCompletionDate: data.expectedCompletionDate ?? null,
          assignedTo: data.assignedTo ?? null,
          progressUpdates: data.progressUpdates ?? [],
        });
      }
    } catch (err) {
      // Silently fail - progress is optional
      setProgressData({
        progressPercentage: 0,
        expectedCompletionDate: null,
        assignedTo: null,
        progressUpdates: [],
      });
    } finally {
      setLoadingProgress(false);
    }
  };

  const loadOfficers = async () => {
    // Only load officers if user has create permission (for assignment)
    const { hasPermission } = await import("@/lib/rbac/permissions");
    if (!user?.role || !hasPermission(user.role, "create")) return;
    try {
      setLoadingOfficers(true);
      const officersData = await fetchOfficers();
      setOfficers(officersData);
    } catch (err) {
      console.error("Failed to load officers:", err);
    } finally {
      setLoadingOfficers(false);
    }
  };

  const handleAssign = async () => {
    if (!issueId || !selectedOfficer) {
      toast.error("Please select an officer to assign this issue");
      return;
    }
    setAssigning(true);
    setError(null);
    setAssignSuccess(null);

    const loadingToast = toast.loading("Assigning issue...");

    try {
      const deadline = slaDeadline ? new Date(slaDeadline).toISOString() : undefined;
      await updateIssue(String(issueId), {
        assignedToId: selectedOfficer,
        status: "ASSIGNED",
        slaDeadline: deadline,
      });

      toast.dismiss(loadingToast);
      const successMessage = "Issue assigned successfully!";
      toast.success(successMessage);
      setAssignSuccess(successMessage);
      setShowAssignModal(false);
      setSelectedOfficer(null);
      setSlaDeadline("");
      
      // Refresh issue and progress data
      await Promise.all([loadIssue(), loadProgress()]);
      
      setTimeout(() => setAssignSuccess(null), 5000);
    } catch (err) {
      toast.dismiss(loadingToast);
      const errorMessage = err instanceof Error ? err.message : "Failed to assign issue";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setAssigning(false);
    }
  };

  const handleDelete = async () => {
    if (!issueId || !confirm("Are you sure you want to delete this issue? This action cannot be undone.")) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteIssue(String(issueId));
      toast.success("Issue deleted successfully");
      router.push("/feed");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete issue";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (!issueId) return;
    let cancelled = false;

    async function load() {
      await Promise.all([loadIssue(), loadProgress()]);
      // Load officers if user has create permission (for assignment)
      const { hasPermission } = await import("@/lib/rbac/permissions");
      if (user?.role && hasPermission(user.role, "create")) {
        await loadOfficers();
      }
    }

    load();

    // Set up real-time refresh every 30 seconds
    const interval = setInterval(() => {
      if (!cancelled) {
        loadProgress();
      }
    }, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [issueId, user?.role]);

  if (!issueId) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[var(--muted)]">Invalid issue id.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Issue {issue?.publicId || `#${issueId}`}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            View the details, category, location, and SLA status for this reported issue.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PermissionGate permission="delete">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg border border-[var(--danger)]/50 bg-[var(--danger-bg)]/50 px-4 py-1.5 text-sm font-medium text-[var(--danger)] hover:bg-[var(--danger)]/10 disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </PermissionGate>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-1.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--border)]/50"
          >
            Back
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-[var(--danger)]/40 bg-[var(--danger-bg)]/40 p-3 text-sm text-[var(--danger)]">
          {error}
        </div>
      )}

      {loading && !issue && (
        <div className="space-y-4">
          <SkeletonLoader height="200px" rounded="lg" />
          <SkeletonLoader height="300px" rounded="lg" />
        </div>
      )}

      {issue && (
        <div className="space-y-6">
          {/* Issue Details Card */}
          <AnimatedCard className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-[var(--muted)]">
                    {issue.publicId || `#${issue.id}`}
                  </span>
                  <StatusBadge status={issue.status} />
                </div>
                <h2 className="text-2xl font-bold text-[var(--foreground)]">
                  {issue.title}
                </h2>
                {issue.description && (
                  <p className="text-sm text-[var(--muted)] whitespace-pre-line mt-2">
                    {issue.description}
                  </p>
                )}
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm">
                <p className="mb-2">
                  <span className="text-[var(--muted)]">Category: </span>
                  <span className="font-semibold text-[var(--foreground)]">
                    {getCategoryLabel(issue.category)}
                  </span>
                </p>
                {issue.ward && (
                  <p className="mb-2">
                    <span className="text-[var(--muted)]">Ward: </span>
                    <span className="font-semibold text-[var(--foreground)]">
                      {issue.ward}
                    </span>
                  </p>
                )}
                {issue.createdAt && (
                  <p>
                    <span className="text-[var(--muted)]">Reported: </span>
                    <span className="font-semibold text-[var(--foreground)]">
                      {new Date(issue.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {issue.latitude != null && issue.longitude != null && (
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <p className="text-sm text-[var(--muted)]">
                  Location: {issue.latitude}, {issue.longitude} ·{" "}
                  <Link
                    href={`/map?lat=${issue.latitude}&lng=${issue.longitude}`}
                    className="text-[var(--primary)] underline hover:text-[var(--primary-dark)]"
                  >
                    View on map
                  </Link>
                </p>
              </div>
            )}
          </AnimatedCard>

          {/* Progress Tracking Section */}
          <motion.div
            variants={safeVariants.fadeIn}
            initial="initial"
            animate="animate"
            className="space-y-6"
          >
            {/* Assigned Worker Card */}
            {progressData?.assignedTo ? (
              <AnimatedCard className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="mb-4 text-lg font-semibold text-[var(--foreground)]">
                      Assigned Worker
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-xl font-bold text-white shadow-lg">
                        {progressData.assignedTo.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-lg font-semibold text-[var(--foreground)]">
                          {progressData.assignedTo.name}
                        </p>
                        <p className="text-sm text-[var(--muted)]">
                          {progressData.assignedTo.email}
                        </p>
                        <p className="mt-1 text-sm font-medium text-cyan-600">
                          {progressData.assignedTo.role === "officer"
                            ? "Officer"
                            : progressData.assignedTo.role === "admin"
                              ? "Administrator"
                              : progressData.assignedTo.role}
                        </p>
                      </div>
                    </div>
                  </div>
                  <PermissionGate permission="create">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowAssignModal(true)}
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                      Reassign
                    </motion.button>
                  </PermissionGate>
                </div>
              </AnimatedCard>
            ) : (
              <AnimatedCard className="p-6 border-yellow-200 bg-yellow-50/50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <svg
                      className="h-6 w-6 text-yellow-600 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <div>
                      <p className="font-semibold text-yellow-900">Not Yet Assigned</p>
                      <p className="text-sm text-yellow-700">
                        This issue has not been assigned to any worker yet.
                      </p>
                    </div>
                  </div>
                  <PermissionGate permission="create">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowAssignModal(true)}
                      disabled={loadingOfficers || officers.length === 0}
                      className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingOfficers ? "Loading..." : "Assign to Officer"}
                    </motion.button>
                  </PermissionGate>
                </div>
              </AnimatedCard>
            )}

            {/* Expected Completion Date Card */}
            {progressData?.expectedCompletionDate && (
              <AnimatedCard
                className={`p-6 ${
                  new Date(progressData.expectedCompletionDate).getTime() < Date.now() &&
                  (progressData?.progressPercentage ?? 0) < 100
                    ? "border-red-200 bg-red-50/50"
                    : new Date(progressData.expectedCompletionDate).getTime() - Date.now() <
                        3 * 24 * 60 * 60 * 1000
                      ? "border-yellow-200 bg-yellow-50/50"
                      : "border-blue-200 bg-blue-50/50"
                }`}
              >
                <h3 className="mb-4 text-lg font-semibold text-[var(--foreground)]">
                  Expected Completion Date
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-[var(--foreground)]">
                      {new Date(progressData.expectedCompletionDate).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {new Date(progressData.expectedCompletionDate).toLocaleTimeString(
                        "en-US",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                  {(() => {
                    const daysRemaining = Math.ceil(
                      (new Date(progressData.expectedCompletionDate).getTime() -
                        Date.now()) /
                        (1000 * 60 * 60 * 24)
                    );
                    const isOverdue =
                      new Date(progressData.expectedCompletionDate).getTime() < Date.now() &&
                      (progressData?.progressPercentage ?? 0) < 100;

                    return (
                      <div className="text-right">
                        <p
                          className={`text-3xl font-bold ${
                            isOverdue
                              ? "text-red-600"
                              : daysRemaining <= 3
                                ? "text-yellow-600"
                                : "text-blue-600"
                          }`}
                        >
                          {isOverdue
                            ? `${Math.abs(daysRemaining)} days overdue`
                            : `${daysRemaining} days left`}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </AnimatedCard>
            )}

            {/* Progress Graph Card */}
            <AnimatedCard className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[var(--foreground)]">
                  Live Progress Tracking
                </h3>
                {loadingProgress && (
                  <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
                    <span>Updating...</span>
                  </div>
                )}
              </div>
              {progressData ? (
                <ProgressGraph
                  progressUpdates={progressData.progressUpdates}
                  currentProgress={progressData.progressPercentage}
                />
              ) : (
                <div className="py-8 text-center text-[var(--muted)]">
                  <p>Loading progress data...</p>
                </div>
              )}
            </AnimatedCard>

            {/* Reporter Information */}
            <AnimatedCard className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-[var(--foreground)]">
                Reporter Information
              </h3>
              <div className="space-y-2">
                <p className="text-sm text-[var(--muted)]">
                  <span className="font-medium text-[var(--foreground)]">Reporter: </span>
                  {issue.reportedBy?.name
                    ? `${issue.reportedBy.name} (ID ${issue.reportedBy.id})`
                    : issue.isOverdue
                      ? "Citizen (anonymous)"
                      : "Citizen"}
                </p>
                {issue.createdAt && (
                  <p className="text-sm text-[var(--muted)]">
                    <span className="font-medium text-[var(--foreground)]">Reported: </span>
                    {new Date(issue.createdAt).toLocaleString("en-US", {
                      dateStyle: "long",
                      timeStyle: "short",
                    })}
                  </p>
                )}
              </div>
            </AnimatedCard>
          </motion.div>
        </div>
      )}

      {/* Assignment Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAssignModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg rounded-2xl border border-white/20 bg-white/95 backdrop-blur-xl shadow-2xl p-6"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(236,254,255,0.95) 100%)",
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowAssignModal(false)}
                className="absolute top-4 right-4 rounded-full p-2 hover:bg-gray-100 transition"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                Assign Issue: {issue?.publicId || `#${issueId}`}
              </h2>
              <p className="text-sm text-[var(--muted)] mb-6">{issue?.title}</p>

              {/* Success Message */}
              {assignSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 rounded-xl border border-green-200 bg-green-50/80 p-3 text-sm text-green-800"
                >
                  {assignSuccess}
                </motion.div>
              )}

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 rounded-xl border border-red-200 bg-red-50/80 p-3 text-sm text-red-800"
                >
                  {error}
                </motion.div>
              )}

              {/* Officer Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                  Select Officer
                </label>
                {loadingOfficers ? (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-600">
                    Loading officers...
                  </div>
                ) : officers.length === 0 ? (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center text-sm text-yellow-700">
                    No officers available. Please create officer accounts first.
                  </div>
                ) : (
                  <div className="grid gap-2 max-h-60 overflow-y-auto">
                    {officers.map((officer) => (
                      <motion.button
                        key={officer.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setSelectedOfficer(officer.id)}
                        className={`rounded-lg border-2 p-3 text-left transition ${
                          selectedOfficer === officer.id
                            ? "border-cyan-500 bg-cyan-50 shadow-md"
                            : "border-gray-200 hover:border-cyan-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-[var(--foreground)]">{officer.name}</p>
                            <p className="text-xs text-[var(--muted)]">{officer.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-medium text-cyan-600">
                              {officer.activeAssignments} active
                            </p>
                            {selectedOfficer === officer.id && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="mt-1 inline-block rounded-full bg-cyan-500 p-1"
                              >
                                <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>

              {/* SLA Deadline */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                  Expected Completion Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={slaDeadline}
                  onChange={(e) => setSlaDeadline(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedOfficer(null);
                    setSlaDeadline("");
                    setError(null);
                  }}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAssign}
                  disabled={!selectedOfficer || assigning}
                  className="flex-1 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {assigning ? "Assigning..." : "Assign Issue"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

