import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ActivityLog, ActivityAction } from '@/types/assignments';

// Hook to get activity log for a project
export function useProjectActivityLog(projectId: string | undefined) {
  return useQuery({
    queryKey: ['activity-log', 'project', projectId],
    queryFn: async (): Promise<ActivityLog[]> => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('activity_log')
        .select(`
          *,
          profile:profiles!activity_log_actor_id_fkey(id, full_name)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []) as unknown as ActivityLog[];
    },
    enabled: !!projectId,
  });
}

// Hook to get activity log for a job
export function useJobActivityLog(jobId: string | undefined) {
  return useQuery({
    queryKey: ['activity-log', 'job', jobId],
    queryFn: async (): Promise<ActivityLog[]> => {
      if (!jobId) return [];
      
      const { data, error } = await supabase
        .from('activity_log')
        .select(`
          *,
          profile:profiles!activity_log_actor_id_fkey(id, full_name)
        `)
        .eq('job_id', jobId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []) as unknown as ActivityLog[];
    },
    enabled: !!jobId,
  });
}

// Hook to get activity log for a specific entity
export function useEntityActivityLog(entityType: string, entityId: string | undefined) {
  return useQuery({
    queryKey: ['activity-log', entityType, entityId],
    queryFn: async (): Promise<ActivityLog[]> => {
      if (!entityId) return [];
      
      const { data, error } = await supabase
        .from('activity_log')
        .select(`
          *,
          profile:profiles!activity_log_actor_id_fkey(id, full_name)
        `)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []) as unknown as ActivityLog[];
    },
    enabled: !!entityId,
  });
}

// Hook to log an activity
export function useLogActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entityType,
      entityId,
      projectId,
      jobId,
      action,
      oldValue,
      newValue,
      metadata,
    }: {
      entityType: string;
      entityId: string;
      projectId?: string;
      jobId?: string;
      action: ActivityAction;
      oldValue?: Record<string, unknown>;
      newValue?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('activity_log')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          project_id: projectId || null,
          job_id: jobId || null,
          action: action as any,
          actor_id: user?.id || null,
          old_value: oldValue || null,
          new_value: newValue || null,
          metadata: metadata || null,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as ActivityLog;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      if (data.project_id) {
        queryClient.invalidateQueries({ queryKey: ['activity-log', 'project', data.project_id] });
      }
      if (data.job_id) {
        queryClient.invalidateQueries({ queryKey: ['activity-log', 'job', data.job_id] });
      }
      queryClient.invalidateQueries({ queryKey: ['activity-log', data.entity_type, data.entity_id] });
    },
  });
}
