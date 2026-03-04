import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StaffProfile {
  user_id: string;
  full_name: string | null;
}

export function useStaffProfiles() {
  return useQuery({
    queryKey: ['staff-profiles'],
    queryFn: async () => {
      // Get all internal staff user IDs (non-agency, non-employer roles)
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .not('role', 'in', '(agency,employer)');

      if (roleError) throw roleError;

      const userIds = (roleData ?? []).map((r: any) => r.user_id);
      if (userIds.length === 0) return [];

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      if (profileError) throw profileError;
      return (profiles ?? []) as StaffProfile[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
