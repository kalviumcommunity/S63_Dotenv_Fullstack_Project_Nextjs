# Role-Based Access Control (RBAC) System

## Overview

This application implements a comprehensive, production-grade RBAC system that enforces permissions consistently across backend API routes and frontend UI components.

## Role Model

The system uses three roles mapped to permission levels:

| Role | Permissions | Description |
|------|-------------|-------------|
| **citizen** | `create`, `read` | Can create issues (report) and read/view issues |
| **officer** | `read`, `update` | Can read issues and update progress/status |
| **admin** | `create`, `read`, `update`, `delete` | Full access to all operations |

### Permission Types

- **create**: Create new resources (issues, assignments)
- **read**: View/read resources
- **update**: Modify existing resources
- **delete**: Remove resources (admin only)

## Backend Enforcement

### Centralized Permission System

All permission checks are centralized in:
- `backend/src/lib/rbac/permissions.ts` - Permission definitions and role mappings
- `backend/src/lib/rbac/middleware.ts` - Authentication and permission middleware
- `backend/src/lib/rbac/logging.ts` - Audit logging for all permission checks

### API Route Protection

Every sensitive API route uses permission middleware:

```typescript
import { requirePermission, AuthenticatedRequest } from "@/lib/rbac/middleware";
import { logAccessGranted } from "@/lib/rbac/logging";

export async function POST(req: NextRequest) {
  const authCheck = await requirePermission("create", "/api/issues")(req);
  if (authCheck instanceof NextRequest) {
    const authReq = authCheck as AuthenticatedRequest;
    const user = authReq.user!;
    
    logAccessGranted(user.id, user.email, user.role, "create", "/api/issues", "POST");
    // ... proceed with operation
  }
  return authCheck; // Permission denied response
}
```

### Protected Routes

| Route | Method | Required Permission | Roles Allowed |
|-------|--------|-------------------|---------------|
| `/api/issues` | POST | `create` | citizen, admin |
| `/api/issues/:id` | PATCH | `update` | officer, admin |
| `/api/issues/:id` | DELETE | `delete` | admin |
| `/api/issues/:id/progress` | POST | `update` | officer, admin |
| `/api/users/officers` | GET | `read` | officer, admin |
| `/api/issues/unassigned` | GET | `read` | officer, admin |
| `/api/ai/assign` | POST | `create` | admin |

## Frontend Enforcement

### Permission Utilities

Frontend permission checking is available via:
- `frontend/src/lib/rbac/permissions.ts` - Permission checking functions
- `frontend/src/hooks/usePermissions.ts` - React hooks for permission checks
- `frontend/src/components/rbac/PermissionGate.tsx` - Component for conditional rendering

### Usage Examples

**Using Permission Hooks:**
```typescript
import { useHasPermission } from "@/hooks/usePermissions";

function MyComponent() {
  const canUpdate = useHasPermission("update");
  
  return (
    <>
      {canUpdate && <button>Update Issue</button>}
    </>
  );
}
```

**Using PermissionGate Component:**
```typescript
import PermissionGate from "@/components/rbac/PermissionGate";

function MyComponent() {
  return (
    <PermissionGate permission="create">
      <button>Assign Issue</button>
    </PermissionGate>
  );
}
```

## Security Features

### Backend Security

1. **JWT Verification**: All authenticated requests verify JWT tokens
2. **User Validation**: Verifies user still exists in database
3. **Permission Checks**: Every sensitive operation checks permissions
4. **Fail Closed**: Default deny - permissions must be explicitly granted
5. **Role Verification**: Roles are extracted from verified JWT, never trusted from client

### Frontend Security

1. **UI Hiding**: Restricted actions are hidden from unauthorized users
2. **Permission Gates**: Components conditionally render based on permissions
3. **No Client Trust**: Frontend checks are additive - backend always enforces

### Protection Against

- **Privilege Escalation**: Roles cannot be elevated without proper authentication
- **Role Spoofing**: Roles come from verified JWT tokens, not client input
- **Bypass Attempts**: All API routes enforce permissions server-side
- **XSS**: JWT tokens stored in memory only (not localStorage)

## Logging & Auditing

Log format: `[RBAC] role=<role> action=<action> resource=<resource> result=ALLOWED|DENIED`

- Avoids sensitive data (no email in log line)
- Helps verify policy evaluation
- Consistent for parsing and alerts

Example log output:
```
[RBAC] role=admin action=create resource=/api/issues result=ALLOWED
[RBAC] role=citizen action=delete resource=/api/issues/123 result=DENIED
```

## Enforcement Points

### Backend Enforcement (Mandatory)

✅ **API Routes**: All sensitive routes protected with `requirePermission()`
✅ **Middleware**: JWT verification and user validation
✅ **Database**: Role stored in database, verified on each request
✅ **Logging**: All permission decisions logged

### Frontend Enforcement (Additive)

✅ **UI Components**: Conditional rendering based on permissions
✅ **Navigation**: Role-based menu items
✅ **Forms**: Permission-gated action buttons
✅ **Pages**: Protected routes with role requirements

## Examples

### Example 1: Admin Creating Issue Assignment

**Request:**
```
POST /api/ai/assign
Authorization: Bearer <admin_jwt_token>
```

**Backend Check:**
1. Verify JWT token ✅
2. Extract role: `admin` ✅
3. Check permission: `hasPermission("admin", "create")` → ✅ true
4. Log: `[RBAC] ALLOWED | User: admin@example.com | Role: admin | Permission: create`
5. Execute operation ✅

**Result:** ✅ Success (HTTP 200)

### Example 2: Officer Attempting Delete

**Request:**
```
DELETE /api/issues/123
Authorization: Bearer <officer_jwt_token>
```

**Backend Check:**
1. Verify JWT token ✅
2. Extract role: `officer` ✅
3. Check permission: `hasPermission("officer", "delete")` → ❌ false
4. Log: `[RBAC] DENIED | User: officer@example.com | Role: officer | Permission: delete`
5. Return error ❌

**Result:** ❌ Forbidden (HTTP 403)

### Example 3: Citizen Viewing Issue

**Request:**
```
GET /api/issues/123
Authorization: Bearer <citizen_jwt_token>
```

**Backend Check:**
1. Verify JWT token ✅
2. Extract role: `citizen` ✅
3. Check permission: `hasPermission("citizen", "read")` → ✅ true
4. Log: `[RBAC] ALLOWED | User: citizen@example.com | Role: citizen | Permission: read`
5. Return issue data ✅

**Result:** ✅ Success (HTTP 200)

## Scalability

The RBAC system is designed for easy extension:

1. **Add New Roles**: Update `ROLE_PERMISSIONS` mapping
2. **Add New Permissions**: Add to `Permission` type and update mappings
3. **Add New Routes**: Use `requirePermission()` middleware
4. **Add UI Checks**: Use `PermissionGate` component or hooks

## Future Enhancements

- Resource-level permissions (e.g., user can only update their own issues)
- Permission inheritance and role hierarchies
- Time-based permissions
- Permission caching for performance
- Database-backed audit trail
