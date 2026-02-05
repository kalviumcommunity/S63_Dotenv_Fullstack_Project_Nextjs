"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { safeVariants, microTransitions } from "@/lib/animations";

interface QualityHint {
  type: "missing" | "unclear" | "good";
  message: string;
}

interface InputQualityIndicatorProps {
  text: string;
  minLength?: number;
  hints?: string[];
}

export default function InputQualityIndicator({
  text,
  minLength = 20,
  hints = [],
}: InputQualityIndicatorProps) {
  const [qualityHints, setQualityHints] = useState<QualityHint[]>([]);

  useEffect(() => {
    const hints: QualityHint[] = [];

    if (text.length < minLength) {
      hints.push({
        type: "missing",
        message: `Add ${minLength - text.length} more characters for better clarity`,
      });
    }

    if (hints.length > 0) {
      hints.forEach((hint) => {
        hints.push({
          type: "unclear",
          message: hint,
        });
      });
    }

    if (text.length >= minLength && hints.length === 0) {
      hints.push({
        type: "good",
        message: "Description looks clear and detailed",
      });
    }

    setQualityHints(hints);
  }, [text, minLength, hints]);

  if (qualityHints.length === 0) {
    return null;
  }

  return (
    <motion.div
      variants={safeVariants.slideDown}
      initial="initial"
      animate="animate"
      transition={microTransitions.form}
      className="mt-2 space-y-1"
      role="status"
      aria-live="polite"
    >
      {qualityHints.map((hint, idx) => (
        <motion.div
          key={idx}
          variants={safeVariants.fadeIn}
          initial="initial"
          animate="animate"
          className={`flex items-center gap-2 text-xs ${
            hint.type === "good"
              ? "text-green-600"
              : hint.type === "unclear"
                ? "text-yellow-600"
                : "text-gray-500"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              hint.type === "good"
                ? "bg-green-500"
                : hint.type === "unclear"
                  ? "bg-yellow-500"
                  : "bg-gray-400"
            }`}
          />
          {hint.message}
        </motion.div>
      ))}
    </motion.div>
  );
}
