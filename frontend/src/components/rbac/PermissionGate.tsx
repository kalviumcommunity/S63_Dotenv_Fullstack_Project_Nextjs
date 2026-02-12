"use client";

import { ReactNode } from "react";
import { useHasPermission, useHasAnyPermission } from "@/hooks/usePermissions";
import { Permission } from "@/lib/rbac/permissions";

interface PermissionGateProps {
  permission?: Permission;
  permissions?: Permission[];
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Component that conditionally renders children based on user permissions
 * Use this to hide UI elements from users who don't have the required permissions
 */
export default function PermissionGate({
  permission,
  permissions,
  fallback = null,
  children,
}: PermissionGateProps) {
  const hasPermission = permission ? useHasPermission(permission) : false;
  const hasAnyPermission = permissions ? useHasAnyPermission(permissions) : false;

  if (permission && hasPermission) {
    return <>{children}</>;
  }

  if (permissions && hasAnyPermission) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
