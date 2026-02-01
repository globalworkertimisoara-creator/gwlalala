import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Escalation, CreateEscalationInput, EscalationStatus } from '@/types/assignments';

// Hook to get escalations for a project
export function useProjectEscalations(projectId: string | undefined) {
  return useQuery({
    queryKey: ['escalations', 'project', projectId],
    queryFn: async (): Promise<Escalation[]> => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('escalations')
        .select(`
          *,
          escalated_by_profile:profiles!escalations_escalated_by_fkey(id, full_name),
          escalated_to_profile:profiles!escalations_escalated_to_user_id_fkey(id, full_name),
          job:jobs(id, title)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as Escalation[];
    },
    enabled: !!projectId,
  });
}

// Hook to get escalations for a job
export function useJobEscalations(jobId: string | undefined) {
  return useQuery({
    queryKey: ['escalations', 'job', jobId],
    queryFn: async (): Promise<Escalation[]> => {
      if (!jobId) return [];
      
      const { data, error } = await supabase
        .from('escalations')
        .select(`
          *,
          escalated_by_profile:profiles!escalations_escalated_by_fkey(id, full_name),
          escalated_to_profile:profiles!escalations_escalated_to_user_id_fkey(id, full_name),
          project:projects(id, name)
        `)
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as Escalation[];
    },
    enabled: !!jobId,
  });
}

// Hook to get all open/in-progress escalations for a user (escalated to them)
export function useMyEscalations() {
  return useQuery({
    queryKey: ['my-escalations'],
    queryFn: async (): Promise<Escalation[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get user's role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      const userRole = roleData?.role;

      let query = supabase
        .from('escalations')
        .select(`
          *,
          escalated_by_profile:profiles!escalations_escalated_by_fkey(id, full_name),
          project:projects(id, name),
          job:jobs(id, title)
        `)
        .in('status', ['open', 'acknowledged', 'in_progress'])
        .order('created_at', { ascending: false });

      // Filter by escalated_to_user_id or escalated_to_role
      const { data, error } = await query;

      if (error) throw error;

      // Filter client-side for user or role match
      return ((data || []) as unknown as Escalation[]).filter(escalation => 
        escalation.escalated_to_user_id === user.id ||
        escalation.escalated_to_role === userRole
      );
    },
  });
}

// Hook to get all escalations (for admins/managers)
export function useAllEscalations(filters?: {
  status?: EscalationStatus;
  priority?: string;
}) {
  return useQuery({
    queryKey: ['all-escalations', filters],
    queryFn: async (): Promise<Escalation[]> => {
      let query = supabase
        .from('escalations')
        .select(`
          *,
          escalated_by_profile:profiles!escalations_escalated_by_fkey(id, full_name),
          escalated_to_profile:profiles!escalations_escalated_to_user_id_fkey(id, full_name),
          project:projects(id, name),
          job:jobs(id, title)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as unknown as Escalation[];
    },
  });
}

// Hook to create an escalation
export function useCreateEscalation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateEscalationInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('escalations')
        .insert({
          project_id: input.project_id || null,
          job_id: input.job_id || null,
          candidate_id: input.candidate_id || null,
          title: input.title,
          description: input.description,
          priority: input.priority || 'medium',
          escalated_by: user?.id || null,
          escalated_to_role: input.escalated_to_role as any || null,
          escalated_to_user_id: input.escalated_to_user_id || null,
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Create notification for escalated user/role
      if (input.escalated_to_user_id) {
        await supabase.from('notifications').insert({
          user_id: input.escalated_to_user_id,
          title: 'New Escalation',
          message: `You have been assigned an escalation: ${input.title}`,
          type: 'escalation',
          related_entity_type: 'escalation',
          related_entity_id: data.id,
        });
      }

      return data as unknown as Escalation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['escalations'] });
      queryClient.invalidateQueries({ queryKey: ['my-escalations'] });
      queryClient.invalidateQueries({ queryKey: ['all-escalations'] });
      if (data.project_id) {
        queryClient.invalidateQueries({ queryKey: ['escalations', 'project', data.project_id] });
      }
      if (data.job_id) {
        queryClient.invalidateQueries({ queryKey: ['escalations', 'job', data.job_id] });
      }
      toast({ title: 'Escalation created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create escalation', description: error.message, variant: 'destructive' });
    },
  });
}

// Hook to update escalation status
export function useUpdateEscalation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status, resolution_notes }: { id: string; status: EscalationStatus; resolution_notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updates: Record<string, unknown> = { status };

      if (status === 'acknowledged') {
        updates.acknowledged_by = user?.id;
        updates.acknowledged_at = new Date().toISOString();
      } else if (status === 'resolved' || status === 'closed') {
        updates.resolved_by = user?.id;
        updates.resolved_at = new Date().toISOString();
        if (resolution_notes) {
          updates.resolution_notes = resolution_notes;
        }
      }

      const { data, error } = await supabase
        .from('escalations')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Escalation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['escalations'] });
      queryClient.invalidateQueries({ queryKey: ['my-escalations'] });
      queryClient.invalidateQueries({ queryKey: ['all-escalations'] });
      if (data.project_id) {
        queryClient.invalidateQueries({ queryKey: ['escalations', 'project', data.project_id] });
      }
      if (data.job_id) {
        queryClient.invalidateQueries({ queryKey: ['escalations', 'job', data.job_id] });
      }
      toast({ title: 'Escalation updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update escalation', description: error.message, variant: 'destructive' });
    },
  });
}
