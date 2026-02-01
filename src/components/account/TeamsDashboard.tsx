import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useTeams, TeamWithMembers } from '@/hooks/useTeams';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getRoleLabel, AppRole } from '@/types/database';
import { Users, Plus, Trash2, UserPlus, Crown, Network } from 'lucide-react';

export function TeamsDashboard() {
  const { canManageAssignments, isAdmin } = useAuth();
  const { teamsWithMembers, isLoading, createTeam, deleteTeam, addTeamMember, removeTeamMember } = useTeams();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isTeamLead, setIsTeamLead] = useState(false);

  // Fetch all users for adding to teams
  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users-for-teams'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name');
      
      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .neq('role', 'agency');
      
      if (rolesError) throw rolesError;

      return profiles
        .filter(p => roles.some(r => r.user_id === p.user_id))
        .map(p => ({
          ...p,
          role: roles.find(r => r.user_id === p.user_id)?.role as AppRole,
        }));
    },
  });

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    
    await createTeam.mutateAsync({
      name: newTeamName,
      description: newTeamDescription || undefined,
    });
    
    setNewTeamName('');
    setNewTeamDescription('');
    setCreateDialogOpen(false);
  };

  const handleAddMember = async () => {
    if (!selectedTeamId || !selectedUserId) return;
    
    await addTeamMember.mutateAsync({
      teamId: selectedTeamId,
      userId: selectedUserId,
      isLead: isTeamLead,
    });
    
    setSelectedUserId('');
    setIsTeamLead(false);
    setAddMemberDialogOpen(false);
    setSelectedTeamId(null);
  };

  const openAddMemberDialog = (teamId: string) => {
    setSelectedTeamId(teamId);
    setAddMemberDialogOpen(true);
  };

  const getAvailableUsers = (team: TeamWithMembers) => {
    const memberUserIds = team.members.map(m => m.user_id);
    return allUsers.filter(u => !memberUserIds.includes(u.user_id));
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Teams
            </CardTitle>
            <CardDescription>
              View and manage organizational teams
            </CardDescription>
          </div>
          {canManageAssignments && (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Create Team
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Team</DialogTitle>
                  <DialogDescription>
                    Add a new team to organize staff members
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="team-name">Team Name</Label>
                    <Input
                      id="team-name"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      placeholder="e.g., Recruitment Team A"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="team-description">Description (Optional)</Label>
                    <Textarea
                      id="team-description"
                      value={newTeamDescription}
                      onChange={(e) => setNewTeamDescription(e.target.value)}
                      placeholder="Brief description of the team's focus"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTeam} disabled={!newTeamName.trim() || createTeam.isPending}>
                    {createTeam.isPending ? 'Creating...' : 'Create Team'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {teamsWithMembers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No teams created yet</p>
            {canManageAssignments && (
              <p className="text-sm mt-1">Create a team to organize your staff</p>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {teamsWithMembers.map((team) => (
              <div
                key={team.id}
                className="border rounded-lg p-4 bg-card hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold">{team.name}</h4>
                    {team.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {team.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {canManageAssignments && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openAddMemberDialog(team.id)}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    )}
                    {isAdmin && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Team</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{team.name}"? This will remove all team members from this team.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteTeam.mutate(team.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>{team.members.length} member{team.members.length !== 1 ? 's' : ''}</span>
                  </div>

                  {team.members.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {team.members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-2 bg-accent/50 rounded-full pl-1 pr-3 py-1"
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                              {getInitials(member.profile?.full_name || null)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium">
                            {member.profile?.full_name || 'Unknown'}
                          </span>
                          {member.is_lead && (
                            <Crown className="h-3 w-3 text-primary" />
                          )}
                          {member.user_role?.role && (
                            <Badge variant="secondary" className="text-[9px] px-1 h-4 bg-muted">
                              {getRoleLabel(member.user_role.role as AppRole)}
                            </Badge>
                          )}
                          {canManageAssignments && (
                            <button
                              onClick={() => removeTeamMember.mutate(member.id)}
                              className="ml-1 text-muted-foreground hover:text-destructive"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No members yet</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Member Dialog */}
        <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
              <DialogDescription>
                Select a staff member to add to this team
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select User</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedTeamId && getAvailableUsers(teamsWithMembers.find(t => t.id === selectedTeamId)!).map((user) => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        {user.full_name || 'Unknown'} ({getRoleLabel(user.role)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is-lead"
                  checked={isTeamLead}
                  onChange={(e) => setIsTeamLead(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="is-lead" className="text-sm cursor-pointer">
                  Set as Team Lead
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddMemberDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddMember} disabled={!selectedUserId || addTeamMember.isPending}>
                {addTeamMember.isPending ? 'Adding...' : 'Add Member'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
