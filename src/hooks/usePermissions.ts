/**
 * usePermissions hook
 *
 * Maps the current user's role (from AuthContext) to the permissions config.
 * Reads from DB-backed role_permissions table with fallback to static config.
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
  isEmployerTeam,
} from '@/config/permissions';
import { useDbRolePermissions } from '@/hooks/useRolePermissions';

interface UsePermissionsReturn {
  role: AllRoles | null;
  roleName: string;
  permissions: RolePermissions | null;
  can: (permission: keyof RolePermissions) => boolean;
  isInternal: boolean;
  isAgency: boolean;
  isEmployer: boolean;
  loading: boolean;
}

export function usePermissions(): UsePermissionsReturn {
  const { role, loading, isAgency: authIsAgency } = useAuth();
  const { data: dbPermissions } = useDbRolePermissions();

  const permissionsMap = dbPermissions || PERMISSIONS_BY_ROLE;

  const effectiveRole: AllRoles | null = useMemo(() => {
    if (!role) return null;
    if (role in permissionsMap) return role as AllRoles;
    if (role === 'agency') return 'agency_owner';
    if (role === 'employer') return 'employer_admin';
    return null;
  }, [role, permissionsMap]);

  const permissions = effectiveRole ? permissionsMap[effectiveRole] : null;

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
    isEmployer: effectiveRole ? isEmployerTeam(effectiveRole) : false,
    loading,
  };
}
