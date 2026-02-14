import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CandidateActivityEntry {
  id: string;
  candidate_id: string;
  actor_id: string;
  actor_type: 'staff' | 'agency' | 'employer';
  agency_id: string | null;
  company_id: string | null;
  event_type: string;
  is_shared_event: boolean;
  summary: string;
  details: Record<string, any> | null;
  created_at: string;
  actor_name?: string;
}

export function useCandidateActivityLog(candidateId: string | undefined) {
  return useQuery({
    queryKey: ['candidate-activity-log', candidateId],
    queryFn: async (): Promise<CandidateActivityEntry[]> => {
      if (!candidateId) return [];

      const { data, error } = await supabase
        .from('candidate_activity_log')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      return (data || []) as unknown as CandidateActivityEntry[];
    },
    enabled: !!candidateId,
  });
}

export function useLogCandidateActivity() {
  const queryClient = useQueryClient();
  const { role } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      candidate_id: string;
      event_type: string;
      summary: string;
      is_shared_event?: boolean;
      agency_id?: string;
      company_id?: string;
      details?: Record<string, any>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let actorType: 'staff' | 'agency' | 'employer' = 'staff';
      if (role === 'agency') actorType = 'agency';
      else if (role === 'employer') actorType = 'employer';

      const { error } = await supabase
        .from('candidate_activity_log')
        .insert({
          candidate_id: input.candidate_id,
          actor_id: user.id,
          actor_type: actorType,
          agency_id: input.agency_id || null,
          company_id: input.company_id || null,
          event_type: input.event_type,
          is_shared_event: input.is_shared_event ?? false,
          summary: input.summary,
          details: input.details || null,
        } as any);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['candidate-activity-log', variables.candidate_id],
      });
    },
  });
}
