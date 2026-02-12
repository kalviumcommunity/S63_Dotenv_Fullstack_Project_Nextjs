/**
 * Centralized Role-Based Access Control (RBAC) System
 *
 * Single source of truth for role-permission mapping.
 * Default: deny if permission not explicitly allowed.
 *
 * Role mapping (DB roles → permission equivalence):
 * - admin  → full (create, read, update, delete)
 * - officer → editor (read, update)
 * - citizen → viewer (read) + create for reporting
 */

// Permission types
export type Permission = "create" | "read" | "update" | "delete";

// Application roles (mapped from Prisma Role enum)
export type AppRole = "citizen" | "officer" | "admin";

/**
 * Centralized role-permission mapping.
 * Extend by adding roles or permissions to the mapping.
 *
 * admin  → create, read, update, delete
 * officer → read, update (editor-equivalent)
 * citizen → read (viewer); create for issue reporting (preserves existing feature)
 */
const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  admin: ["create", "read", "update", "delete"],
  officer: ["read", "update"],
  citizen: ["read", "create"],
};

/**
 * Get all permissions for a given role
 */
export function getRolePermissions(role: AppRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: AppRole, permission: Permission): boolean {
  const permissions = getRolePermissions(role);
  return permissions.includes(permission);
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: AppRole, permissions: Permission[]): boolean {
  return permissions.some((perm) => hasPermission(role, perm));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: AppRole, permissions: Permission[]): boolean {
  return permissions.every((perm) => hasPermission(role, perm));
}

/**
 * Get role hierarchy level (higher number = more privileges)
 */
export function getRoleLevel(role: AppRole): number {
  const levels: Record<AppRole, number> = {
    citizen: 1,
    officer: 2,
    admin: 3,
  };
  return levels[role] || 0;
}

/**
 * Check if role1 has equal or higher privileges than role2
 */
export function hasEqualOrHigherRole(role1: AppRole, role2: AppRole): boolean {
  return getRoleLevel(role1) >= getRoleLevel(role2);
}

/**
 * Permission check result for logging
 */
export interface PermissionCheckResult {
  allowed: boolean;
  role: AppRole;
  permission: Permission;
  resource?: string;
  reason?: string;
}

/**
 * Check permission with detailed result for logging
 */
export function checkPermission(
  role: AppRole,
  permission: Permission,
  resource?: string
): PermissionCheckResult {
  const allowed = hasPermission(role, permission);
  
  return {
    allowed,
    role,
    permission,
    resource,
    reason: allowed
      ? `Role '${role}' has '${permission}' permission`
      : `Role '${role}' does not have '${permission}' permission`,
  };
}
