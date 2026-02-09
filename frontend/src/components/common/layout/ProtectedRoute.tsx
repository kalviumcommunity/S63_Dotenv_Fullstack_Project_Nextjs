"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Loader from "@/components/common/feedback/Loader";

interface ProtectedRouteProps {
  children: ReactNode;
  requireRole?: "admin" | "officer" | "citizen";
  requireAnyRole?: Array<"admin" | "officer" | "citizen">;
}

export default function ProtectedRoute({ children, requireRole, requireAnyRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    if (!isLoading && isAuthenticated) {
      // Check single role requirement
      if (requireRole && user?.role !== requireRole) {
        router.push("/unauthorized");
        return;
      }

      // Check multiple role requirement (OR logic)
      if (requireAnyRole && user?.role && !requireAnyRole.includes(user.role as any)) {
        router.push("/unauthorized");
        return;
      }
    }
  }, [isAuthenticated, isLoading, requireRole, requireAnyRole, user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader size="lg" text="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Check single role requirement
  if (requireRole && user?.role !== requireRole) {
    return null;
  }

  // Check multiple role requirement (OR logic)
  if (requireAnyRole && user?.role && !requireAnyRole.includes(user.role as any)) {
    return null;
  }

  return <>{children}</>;
}
