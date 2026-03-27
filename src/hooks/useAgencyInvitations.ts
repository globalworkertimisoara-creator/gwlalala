import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AgencyJobInvitation } from '@/types/project';
import { useToast } from '@/hooks/use-toast';
import { useAgencyProfile } from '@/hooks/useAgency';

export function useAgencyInvitations(jobId?: string) {
  return useQuery({
    queryKey: ['agency-invitations', jobId],
    queryFn: async () => {
      let query = supabase
        .from('agency_job_invitations')
        .select(`
          *,
          agency_profiles(id, company_name, country)
        `);

      if (jobId) {
        query = query.eq('job_id', jobId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

/**
 * Fetch jobs the current agency has been invited to.
 * Scoped to the agency's own invitations — not all agencies.
 */
export function useInvitedJobs() {
  const { data: agencyProfile } = useAgencyProfile();
  const agencyId = agencyProfile?.id;

  return useQuery({
    queryKey: ['invited-jobs', agencyId],
    queryFn: async () => {
      if (!agencyId) return [];
      // Only fetch jobs where THIS agency has an invitation
      const { data: invitations, error: invErr } = await supabase
        .from('agency_job_invitations')
        .select('job_id')
        .eq('agency_id', agencyId);

      if (invErr) throw invErr;
      if (!invitations || invitations.length === 0) return [];

      const jobIds = invitations.map(inv => inv.job_id);

      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .in('id', jobIds)
        .eq('status', 'open');

      if (error) throw error;
      return data || [];
    },
    enabled: !!agencyId,
  });
}

export function useCreateInvitation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ agencyId, jobId }: { agencyId: string; jobId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('agency_job_invitations')
        .insert({
          agency_id: agencyId,
          job_id: jobId,
          invited_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-invitations'] });
      toast({ title: 'Agency invited to job' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error inviting agency', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteInvitation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('agency_job_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-invitations'] });
      toast({ title: 'Invitation removed' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error removing invitation', description: error.message, variant: 'destructive' });
    },
  });
}
