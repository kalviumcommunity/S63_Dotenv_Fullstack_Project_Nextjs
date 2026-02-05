"use client";

import { useState, useEffect, ReactNode } from "react";
import { motion } from "framer-motion";
import { safeVariants } from "@/lib/animations";

interface OfflineGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function OfflineGuard({ children, fallback }: OfflineGuardProps) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOnline && fallback) {
    return <>{fallback}</>;
  }

  return (
    <motion.div
      variants={safeVariants.fadeIn}
      initial="initial"
      animate="animate"
    >
      {children}
    </motion.div>
  );
}
