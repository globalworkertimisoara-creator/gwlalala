/**
 * src/hooks/useAgencyTeam.ts
 *
 * React hooks for managing agency team members.
 * Adapted to work with existing schema: agency_profiles, user_roles, profiles tables.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type AgencyTeamRole =
  | 'agency_owner'
  | 'agency_recruiter'
  | 'agency_document_staff'
  | 'agency_viewer';

// ─── Fetch Team Members ───────────────────────────────────────────────────────

export function useAgencyTeamMembers(agencyId?: string) {
  return useQuery({
    queryKey: ['agency-team-members', agencyId],
    queryFn: async () => {
      if (!agencyId) return [];

      // Get the agency profile to find the user_id (owner)
      const { data: agencyProfile } = await supabase
        .from('agency_profiles')
        .select('user_id')
        .eq('id', agencyId)
        .single();

      if (!agencyProfile) return [];

      // Get all agency users - for now the owner is the only member
      // In the future, agency_team_invitations accepted users will also appear
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, agency_team_role, created_at, updated_at')
        .eq('user_id', agencyProfile.user_id);

      if (error) throw error;

      // Also get email from auth (via the agency profile)
      const { data: ap } = await supabase
        .from('agency_profiles')
        .select('email')
        .eq('id', agencyId)
        .single();

      return (profiles || []).map((p) => ({
        id: p.user_id,
        fullName: p.full_name || 'Unknown',
        email: ap?.email || '',
        agencyTeamRole: (p.agency_team_role as AgencyTeamRole) || 'agency_owner',
        createdAt: p.created_at,
      }));
    },
    enabled: !!agencyId,
  });
}

// ─── Fetch Invitations ────────────────────────────────────────────────────────

export function useAgencyTeamInvitations(agencyId?: string) {
  return useQuery({
    queryKey: ['agency-team-invitations', agencyId],
    queryFn: async () => {
      if (!agencyId) return [];

      const { data, error } = await supabase
        .from('agency_team_invitations')
        .select('*')
        .eq('agency_id', agencyId)
        .order('invited_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((inv: any) => ({
        id: inv.id,
        email: inv.email,
        invitedRole: inv.invited_role as AgencyTeamRole,
        status: inv.status as 'pending' | 'accepted' | 'expired' | 'cancelled',
        invitedAt: inv.invited_at,
        expiresAt: inv.expires_at,
      }));
    },
    enabled: !!agencyId,
  });
}

// ─── Send Invitation ──────────────────────────────────────────────────────────

export function useSendAgencyInvitation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      agencyId,
      email,
      role,
    }: {
      agencyId: string;
      email: string;
      role: AgencyTeamRole;
    }) => {
      // Check if invitation already exists
      const { data: existingInvite } = await supabase
        .from('agency_team_invitations')
        .select('id')
        .eq('agency_id', agencyId)
        .eq('email', email)
        .eq('status', 'pending')
        .maybeSingle();

      if (existingInvite) {
        throw new Error('An invitation for this email already exists');
      }

      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('agency_team_invitations')
        .insert({
          agency_id: agencyId,
          email,
          invited_role: role,
          invited_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agency-team-invitations', variables.agencyId] });
      toast({ title: 'Invitation sent successfully' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to send invitation',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

// ─── Cancel Invitation ────────────────────────────────────────────────────────

export function useCancelAgencyInvitation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('agency_team_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-team-invitations'] });
      toast({ title: 'Invitation cancelled' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to cancel invitation',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

// ─── Accept Invitation ────────────────────────────────────────────────────────

export function useAcceptInvitation() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (token: string) => {
      const { data: invitation, error: inviteError } = await supabase
        .from('agency_team_invitations')
        .select(`
          *,
          agency_profiles(id, company_name, country)
        `)
        .eq('token', token)
        .eq('status', 'pending')
        .single();

      if (inviteError || !invitation) {
        throw new Error('Invalid or expired invitation');
      }

      if (new Date((invitation as any).expires_at) < new Date()) {
        throw new Error('Invitation has expired');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update user profile with agency team role
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          agency_team_role: (invitation as any).invited_role,
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Mark invitation as accepted
      const { error: updateError } = await supabase
        .from('agency_team_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', (invitation as any).id);

      if (updateError) throw updateError;

      return invitation;
    },
    onSuccess: () => {
      toast({
        title: 'Invitation accepted',
        description: 'You are now part of the agency team',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to accept invitation',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    },
  });
}
