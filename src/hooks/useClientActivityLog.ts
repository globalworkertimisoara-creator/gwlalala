import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useClientActivityLog(clientId: string) {
  return useQuery({
    queryKey: ['client-activity', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_activity_log')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId,
  });
}

export function useLogClientActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, action, details }: { clientId: string; action: string; details?: Record<string, any> }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('client_activity_log').insert({
        client_id: clientId,
        action,
        details: details || null,
        performed_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-activity'] });
    },
  });
}
