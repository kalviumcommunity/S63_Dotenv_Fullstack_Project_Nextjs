"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { cardVariants, safeVariants } from "@/lib/animations";
import ProgressGraph from "./ProgressGraph";
import StatusBadge from "@/components/features/dashboard/StatusBadge";
import { getCategoryLabel } from "@/lib/utils";

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

interface IssueProgressCardProps {
  issue: {
    id: string | number;
    publicId?: string | null;
    title: string;
    description?: string | null;
    category: string;
    status: string;
    createdAt?: string | null;
  };
  progressPercentage: number;
  expectedCompletionDate: string | null;
  assignedTo: AssignedWorker | null;
  progressUpdates: ProgressUpdate[];
  onRefresh?: () => void;
}

export default function IssueProgressCard({
  issue,
  progressPercentage,
  expectedCompletionDate,
  assignedTo,
  progressUpdates,
  onRefresh,
}: IssueProgressCardProps) {
  const isOverdue = expectedCompletionDate
    ? new Date(expectedCompletionDate).getTime() < Date.now() && progressPercentage < 100
    : false;

  const daysRemaining = expectedCompletionDate
    ? Math.ceil((new Date(expectedCompletionDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <motion.div
      variants={cardVariants}
      initial="idle"
      whileHover="hover"
      className={`rounded-xl border-2 bg-white p-6 shadow-sm transition-all ${
        isOverdue ? "border-red-200 bg-red-50/30" : "border-gray-200"
      }`}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span className="font-mono text-xs text-gray-500">
              {issue.publicId || `#${issue.id}`}
            </span>
            <StatusBadge status={issue.status} />
          </div>
          <Link
            href={`/issues/${issue.id}`}
            className="text-lg font-bold text-gray-900 hover:text-cyan-600 transition-colors"
          >
            {issue.title}
          </Link>
          {issue.description && (
            <p className="mt-1 line-clamp-2 text-sm text-gray-600">{issue.description}</p>
          )}
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <span>{getCategoryLabel(issue.category)}</span>
            <span>·</span>
            <span>
              {issue.createdAt
                ? new Date(issue.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Assigned Worker */}
      {assignedTo ? (
        <motion.div
          variants={safeVariants.fadeIn}
          initial="initial"
          animate="animate"
          className="mb-4 rounded-lg border border-cyan-100 bg-cyan-50/50 p-3"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-bold text-white">
              {assignedTo.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Assigned To</p>
              <p className="text-xs text-gray-600">
                {assignedTo.name} ({assignedTo.role === "officer" ? "Officer" : assignedTo.role})
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50/50 p-3">
          <p className="text-sm text-yellow-800">Not yet assigned to any worker</p>
        </div>
      )}

      {/* Expected Completion Date */}
      {expectedCompletionDate && (
        <motion.div
          variants={safeVariants.fadeIn}
          initial="initial"
          animate="animate"
          className={`mb-4 rounded-lg border p-3 ${
            isOverdue
              ? "border-red-200 bg-red-50/50"
              : daysRemaining && daysRemaining <= 3
                ? "border-yellow-200 bg-yellow-50/50"
                : "border-blue-200 bg-blue-50/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-700">Expected Completion</p>
              <p className="text-sm font-bold text-gray-900">
                {new Date(expectedCompletionDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            {daysRemaining !== null && (
              <div className="text-right">
                <p
                  className={`text-lg font-bold ${
                    isOverdue
                      ? "text-red-600"
                      : daysRemaining <= 3
                        ? "text-yellow-600"
                        : "text-blue-600"
                  }`}
                >
                  {isOverdue ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days left`}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Progress Graph */}
      <ProgressGraph
        progressUpdates={progressUpdates}
        currentProgress={progressPercentage}
        className="mt-4"
      />

      {/* Refresh Button */}
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="mt-4 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Refresh Progress
        </button>
      )}
    </motion.div>
  );
}
