import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Team {
  id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  is_lead: boolean;
  joined_at: string;
  profile?: {
    full_name: string | null;
  };
  user_role?: {
    role: string;
  };
}

export interface TeamWithMembers extends Team {
  members: TeamMember[];
}

export function useTeams() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const teamsQuery = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Team[];
    },
    enabled: !!user,
  });

  const teamMembersQuery = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data: members, error: membersError } = await supabase
        .from('team_members')
        .select('*');
      if (membersError) throw membersError;
      return members as TeamMember[];
    },
    enabled: !!user,
  });

  const teamsWithMembers = useQuery({
    queryKey: ['teams-with-members'],
    queryFn: async () => {
      // Get teams
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .order('name');
      
      if (teamsError) throw teamsError;

      // Get all team members with profiles
      const { data: members, error: membersError } = await supabase
        .from('team_members')
        .select('*');
      
      if (membersError) throw membersError;

      // Get profiles for members
      const userIds = [...new Set(members.map(m => m.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      // Combine data
      const enrichedMembers = members.map(member => ({
        ...member,
        profile: profiles?.find(p => p.user_id === member.user_id),
        user_role: roles?.find(r => r.user_id === member.user_id),
      }));

      return teams.map(team => ({
        ...team,
        members: enrichedMembers.filter(m => m.team_id === team.id),
      })) as TeamWithMembers[];
    },
    enabled: !!user,
  });

  const createTeam = useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      const { data, error } = await supabase
        .from('teams')
        .insert({ name, description, created_by: user?.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['teams-with-members'] });
      toast.success('Team created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create team: ' + error.message);
    },
  });

  const deleteTeam = useMutation({
    mutationFn: async (teamId: string) => {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['teams-with-members'] });
      toast.success('Team deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete team: ' + error.message);
    },
  });

  const addTeamMember = useMutation({
    mutationFn: async ({ teamId, userId, isLead = false }: { teamId: string; userId: string; isLead?: boolean }) => {
      const { data, error } = await supabase
        .from('team_members')
        .insert({ team_id: teamId, user_id: userId, is_lead: isLead })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      queryClient.invalidateQueries({ queryKey: ['teams-with-members'] });
      toast.success('Member added to team');
    },
    onError: (error) => {
      toast.error('Failed to add member: ' + error.message);
    },
  });

  const removeTeamMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      queryClient.invalidateQueries({ queryKey: ['teams-with-members'] });
      toast.success('Member removed from team');
    },
    onError: (error) => {
      toast.error('Failed to remove member: ' + error.message);
    },
  });

  return {
    teams: teamsQuery.data ?? [],
    teamsWithMembers: teamsWithMembers.data ?? [],
    teamMembers: teamMembersQuery.data ?? [],
    isLoading: teamsQuery.isLoading || teamsWithMembers.isLoading,
    createTeam,
    deleteTeam,
    addTeamMember,
    removeTeamMember,
  };
}
