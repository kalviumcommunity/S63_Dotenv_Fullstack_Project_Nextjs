/**
 * RBAC Logging System
 *
 * Structured logs for permission checks. Format:
 * [RBAC] role=<role> action=<action> resource=<resource> result=ALLOWED|DENIED
 *
 * Avoids sensitive data; helps verify policy evaluation.
 */

import type { Permission } from "./permissions";

export interface PermissionLogEntry {
  userId: number;
  userEmail: string;
  role: string;
  permission: string;
  resource: string;
  allowed: boolean;
  method: string;
  timestamp?: Date;
  reason?: string;
  ipAddress?: string;
}

/**
 * Log a permission check decision.
 * Format: [RBAC] role=<role> action=<action> resource=<resource> result=ALLOWED|DENIED
 */
export function logPermissionCheck(entry: PermissionLogEntry): void {
  const result = entry.allowed ? "ALLOWED" : "DENIED";
  const logMessage = `[RBAC] role=${entry.role} action=${entry.permission} resource=${entry.resource} result=${result}`;

  if (entry.allowed) {
    console.log(logMessage);
  } else {
    console.warn(logMessage);
  }
}

/**
 * Log permission check from middleware context
 */
export function logRbacDecision(
  role: string,
  action: Permission | string,
  resource: string,
  allowed: boolean
): void {
  const result = allowed ? "ALLOWED" : "DENIED";
  const logMessage = `[RBAC] role=${role} action=${action} resource=${resource} result=${result}`;

  if (allowed) {
    console.log(logMessage);
  } else {
    console.warn(logMessage);
  }
}

/**
 * Log access granted
 */
export function logAccessGranted(
  _userId: number,
  _userEmail: string,
  role: string,
  permission: string,
  resource: string,
  _method: string
): void {
  logRbacDecision(role, permission, resource, true);
}

/**
 * Log access denied
 */
export function logAccessDenied(
  _userId: number,
  _userEmail: string,
  role: string,
  permission: string,
  resource: string,
  _method: string,
  _reason?: string
): void {
  logRbacDecision(role, permission, resource, false);
}
