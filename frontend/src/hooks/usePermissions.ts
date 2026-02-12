/**
 * React hook for checking user permissions
 */

import { useAuth } from "@/contexts/AuthContext";
import { hasPermission, hasAnyPermission, hasAllPermissions, Permission } from "@/lib/rbac/permissions";

/**
 * Hook to check if current user has a specific permission
 */
export function useHasPermission(permission: Permission): boolean {
  const { user } = useAuth();
  return hasPermission(user?.role, permission);
}

/**
 * Hook to check if current user has any of the specified permissions
 */
export function useHasAnyPermission(permissions: Permission[]): boolean {
  const { user } = useAuth();
  return hasAnyPermission(user?.role, permissions);
}

/**
 * Hook to check if current user has all of the specified permissions
 */
export function useHasAllPermissions(permissions: Permission[]): boolean {
  const { user } = useAuth();
  return hasAllPermissions(user?.role, permissions);
}

/**
 * Hook to get current user's role
 */
export function useRole(): string | undefined {
  const { user } = useAuth();
  return user?.role;
}
