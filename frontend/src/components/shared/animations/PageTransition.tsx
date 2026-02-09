"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { safeVariants } from "@/lib/animations";

interface PageTransitionProps {
  children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      variants={safeVariants.fadeIn}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.2 }}
      className="min-h-full"
    >
      {children}
    </motion.div>
  );
}
