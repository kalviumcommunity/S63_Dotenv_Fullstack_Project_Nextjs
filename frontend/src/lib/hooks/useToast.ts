/**
 * Toast notification hook
 * Provides easy access to toast notifications throughout the app
 */

import toast from "react-hot-toast";

export function useToast() {
  return {
    success: (message: string, duration = 4000) => {
      toast.success(message, {
        duration,
        position: "bottom-center",
        style: {
          background: "var(--success)",
          color: "white",
          borderRadius: "0.75rem",
          padding: "0.75rem 1rem",
          fontSize: "0.875rem",
          fontWeight: "500",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        },
        ariaProps: {
          role: "status",
          "aria-live": "polite",
        },
      });
    },
    error: (message: string, duration = 5000) => {
      toast.error(message, {
        duration,
        position: "bottom-center",
        style: {
          background: "var(--danger)",
          color: "white",
          borderRadius: "0.75rem",
          padding: "0.75rem 1rem",
          fontSize: "0.875rem",
          fontWeight: "500",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        },
        ariaProps: {
          role: "alert",
          "aria-live": "assertive",
        },
      });
    },
    info: (message: string, duration = 4000) => {
      toast(message, {
        duration,
        position: "bottom-center",
        icon: "ℹ️",
        style: {
          background: "var(--primary)",
          color: "white",
          borderRadius: "0.75rem",
          padding: "0.75rem 1rem",
          fontSize: "0.875rem",
          fontWeight: "500",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        },
        ariaProps: {
          role: "status",
          "aria-live": "polite",
        },
      });
    },
    loading: (message: string) => {
      return toast.loading(message, {
        position: "bottom-center",
        style: {
          background: "var(--primary)",
          color: "white",
          borderRadius: "0.75rem",
          padding: "0.75rem 1rem",
          fontSize: "0.875rem",
          fontWeight: "500",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        },
        ariaProps: {
          role: "status",
          "aria-live": "polite",
        },
      });
    },
    dismiss: (toastId: string) => {
      toast.dismiss(toastId);
    },
  };
}
