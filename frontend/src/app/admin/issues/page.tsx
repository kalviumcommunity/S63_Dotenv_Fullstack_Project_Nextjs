"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/common/layout/ProtectedRoute";
import AnimatedCard from "@/components/shared/animations/AnimatedCard";
import SkeletonLoader from "@/components/shared/animations/SkeletonLoader";
import { safeVariants, microTransitions } from "@/lib/animations";
import { fetchUnassignedIssues, fetchOfficers, updateIssue, getAiAssignmentSuggestion } from "@/lib/api";
import { getCategoryLabel } from "@/lib/utils";
import StatusBadge from "@/components/features/dashboard/StatusBadge";

interface Officer {
  id: number;
  name: string;
  email: string;
  activeAssignments: number;
  createdAt: string;
}

interface UnassignedIssue {
  id: number;
  publicId: string | null;
  title: string;
  description: string | null;
  category: string;
  status: string;
  latitude: string | null;
  longitude: string | null;
  createdAt: string;
  reportedBy: {
    id: number;
    name: string;
    email: string;
  } | null;
}

interface AiSuggestion {
  recommendedOfficerId: number;
  confidence: number;
  reasoning: string[];
  alternatives: Array<{ officerId: number; reason: string }>;
}

export default function AdminIssuesPage() {
  const { user } = useAuth();
  const [issues, setIssues] = useState<UnassignedIssue[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<number | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<UnassignedIssue | null>(null);
  const [selectedOfficer, setSelectedOfficer] = useState<number | null>(null);
  const [slaDeadline, setSlaDeadline] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestion | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== "admin") return;
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [issuesData, officersData] = await Promise.all([
        fetchUnassignedIssues(),
        fetchOfficers(),
      ]);
      setIssues(issuesData);
      setOfficers(officersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleGetAiSuggestion = async (issue: UnassignedIssue) => {
    if (!officers.length) return;
    setLoadingAi(true);
    setAiSuggestion(null);
    try {
      const suggestion = await getAiAssignmentSuggestion(issue.id, officers, {
        title: issue.title,
        description: issue.description,
        category: issue.category,
        createdAt: issue.createdAt,
      });
      setAiSuggestion(suggestion);
      if (suggestion?.recommendedOfficerId) {
        setSelectedOfficer(suggestion.recommendedOfficerId);
      }
    } catch (err) {
      console.error("AI suggestion failed:", err);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedIssue || !selectedOfficer) {
      toast.error("Please select an issue and an officer");
      return;
    }

    setAssigning(selectedIssue.id);
    setError(null);
    setSuccess(null);

    const loadingToast = toast.loading("Assigning issue...");

    try {
      const deadline = slaDeadline ? new Date(slaDeadline).toISOString() : undefined;
      await updateIssue(String(selectedIssue.id), {
        assignedToId: selectedOfficer,
        status: "ASSIGNED",
        slaDeadline: deadline,
      });

      toast.dismiss(loadingToast);
      const successMessage = `Issue ${selectedIssue.publicId || `#${selectedIssue.id}`} assigned successfully!`;
      toast.success(successMessage);
      setSuccess(successMessage);
      setSelectedIssue(null);
      setSelectedOfficer(null);
      setSlaDeadline("");
      setAiSuggestion(null);
      
      // Refresh data
      await loadData();
      
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      toast.dismiss(loadingToast);
      const errorMessage = err instanceof Error ? err.message : "Failed to assign issue";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setAssigning(null);
    }
  };

  const openAssignModal = (issue: UnassignedIssue) => {
    setSelectedIssue(issue);
    setSelectedOfficer(null);
    setSlaDeadline("");
    setAiSuggestion(null);
    handleGetAiSuggestion(issue);
  };

  return (
    <ProtectedRoute requireRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          variants={safeVariants.fadeIn}
          initial="initial"
          animate="animate"
          className="flex items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-[var(--foreground)] bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Issue Assignment Portal
            </h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Review and assign unassigned issues to officers. AI-powered suggestions available.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={loadData}
            disabled={loading}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </motion.button>
        </motion.div>

        {/* Alerts */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-800 backdrop-blur-sm"
            >
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-xl border border-green-200 bg-green-50/80 p-4 text-sm text-green-800 backdrop-blur-sm"
            >
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <AnimatedCard className="bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-cyan-700">Unassigned Issues</p>
                <p className="mt-1 text-3xl font-bold text-cyan-900">{issues.length}</p>
              </div>
              <div className="rounded-full bg-cyan-200 p-3">
                <svg className="h-8 w-8 text-cyan-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Available Officers</p>
                <p className="mt-1 text-3xl font-bold text-blue-900">{officers.length}</p>
              </div>
              <div className="rounded-full bg-blue-200 p-3">
                <svg className="h-8 w-8 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Avg Workload</p>
                <p className="mt-1 text-3xl font-bold text-purple-900">
                  {officers.length > 0
                    ? Math.round(
                        officers.reduce((sum, o) => sum + o.activeAssignments, 0) / officers.length
                      )
                    : 0}
                </p>
              </div>
              <div className="rounded-full bg-purple-200 p-3">
                <svg className="h-8 w-8 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </AnimatedCard>
        </div>

        {/* Issues List */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <SkeletonLoader key={i} height="200px" rounded="lg" />
            ))}
          </div>
        ) : issues.length === 0 ? (
          <AnimatedCard className="text-center py-12">
            <div className="mx-auto max-w-md">
              <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">All Clear!</h3>
              <p className="text-sm text-[var(--muted)]">No unassigned issues at the moment.</p>
            </div>
          </AnimatedCard>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {issues.map((issue, index) => (
              <motion.div
                key={issue.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, ...microTransitions.card }}
              >
                <AnimatedCard className="relative overflow-hidden group cursor-pointer" onClick={() => openAssignModal(issue)}>
                  {/* 3D Gradient Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-3">
                      <span className="font-mono text-xs text-[var(--muted)] bg-[var(--background)] px-2 py-1 rounded">
                        {issue.publicId || `#${issue.id}`}
                      </span>
                      <StatusBadge status={issue.status} />
                    </div>
                    
                    <h3 className="font-semibold text-[var(--foreground)] mb-2 line-clamp-2 group-hover:text-cyan-600 transition-colors">
                      {issue.title}
                    </h3>
                    
                    {issue.description && (
                      <p className="text-sm text-[var(--muted)] line-clamp-2 mb-3">
                        {issue.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-[var(--muted)] mb-4">
                      <span className="px-2 py-1 bg-cyan-100 text-cyan-700 rounded-full font-medium">
                        {getCategoryLabel(issue.category)}
                      </span>
                      <span>·</span>
                      <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:shadow-lg"
                    >
                      Assign Issue
                    </motion.button>
                  </div>
                </AnimatedCard>
              </motion.div>
            ))}
          </div>
        )}

        {/* Assignment Modal */}
        <AnimatePresence>
          {selectedIssue && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setSelectedIssue(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/20 bg-white/95 backdrop-blur-xl shadow-2xl p-6"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(236,254,255,0.95) 100%)",
                }}
              >
                {/* Close Button */}
                <button
                  onClick={() => setSelectedIssue(null)}
                  className="absolute top-4 right-4 rounded-full p-2 hover:bg-gray-100 transition"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                  Assign Issue: {selectedIssue.publicId || `#${selectedIssue.id}`}
                </h2>
                <p className="text-sm text-[var(--muted)] mb-6">{selectedIssue.title}</p>

                {/* AI Suggestion */}
                {loadingAi ? (
                  <div className="mb-6 rounded-xl border border-cyan-200 bg-cyan-50/50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
                      <span className="text-sm text-cyan-700">AI is analyzing...</span>
                    </div>
                  </div>
                ) : aiSuggestion ? (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 rounded-xl border-2 border-cyan-300 bg-gradient-to-br from-cyan-50 to-blue-50 p-4 shadow-lg"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 p-2">
                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-cyan-900 mb-1">AI Recommendation</h3>
                        <p className="text-xs text-cyan-700 mb-2">
                          Confidence: {(aiSuggestion.confidence * 100).toFixed(0)}%
                        </p>
                        <ul className="text-sm text-cyan-800 space-y-1 mb-3">
                          {aiSuggestion.reasoning.map((reason, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-cyan-500">•</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                        {aiSuggestion.alternatives.length > 0 && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-cyan-700 font-medium">View alternatives</summary>
                            <ul className="mt-2 space-y-1 text-cyan-600">
                              {aiSuggestion.alternatives.map((alt, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span>•</span>
                                  <span>Officer ID {alt.officerId}: {alt.reason}</span>
                                </li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ) : null}

                {/* Officer Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                    Select Officer
                  </label>
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
                    onClick={() => setSelectedIssue(null)}
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAssign}
                    disabled={!selectedOfficer || assigning === selectedIssue.id}
                    className="flex-1 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl disabled:opacity-50"
                  >
                    {assigning === selectedIssue.id ? "Assigning..." : "Assign Issue"}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  );
}
