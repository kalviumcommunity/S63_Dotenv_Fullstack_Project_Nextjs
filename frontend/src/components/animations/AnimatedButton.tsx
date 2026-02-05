"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";
import { buttonVariants } from "@/lib/animations";
import { cn } from "@/lib/utils";

interface AnimatedButtonProps extends HTMLMotionProps<"button"> {
  children: ReactNode;
  variant?: "primary" | "outline" | "ghost";
  isLoading?: boolean;
  className?: string;
}

export default function AnimatedButton({
  children,
  variant = "primary",
  isLoading = false,
  className,
  disabled,
  ...props
}: AnimatedButtonProps) {
  const baseStyles = {
    primary: "bg-gradient-to-r from-cyan-600 to-blue-600 text-white",
    outline: "border-2 border-cyan-300 text-cyan-700 bg-transparent",
    ghost: "text-gray-700 hover:bg-gray-100",
  };

  return (
    <motion.button
      variants={buttonVariants}
      initial="idle"
      whileHover={disabled || isLoading ? "idle" : "hover"}
      whileTap={disabled || isLoading ? "idle" : "tap"}
      animate={isLoading ? "loading" : "idle"}
      disabled={disabled || isLoading}
      className={cn(
        "relative overflow-hidden rounded-xl px-6 py-3 font-medium transition-colors",
        baseStyles[variant],
        (disabled || isLoading) && "opacity-50 cursor-not-allowed",
        className
      )}
      {...props}
    >
      {isLoading && (
        <motion.div
          className="absolute inset-0 bg-white/20"
          animate={{ x: ["-100%", "100%"] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      )}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
}
