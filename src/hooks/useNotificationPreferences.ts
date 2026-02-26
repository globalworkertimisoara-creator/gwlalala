import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const NOTIFICATION_TYPES = [
  { value: 'document_expiry', label: 'Document Expiry Alerts' },
  { value: 'task_deadline', label: 'Task Deadline Reminders' },
  { value: 'stage_change', label: 'Stage Change Notifications' },
  { value: 'contract_renewal', label: 'Contract Renewal Reminders' },
  { value: 'workflow_stall', label: 'Stalled Workflow Alerts' },
] as const;

export function useNotificationPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const upsert = useMutation({
    mutationFn: async (params: { notification_type: string; in_app: boolean; email: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          notification_type: params.notification_type,
          in_app: params.in_app,
          email: params.email,
        }, { onConflict: 'user_id,notification_type' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast({ title: 'Preferences Updated' });
    },
  });

  return { preferences: query.data || [], isLoading: query.isLoading, upsert, NOTIFICATION_TYPES };
}
