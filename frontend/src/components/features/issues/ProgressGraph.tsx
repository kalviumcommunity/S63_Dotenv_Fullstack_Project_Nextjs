"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { safeVariants, microTransitions } from "@/lib/animations";

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

interface ProgressGraphProps {
  progressUpdates: ProgressUpdate[];
  currentProgress: number;
  className?: string;
}

export default function ProgressGraph({
  progressUpdates,
  currentProgress,
  className,
}: ProgressGraphProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    // Animate progress bar
    const timer = setTimeout(() => {
      setAnimatedProgress(currentProgress);
    }, 100);
    return () => clearTimeout(timer);
  }, [currentProgress]);

  // Sort updates by date (oldest first for graph)
  const sortedUpdates = [...progressUpdates].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Create data points for the graph
  const dataPoints = sortedUpdates.map((update) => ({
    date: new Date(update.createdAt),
    percentage: update.percentage,
    notes: update.notes,
    updatedBy: update.updatedBy.name,
  }));

  // Add current progress as final point if not already there
  if (dataPoints.length === 0 || dataPoints[dataPoints.length - 1].percentage !== currentProgress) {
    dataPoints.push({
      date: new Date(),
      percentage: currentProgress,
      notes: null,
      updatedBy: "",
    });
  }

  const maxPercentage = Math.max(...dataPoints.map((p) => p.percentage), 100);
  const minDate = dataPoints[0]?.date || new Date();
  const maxDate = dataPoints[dataPoints.length - 1]?.date || new Date();
  const dateRange = maxDate.getTime() - minDate.getTime() || 1;

  return (
    <div className={className}>
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Overall Progress</span>
          <span className="text-lg font-bold text-cyan-600">{currentProgress}%</span>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-gray-200">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-600"
            initial={{ width: 0 }}
            animate={{ width: `${animatedProgress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Progress Timeline Graph */}
      {dataPoints.length > 1 && (
        <div className="mt-6">
          <h4 className="mb-3 text-sm font-semibold text-gray-700">Progress Timeline</h4>
          <div className="relative h-32">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between">
              {[0, 25, 50, 75, 100].map((percent) => (
                <div key={percent} className="flex items-center">
                  <div className="h-px w-full bg-gray-100" />
                  <span className="ml-2 text-xs text-gray-400">{percent}%</span>
                </div>
              ))}
            </div>

            {/* Progress line */}
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <motion.polyline
                points={dataPoints
                  .map(
                    (point, idx) =>
                      `${(idx / (dataPoints.length - 1 || 1)) * 100},${
                        100 - (point.percentage / maxPercentage) * 100
                      }`
                  )
                  .join(" ")}
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>

              {/* Data points */}
              {dataPoints.map((point, idx) => {
                const x = (idx / (dataPoints.length - 1 || 1)) * 100;
                const y = 100 - (point.percentage / maxPercentage) * 100;
                return (
                  <motion.circle
                    key={idx}
                    cx={x}
                    cy={y}
                    r="3"
                    fill="#06b6d4"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: idx * 0.1, duration: 0.3 }}
                  />
                );
              })}
            </svg>
          </div>

          {/* Recent Updates */}
          <div className="mt-4 space-y-2">
            <h5 className="text-xs font-semibold text-gray-600">Recent Updates</h5>
            {sortedUpdates.slice(-5).reverse().map((update) => (
              <motion.div
                key={update.id}
                variants={safeVariants.fadeIn}
                initial="initial"
                animate="animate"
                transition={microTransitions.form}
                className="flex items-start gap-2 rounded-lg border border-gray-100 bg-gray-50/50 p-2 text-xs"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{update.percentage}%</span>
                    <span className="text-gray-500">
                      by {update.updatedBy.name}
                    </span>
                    <span className="text-gray-400">
                      {new Date(update.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {update.notes && (
                    <p className="mt-1 text-gray-600">{update.notes}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
