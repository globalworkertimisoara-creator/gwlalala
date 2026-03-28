import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProjectAssignment, JobAssignment, CreateAssignmentInput } from '@/types/assignments';
import { AppRole } from '@/types/database';

// Hook to get project assignments
export function useProjectAssignments(projectId: string | undefined) {
  return useQuery({
    queryKey: ['project-assignments', projectId],
    queryFn: async (): Promise<ProjectAssignment[]> => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('project_assignments')
        .select(`
          *,
          profile:profiles!project_assignments_assigned_user_id_fkey(id, full_name)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as ProjectAssignment[];
    },
    enabled: !!projectId,
  });
}

// Hook to get job assignments
export function useJobAssignments(jobId: string | undefined) {
  return useQuery({
    queryKey: ['job-assignments', jobId],
    queryFn: async (): Promise<JobAssignment[]> => {
      if (!jobId) return [];
      
      const { data, error } = await supabase
        .from('job_assignments')
        .select(`
          *,
          profile:profiles!job_assignments_assigned_user_id_fkey(id, full_name)
        `)
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as JobAssignment[];
    },
    enabled: !!jobId,
  });
}

// Hook to create project assignment
export function useCreateProjectAssignment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ projectId, input }: { projectId: string; input: CreateAssignmentInput }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('project_assignments')
        .insert({
          project_id: projectId,
          assigned_user_id: input.assigned_user_id || null,
          assigned_role: input.assigned_role as any || null,
          assigned_by: user?.id,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-assignments', variables.projectId] });
      toast({ title: 'Assignment created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create assignment', description: 'An unexpected error occurred. Please try again.', variant: 'destructive' });
    },
  });
}

// Hook to create job assignment
export function useCreateJobAssignment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ jobId, input }: { jobId: string; input: CreateAssignmentInput }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('job_assignments')
        .insert({
          job_id: jobId,
          assigned_user_id: input.assigned_user_id || null,
          assigned_role: input.assigned_role as any || null,
          assigned_by: user?.id,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['job-assignments', variables.jobId] });
      toast({ title: 'Assignment created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create assignment', description: 'An unexpected error occurred. Please try again.', variant: 'destructive' });
    },
  });
}

// Hook to delete project assignment
export function useDeleteProjectAssignment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ assignmentId, projectId }: { assignmentId: string; projectId: string }) => {
      const { error } = await supabase
        .from('project_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-assignments', variables.projectId] });
      toast({ title: 'Assignment removed successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to remove assignment', description: 'An unexpected error occurred. Please try again.', variant: 'destructive' });
    },
  });
}

// Hook to delete job assignment
export function useDeleteJobAssignment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ assignmentId, jobId }: { assignmentId: string; jobId: string }) => {
      const { error } = await supabase
        .from('job_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['job-assignments', variables.jobId] });
      toast({ title: 'Assignment removed successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to remove assignment', description: 'An unexpected error occurred. Please try again.', variant: 'destructive' });
    },
  });
}

// Hook to get all internal users for assignment dropdown
export function useInternalUsers() {
  return useQuery({
    queryKey: ['internal-users'],
    queryFn: async () => {
      // Get all profiles with their roles (excluding agencies)
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .neq('role', 'agency');

      if (rolesError) throw rolesError;

      const userIds = roles?.map(r => r.user_id) || [];
      
      if (userIds.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, full_name')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Combine profiles with their roles
      return (profiles || []).map(profile => {
        const roleEntry = roles?.find(r => r.user_id === profile.user_id);
        return {
          id: profile.user_id,
          full_name: profile.full_name || 'Unknown User',
          role: roleEntry?.role as AppRole,
        };
      });
    },
  });
}
