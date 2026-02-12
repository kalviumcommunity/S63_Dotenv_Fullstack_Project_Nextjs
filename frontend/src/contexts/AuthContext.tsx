"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  setAccessToken,
  clearAccessToken,
  refreshAccessToken,
  getAccessToken,
  decodeTokenPayload,
} from "@/lib/auth/tokenManager";

export interface User {
  id: number;
  email: string;
  name: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, userData: User) => void;
  logout: (onComplete?: () => void) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        await refreshAccessToken();
        const token = getAccessToken();
        const payload = decodeTokenPayload(token);
        if (payload) {
          setUser({
            id: payload.id,
            email: payload.email,
            name: payload.email.split("@")[0],
            role: payload.role,
          });
        }
      } catch {
        clearAccessToken();
      } finally {
        setIsLoading(false);
      }
    }

    checkSession();
  }, []);

  const login = (accessToken: string, userData: User) => {
    setAccessToken(accessToken);
    setUser(userData);
  };

  const logout = async (onComplete?: () => void) => {
    // Add fade-out animation effect
    const body = document.body;
    body.style.transition = "opacity 0.5s ease-out";
    body.style.opacity = "0";

    try {
      // Call logout endpoint to clear refresh token cookie
      const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") || "http://localhost:5000";
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      }).catch(() => {
        // Ignore errors - still clear local state
      });
    } finally {
      // Clear local state regardless of API call success
      clearAccessToken();
      setUser(null);
      
      // Reset opacity for next page
      body.style.opacity = "1";
      
      if (onComplete) {
        onComplete();
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
