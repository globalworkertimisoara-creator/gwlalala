/**
 * usePermissions hook
 *
 * Maps the current user's role (from AuthContext) to the permissions config
 * and exposes a simple `can(permission)` helper plus the full permissions object.
 */

import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  type AllRoles,
  type RolePermissions,
  PERMISSIONS_BY_ROLE,
  getRoleName,
  isInternalStaff,
  isAgencyTeam,
} from '@/config/permissions';

interface UsePermissionsReturn {
  /** The resolved role string, or null if not yet loaded */
  role: AllRoles | null;
  /** Human-readable role name */
  roleName: string;
  /** Full permissions object for the current role */
  permissions: RolePermissions | null;
  /** Shortcut: check a single permission key */
  can: (permission: keyof RolePermissions) => boolean;
  /** True when the role belongs to internal staff */
  isInternal: boolean;
  /** True when the role belongs to an agency team */
  isAgency: boolean;
  /** Loading state – true while auth context hasn't resolved yet */
  loading: boolean;
}

export function usePermissions(): UsePermissionsReturn {
  const { role, loading, isAgency: authIsAgency } = useAuth();

  // Determine the effective AllRoles key.
  // For agency users we also need to consider agency_team_role from the profile,
  // but the AuthContext currently exposes the app_role ('agency'). Agency sub-roles
  // are stored in profiles.agency_team_role and surfaced through useAgencyTeam.
  // For now, agency users without a specific team role default to 'agency_owner'.
  const effectiveRole: AllRoles | null = useMemo(() => {
    if (!role) return null;
    // The app_role enum values that map directly
    if (role in PERMISSIONS_BY_ROLE) return role as AllRoles;
    // 'agency' app_role maps to agency_owner as default
    if (role === 'agency') return 'agency_owner';
    return null;
  }, [role]);

  const permissions = effectiveRole ? PERMISSIONS_BY_ROLE[effectiveRole] : null;

  const can = useMemo(() => {
    if (!permissions) return () => false;
    return (permission: keyof RolePermissions) => permissions[permission];
  }, [permissions]);

  return {
    role: effectiveRole,
    roleName: effectiveRole ? getRoleName(effectiveRole) : '',
    permissions,
    can,
    isInternal: effectiveRole ? isInternalStaff(effectiveRole) : false,
    isAgency: effectiveRole ? isAgencyTeam(effectiveRole) : authIsAgency,
    loading,
  };
}
