import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StageHistory } from '@/types/database';

export function useStageHistory(candidateId: string | undefined) {
  return useQuery({
    queryKey: ['stage-history', candidateId],
    queryFn: async () => {
      if (!candidateId) return [];

      const { data, error } = await supabase
        .from('stage_history')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('changed_at', { ascending: false });

      if (error) throw error;
      return data as StageHistory[];
    },
    enabled: !!candidateId,
  });
}
