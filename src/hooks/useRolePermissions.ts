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
      // Try to fetch existing row; maySingle avoids throwing on no rows
      const { data: existing, error: fetchErr } = await supabase
        .from('role_permissions')
        .select('permissions')
        .eq('role', role)
        .maybeSingle();

      if (fetchErr) throw fetchErr;

      const current = (existing?.permissions as Record<string, boolean>) || {};
      const updated = { ...current, [permissionKey]: newValue };

      // Upsert: insert if row doesn't exist, update if it does
      const { error } = await supabase
        .from('role_permissions')
        .upsert(
          {
            role,
            permissions: updated as unknown as any,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'role' }
        );

      if (error) throw error;
    },
    // Optimistic update: immediately reflect the change in the UI
    onMutate: async ({ role, permissionKey, newValue }) => {
      await queryClient.cancelQueries({ queryKey: ['role-permissions'] });
      const previous = queryClient.getQueryData<Record<AllRoles, RolePermissions>>(['role-permissions']);

      if (previous) {
        const updated = { ...previous };
        updated[role] = { ...updated[role], [permissionKey]: newValue };
        queryClient.setQueryData(['role-permissions'], updated);
      }

      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast({ title: 'Permission updated' });
    },
    onError: (error: Error, _vars, context) => {
      // Rollback optimistic update on failure
      if (context?.previous) {
        queryClient.setQueryData(['role-permissions'], context.previous);
      }
      toast({ title: 'Failed to update permission', description: 'An unexpected error occurred. Please try again.', variant: 'destructive' });
    },
  });
}
