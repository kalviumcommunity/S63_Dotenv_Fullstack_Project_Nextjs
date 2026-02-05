"use client";

import { ReactNode, useEffect } from "react";
import { SWRConfig } from "swr";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import fetcher from "@/lib/swr";
import { registerServiceWorker } from "@/lib/pwa";

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
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
    </SWRConfig>
  );
}
