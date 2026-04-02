import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function useClientProjects(clientId: string) {
  return useQuery({
    queryKey: ['client-projects', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_projects')
        .select('*, projects(id, name, status, employer_name, location)')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId,
  });
}

export function useLinkClientToProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, projectId, role }: { clientId: string; projectId: string; role?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('client_projects').insert({
        client_id: clientId,
        project_id: projectId,
        role: role || 'client',
      });
      if (error) throw error;

      await supabase.from('client_activity_log').insert({
        client_id: clientId,
        action: 'project_linked',
        details: { project_id: projectId },
        performed_by: user.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-projects'] });
      queryClient.invalidateQueries({ queryKey: ['client-activity'] });
      toast({ title: 'Project linked successfully' });
    },
    onError: () => {
      toast({ title: 'An unexpected error occurred. Please try again.', variant: 'destructive' });
    },
  });
}

export function useUnlinkClientFromProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, projectId }: { clientId: string; projectId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Verify the user has access to this client (defense-in-depth — RLS also enforces this)
      const { data: clientCheck } = await supabase
        .from('clients')
        .select('id')
        .eq('id', clientId)
        .single();
      if (!clientCheck) throw new Error('Client not found or access denied');

      const { error } = await supabase
        .from('client_projects')
        .delete()
        .eq('client_id', clientId)
        .eq('project_id', projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-projects'] });
      toast({ title: 'Project unlinked' });
    },
    onError: () => {
      toast({ title: 'An unexpected error occurred. Please try again.', variant: 'destructive' });
    },
  });
}
