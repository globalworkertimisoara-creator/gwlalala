import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { type AllRoles, type RolePermissions, PERMISSIONS_BY_ROLE } from '@/config/permissions';
import { useToast } from '@/hooks/use-toast';

/**
 * Fetch all role permissions from the database.
 * Falls back to static config if DB has no data.
 */
export function useDbRolePermissions() {
  return useQuery({
    queryKey: ['role-permissions'],
    queryFn: async (): Promise<Record<AllRoles, RolePermissions>> => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('role, permissions');

      if (error) throw error;

      if (!data?.length) {
        return { ...PERMISSIONS_BY_ROLE };
      }

      const result = { ...PERMISSIONS_BY_ROLE };
      for (const row of data) {
        if (row.role in result) {
          result[row.role as AllRoles] = {
            ...PERMISSIONS_BY_ROLE[row.role as AllRoles],
            ...(row.permissions as unknown as Partial<RolePermissions>),
          };
        }
      }
      return result;
    },
  });
}

/**
 * Toggle a single permission for a role in the database.
 */
export function useTogglePermission() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      role,
      permissionKey,
      newValue,
    }: {
      role: AllRoles;
      permissionKey: keyof RolePermissions;
      newValue: boolean;
    }) => {
      // Get current permissions for this role
      const { data: existing, error: fetchErr } = await supabase
        .from('role_permissions')
        .select('permissions')
        .eq('role', role)
        .single();

      if (fetchErr) throw fetchErr;

      const current = (existing?.permissions as Record<string, boolean>) || {};
      const updated = { ...current, [permissionKey]: newValue };

      const { error } = await supabase
        .from('role_permissions')
        .update({
          permissions: updated as unknown as any,
          updated_at: new Date().toISOString(),
        })
        .eq('role', role);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast({ title: 'Permission updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update permission', description: error.message, variant: 'destructive' });
    },
  });
}
