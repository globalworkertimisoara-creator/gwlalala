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

/**
 * Fetch audit log for a candidate, scoped to the user's company.
 * @param candidateId - candidate ID
 * @param companyId - optional company_id for scoping (only shows entries from this company)
 */
export function useEmployerAuditLog(candidateId: string | undefined, companyId?: string | null) {
  return useQuery({
    queryKey: ['employer-audit-log', candidateId, companyId],
    queryFn: async () => {
      if (!candidateId) return [];
      let query = supabase
        .from('employer_candidate_audit_log')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('created_at', { ascending: false })
        .limit(50);

      // Scope to company if provided — prevents cross-company audit log leakage
      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AuditLogEntry[];
    },
    enabled: !!candidateId,
  });
}
