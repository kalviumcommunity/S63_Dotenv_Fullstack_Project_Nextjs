"use client";

import { ReactNode, useEffect } from "react";
import { SWRConfig } from "swr";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import fetcher from "@/lib/swr";
import { registerServiceWorker } from "@/lib/services/pwa";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        errorRetryCount: 3,
        provider: () => new Map(),
      }}
    >
      <ThemeProvider>
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-center"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: "0.75rem",
                padding: "0.75rem 1rem",
                fontSize: "0.875rem",
                fontWeight: "500",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </SWRConfig>
  );
}
