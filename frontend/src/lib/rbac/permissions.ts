/**
 * Frontend RBAC Permission Utilities
 *
 * Client-side permission checks for conditional UI rendering.
 * Mirrors backend permissions; backend always enforces.
 *
 * admin → create, read, update, delete
 * officer (editor) → read, update
 * citizen (viewer) → read, create (for reporting)
 */

export type Permission = "create" | "read" | "update" | "delete";
export type AppRole = "citizen" | "officer" | "admin";

const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  admin: ["create", "read", "update", "delete"],
  officer: ["read", "update"],
  citizen: ["read", "create"],
};

/**
 * Get all permissions for a given role
 */
export function getRolePermissions(role: AppRole | string | undefined): Permission[] {
  if (!role || !(role in ROLE_PERMISSIONS)) {
    return [];
  }
  return ROLE_PERMISSIONS[role as AppRole];
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: AppRole | string | undefined, permission: Permission): boolean {
  if (!role) return false;
  const permissions = getRolePermissions(role);
  return permissions.includes(permission);
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: AppRole | string | undefined, permissions: Permission[]): boolean {
  if (!role) return false;
  return permissions.some((perm) => hasPermission(role, perm));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: AppRole | string | undefined, permissions: Permission[]): boolean {
  if (!role) return false;
  return permissions.every((perm) => hasPermission(role, perm));
}

/**
 * Get role hierarchy level (higher number = more privileges)
 */
export function getRoleLevel(role: AppRole | string | undefined): number {
  if (!role) return 0;
  const levels: Record<AppRole, number> = {
    citizen: 1,
    officer: 2,
    admin: 3,
  };
  return levels[role as AppRole] || 0;
}

/**
 * Check if role1 has equal or higher privileges than role2
 */
export function hasEqualOrHigherRole(
  role1: AppRole | string | undefined,
  role2: AppRole | string | undefined
): boolean {
  return getRoleLevel(role1) >= getRoleLevel(role2);
}
