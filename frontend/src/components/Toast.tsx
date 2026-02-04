"use client";

import { useEffect } from "react";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type: ToastType;
  onDismiss: () => void;
  duration?: number;
}

export default function Toast({ message, type, onDismiss, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [onDismiss, duration]);

  return (
    <div
      className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 animate-fade-in rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg"
      style={{ backgroundColor: type === "success" ? "var(--success)" : type === "error" ? "var(--danger)" : "var(--primary)" }}
      role="alert"
    >
      {message}
    </div>
  );
}
