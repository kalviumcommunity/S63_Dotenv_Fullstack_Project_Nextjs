"use client";

import { motion } from "framer-motion";
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
        "bg-gray-200",
        roundedClasses[rounded],
        className
      )}
      style={{ width, height }}
    />
  );
}
