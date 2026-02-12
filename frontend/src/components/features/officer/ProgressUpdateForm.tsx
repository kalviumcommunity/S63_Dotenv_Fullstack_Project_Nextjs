"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { safeVariants, microTransitions } from "@/lib/animations";
import AnimatedButton from "@/components/shared/animations/AnimatedButton";
import PermissionGate from "@/components/rbac/PermissionGate";

const progressSchema = z.object({
  percentage: z.number().min(0).max(100),
  notes: z.string().optional(),
});

type ProgressFormData = z.infer<typeof progressSchema>;

interface ProgressUpdateFormProps {
  issueId: string | number;
  currentProgress: number;
  onSuccess?: () => void;
}

export default function ProgressUpdateForm({
  issueId,
  currentProgress,
  onSuccess,
}: ProgressUpdateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProgressFormData>({
    resolver: zodResolver(progressSchema),
    defaultValues: {
      percentage: currentProgress,
      notes: "",
    },
  });

  const onSubmit = async (data: ProgressFormData) => {
    setIsSubmitting(true);
    setError(null);

    const loadingToast = toast.loading("Updating progress...");

    try {
      const { apiPost } = await import("@/lib/api/client");
      const result = await apiPost(`/api/issues/${issueId}/progress`, data);

      toast.dismiss(loadingToast);
      toast.success(`Progress updated to ${data.percentage}%`);
      reset({ percentage: data.percentage, notes: "" });
      onSuccess?.();
    } catch (err) {
      if (!error) {
        const errorMessage = err instanceof Error ? err.message : "Failed to update progress";
        setError(errorMessage);
        if (!toast.isActive(loadingToast)) {
          toast.error(errorMessage);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PermissionGate permission="update">
      <motion.div
        variants={safeVariants.slideUp}
        initial="initial"
        animate="animate"
        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Update Progress</h3>

      {error && (
        <motion.div
          variants={safeVariants.fadeIn}
          initial="initial"
          animate="animate"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600"
        >
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Progress Percentage (0-100%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            {...register("percentage", { valueAsNumber: true })}
            className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            placeholder="Enter percentage"
          />
          {errors.percentage && (
            <p className="mt-1 text-sm text-red-600">{errors.percentage.message}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Work Done Today (Optional)
          </label>
          <textarea
            {...register("notes")}
            rows={3}
            className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            placeholder="Describe what work was completed today..."
          />
          {errors.notes && (
            <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
          )}
        </div>

        <AnimatedButton
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Updating..." : "Update Progress"}
        </AnimatedButton>
      </form>
    </motion.div>
    </PermissionGate>
  );
}
