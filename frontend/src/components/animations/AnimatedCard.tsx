"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";
import { cardVariants } from "@/lib/animations";
import { cn } from "@/lib/utils";

interface AnimatedCardProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}

export default function AnimatedCard({
  children,
  className,
  interactive = true,
  ...props
}: AnimatedCardProps) {
  return (
    <motion.div
      variants={interactive ? cardVariants : undefined}
      initial="idle"
      whileHover={interactive ? "hover" : undefined}
      whileFocus={interactive ? "focus" : undefined}
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-6 shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
