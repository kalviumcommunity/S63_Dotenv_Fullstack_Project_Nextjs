"use client";

import { motion, useReducedMotion } from "framer-motion";
import { skeletonVariants } from "@/lib/animations";
import { cn } from "@/lib/utils";

interface SkeletonLoaderProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: "none" | "sm" | "md" | "lg" | "full";
}

export default function SkeletonLoader({
  className,
  width = "100%",
  height = "1rem",
  rounded = "md",
}: SkeletonLoaderProps) {
  const shouldReduceMotion = useReducedMotion();
  const roundedClasses = {
    none: "",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  };

  return (
    <motion.div
      variants={skeletonVariants}
      animate="animate"
      className={cn(
        "bg-[var(--border)] relative overflow-hidden",
        roundedClasses[rounded],
        className
      )}
      style={{ width, height }}
      aria-label="Loading"
      role="status"
    >
      {!shouldReduceMotion && (
        <motion.div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(
              90deg,
              transparent,
              rgba(255, 255, 255, 0.15),
              transparent
            )`,
            backgroundSize: "200% 100%",
          }}
          animate={{
            x: ["-100%", "100%"],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      )}
    </motion.div>
  );
}
