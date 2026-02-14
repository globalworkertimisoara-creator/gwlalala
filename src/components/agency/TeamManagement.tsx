/**
 * Team management interface for agency owners.
 * Includes invite dialog, member list, pending invitations, and permissions table.
 */

import React, { useState } from 'react';
import { Plus, Mail, UserX, Shield, Users, Eye, FileText, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AgencyTeamRole } from '@/hooks/useAgencyTeam';

interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  agencyTeamRole: AgencyTeamRole;
  createdAt: string;
}

interface Invitation {
  id: string;
  email: string;
  invitedRole: AgencyTeamRole;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  invitedAt: string;
  expiresAt: string;
}

interface TeamManagementProps {
  teamMembers: TeamMember[];
  invitations: Invitation[];
  onInvite: (email: string, role: AgencyTeamRole) => Promise<void>;
  onCancelInvitation: (invitationId: string) => Promise<void>;
  isOwner: boolean;
}

const ROLE_CONFIG: Record<AgencyTeamRole, { label: string; description: string; icon: React.ElementType; color: string }> = {
  agency_owner: {
    label: 'Owner',
    description: 'Full access to everything',
    icon: Shield,
    color: 'bg-purple-100 text-purple-700',
  },
  agency_recruiter: {
    label: 'Recruiter',
    description: 'Manage candidates and workflows',
    icon: Users,
    color: 'bg-blue-100 text-blue-700',
  },
  agency_document_staff: {
    label: 'Document Staff',
    description: 'Upload and manage documents',
    icon: FileText,
    color: 'bg-green-100 text-green-700',
  },
  agency_viewer: {
    label: 'Viewer',
    description: 'Read-only access',
    icon: Eye,
    color: 'bg-muted text-muted-foreground',
  },
};

// Permissions matrix data
const PERMISSIONS = [
  { action: 'Invite users', owner: true, recruiter: false, docStaff: false, viewer: false },
  { action: 'Remove users', owner: true, recruiter: false, docStaff: false, viewer: false },
  { action: 'Upload candidates', owner: true, recruiter: true, docStaff: false, viewer: false },
  { action: 'Upload documents', owner: true, recruiter: true, docStaff: true, viewer: false },
  { action: 'View workflows', owner: true, recruiter: true, docStaff: true, viewer: true },
  { action: 'Manage billing', owner: true, recruiter: false, docStaff: false, viewer: false },
];

function PermissionIcon({ allowed }: { allowed: boolean }) {
  return allowed ? (
    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
  ) : (
    <XCircle className="h-5 w-5 text-destructive mx-auto" />
  );
}

export default function TeamManagement({
  teamMembers,
  invitations,
  onInvite,
  onCancelInvitation,
  isOwner,
}: TeamManagementProps) {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AgencyTeamRole>('agency_recruiter');
  const [inviting, setInviting] = useState(false);
  const { toast } = useToast();

  const handleInvite = async () => {
    if (!inviteEmail || !inviteRole) {
      toast({
        title: 'Missing information',
        description: 'Please enter an email and select a role',
        variant: 'destructive',
      });
      return;
    }

    setInviting(true);
    try {
      await onInvite(inviteEmail, inviteRole);
      setInviteEmail('');
      setInviteRole('agency_recruiter');
      setInviteDialogOpen(false);
    } catch (error) {
      // Toast already shown by hook
    } finally {
      setInviting(false);
    }
  };

  const pendingInvitations = invitations.filter((inv) => inv.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Team Management</h2>
          <p className="text-muted-foreground mt-1">
            Manage your agency team members and their permissions
          </p>
        </div>
        {isOwner && (
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Invite Team Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an email invitation to join your agency team
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="invite-email">Email Address</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="invite-role">Role</Label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AgencyTeamRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ROLE_CONFIG)
                        .filter(([key]) => key !== 'agency_owner')
                        .map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex flex-col">
                              <span className="font-medium">{config.label}</span>
                              <span className="text-xs text-muted-foreground">{config.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleInvite} disabled={inviting} className="w-full">
                  {inviting ? 'Sending...' : 'Send Invitation'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members ({teamMembers.length})</CardTitle>
          <CardDescription>Active members of your agency team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {teamMembers.map((member) => {
              const roleConfig = ROLE_CONFIG[member.agencyTeamRole];
              const Icon = roleConfig.icon;

              return (
                <div
                  key={member.id}
                  className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:border-primary/20 transition-colors"
                >
                  <div className={`rounded-full p-2 ${roleConfig.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{member.fullName}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                  <Badge className={roleConfig.color}>{roleConfig.label}</Badge>
                </div>
              );
            })}
            {teamMembers.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No team members yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations ({pendingInvitations.length})</CardTitle>
            <CardDescription>Invitations waiting to be accepted</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingInvitations.map((invitation) => {
                const roleConfig = ROLE_CONFIG[invitation.invitedRole];
                const isExpired = new Date(invitation.expiresAt) < new Date();

                return (
                  <div
                    key={invitation.id}
                    className="flex items-center gap-4 p-4 rounded-lg border bg-muted/50"
                  >
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{invitation.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Invited as {roleConfig.label} •{' '}
                        {isExpired
                          ? 'Expired'
                          : `Expires ${new Date(invitation.expiresAt).toLocaleDateString()}`}
                      </p>
                    </div>
                    <Badge variant={isExpired ? 'destructive' : 'secondary'}>
                      {isExpired ? 'Expired' : 'Pending'}
                    </Badge>
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCancelInvitation(invitation.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Permissions by Role Table */}
      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>Permissions by Role</CardTitle>
            <CardDescription>Overview of what each role can do</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Action</TableHead>
                  <TableHead className="text-center">Owner</TableHead>
                  <TableHead className="text-center">Recruiter</TableHead>
                  <TableHead className="text-center">Document Staff</TableHead>
                  <TableHead className="text-center">Viewer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PERMISSIONS.map((perm) => (
                  <TableRow key={perm.action}>
                    <TableCell className="font-medium">{perm.action}</TableCell>
                    <TableCell><PermissionIcon allowed={perm.owner} /></TableCell>
                    <TableCell><PermissionIcon allowed={perm.recruiter} /></TableCell>
                    <TableCell><PermissionIcon allowed={perm.docStaff} /></TableCell>
                    <TableCell><PermissionIcon allowed={perm.viewer} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
