import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ContractActivityEntry {
  id: string;
  contract_id: string;
  actor_id: string;
  action: string;
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  summary: string;
  details: Record<string, any> | null;
  created_at: string;
  actor_name?: string | null;
}

export function useContractActivityLog(contractId: string | undefined) {
  return useQuery({
    queryKey: ['contract-activity-log', contractId],
    queryFn: async (): Promise<ContractActivityEntry[]> => {
      if (!contractId) return [];

      const { data, error } = await supabase
        .from('contract_activity_log')
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Batch fetch actor names
      const actorIds = [...new Set(data.map((e: any) => e.actor_id).filter(Boolean))];
      let profileMap: Record<string, string> = {};
      if (actorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', actorIds);
        profileMap = Object.fromEntries((profiles || []).map(p => [p.user_id, p.full_name || '']));
      }

      return data.map((e: any) => ({
        ...e,
        actor_name: e.actor_id ? profileMap[e.actor_id] || null : null,
      })) as ContractActivityEntry[];
    },
    enabled: !!contractId,
  });
}

export function useLogContractActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      contract_id: string;
      action: string;
      summary: string;
      field_changed?: string;
      old_value?: string;
      new_value?: string;
      details?: Record<string, any>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('contract_activity_log')
        .insert({
          contract_id: input.contract_id,
          actor_id: user.id,
          action: input.action,
          summary: input.summary,
          field_changed: input.field_changed || null,
          old_value: input.old_value || null,
          new_value: input.new_value || null,
          details: input.details || null,
        } as any);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['contract-activity-log', variables.contract_id],
      });
    },
  });
}
