import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AuditLogEntry {
  id: string;
  candidate_id: string;
  company_id: string;
  user_id: string;
  action_type: string;
  details: Record<string, any> | null;
  created_at: string;
}

export function useLogEmployerAction() {
  return useMutation({
    mutationFn: async (input: {
      candidate_id: string;
      company_id: string;
      action_type: string;
      details?: Record<string, any>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from('employer_candidate_audit_log')
        .insert({
          candidate_id: input.candidate_id,
          company_id: input.company_id,
          user_id: user.id,
          action_type: input.action_type,
          details: input.details || null,
        });
      if (error) throw error;
    },
  });
}

export function useEmployerAuditLog(candidateId: string | undefined) {
  return useQuery({
    queryKey: ['employer-audit-log', candidateId],
    queryFn: async () => {
      if (!candidateId) return [];
      const { data, error } = await supabase
        .from('employer_candidate_audit_log')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as AuditLogEntry[];
    },
    enabled: !!candidateId,
  });
}
