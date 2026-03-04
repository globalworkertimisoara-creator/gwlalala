import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StageHistory } from '@/types/database';

export type StageHistoryWithActor = StageHistory & { changed_by_name: string | null };

export function useStageHistory(candidateId: string | undefined) {
  return useQuery({
    queryKey: ['stage-history', candidateId],
    queryFn: async (): Promise<StageHistoryWithActor[]> => {
      if (!candidateId) return [];

      const { data, error } = await supabase
        .from('stage_history')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('changed_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Batch fetch actor names
      const userIds = [...new Set(data.map(e => e.changed_by).filter(Boolean))] as string[];
      let profileMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds);
        profileMap = Object.fromEntries((profiles || []).map(p => [p.user_id, p.full_name || '']));
      }

      return data.map(e => ({
        ...e,
        changed_by_name: e.changed_by ? profileMap[e.changed_by] || null : null,
      })) as StageHistoryWithActor[];
    },
    enabled: !!candidateId,
  });
}
