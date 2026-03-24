import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  useAgencyProfile,
  useCreateAgencyProfile,
  useUpdateAgencyProfile,
  useAgencyWorkers
} from '@/hooks/useAgency';
import { AgencyProfileForm } from '@/components/agency/AgencyProfileForm';
import { SubmitWorkerDialog } from '@/components/agency/SubmitWorkerDialog';
import TeamManagement from '@/components/agency/TeamManagement';
import { AgencyJobsList } from '@/components/agency/AgencyJobsList';
import { AgencyProjectsView } from '@/components/agency/AgencyProjectsView';
import { AgencyBillingView } from '@/components/agency/AgencyBillingView';
import AgencyOverviewCards from '@/components/analytics/agency/AgencyOverviewCards';
import AgencyPipelineView from '@/components/analytics/agency/AgencyPipelineView';
import AgencyAnalyticsProjectsView from '@/components/analytics/agency/AgencyProjectsView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Building2, Users, Briefcase, Settings, Loader2, UserPlus, FileText,
  LogOut, Receipt, ArrowLeft, Eye, FolderOpen, BarChart3,
} from 'lucide-react';
import { getStageLabel, getStageColor } from '@/types/database';
import { CreateAgencyProfileInput } from '@/types/agency';
import { format } from 'date-fns';
import {
  useAgencyTeamMembers,
  useAgencyTeamInvitations,
  useSendAgencyInvitation,
  useCancelAgencyInvitation,
} from '@/hooks/useAgencyTeam';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { PERMISSIONS_BY_ROLE, type AgencyRole } from '@/config/permissions';
import { DashboardDetailPanel, type DashboardDetailItem } from '@/components/dashboard/DashboardDetailPanel';

const AGENCY_ROLES: { value: AgencyRole; label: string }[] = [
  { value: 'agency_owner', label: 'Agency Owner' },
  { value: 'agency_recruiter', label: 'Agency Recruiter' },
  { value: 'agency_document_staff', label: 'Agency Doc Staff' },
  { value: 'agency_viewer', label: 'Agency Viewer' },
];

export default function AgencyDashboard() {
  const { user, signOut, isAdmin, isRealAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [adminPreviewAgencyId, setAdminPreviewAgencyId] = useState<string | null>(null);
  const [agencyRolePreview, setAgencyRolePreview] = useState<AgencyRole>('agency_owner');
  const [detailItem, setDetailItem] = useState<DashboardDetailItem | null>(null);

  const effectiveIsAdmin = isRealAdmin;

  // For admin preview: fetch all agencies
  const { data: allAgencies = [] } = useQuery({
    queryKey: ['all-agencies-for-preview'],
    queryFn: async () => {
      const { data } = await supabase.from('agency_profiles').select('id, company_name, country').order('company_name');
      return data || [];
    },
    enabled: effectiveIsAdmin,
  });

  // For admin preview: fetch selected agency's profile
  const { data: previewAgencyProfile } = useQuery({
    queryKey: ['preview-agency-profile', adminPreviewAgencyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('agency_profiles')
        .select('*')
        .eq('id', adminPreviewAgencyId!)
        .single();
      return data;
    },
    enabled: effectiveIsAdmin && !!adminPreviewAgencyId,
  });

  const { data: profile, isLoading: profileLoading } = useAgencyProfile();

  const activeProfile = effectiveIsAdmin ? previewAgencyProfile : profile;
  const activeAgencyId = effectiveIsAdmin ? adminPreviewAgencyId : profile?.id;

  const { data: workers, isLoading: workersLoading } = useAgencyWorkers(activeAgencyId || undefined);
  const createProfile = useCreateAgencyProfile();
  const updateProfile = useUpdateAgencyProfile();

  const { data: teamMembers = [] } = useAgencyTeamMembers(activeAgencyId || undefined);
  const { data: invitations = [] } = useAgencyTeamInvitations(activeAgencyId || undefined);
  const sendInvitation = useSendAgencyInvitation();
  const cancelInvitation = useCancelAgencyInvitation();

  const handleCreateProfile = async (data: CreateAgencyProfileInput) => {
    await createProfile.mutateAsync(data);
  };

  const handleUpdateProfile = async (data: CreateAgencyProfileInput) => {
    if (!activeProfile) return;
    await updateProfile.mutateAsync({ id: activeProfile.id, ...data });
    setActiveTab('dashboard');
  };

  const handleWorkerSubmitted = (workerId: string) => {
    navigate(`/agency/workers/${workerId}`);
  };

  const handleInvite = async (email: string, role: any) => {
    if (!activeProfile) return;
    await sendInvitation.mutateAsync({ agencyId: activeProfile.id, email, role });
  };

  const handleCancelInvitation = async (invitationId: string) => {
    await cancelInvitation.mutateAsync(invitationId);
  };

  const previewPerms = effectiveIsAdmin ? PERMISSIONS_BY_ROLE[agencyRolePreview] : null;
  const isOwner = effectiveIsAdmin
    ? agencyRolePreview === 'agency_owner'
    : teamMembers.some((m) => m.id === user?.id && m.agencyTeamRole === 'agency_owner') || teamMembers.length === 0;

  const canSubmitWorkers = effectiveIsAdmin
    ? previewPerms?.createCandidates ?? false
    : isOwner || teamMembers.some((m) => m.id === user?.id && (m.agencyTeamRole === 'agency_owner' || m.agencyTeamRole === 'agency_recruiter'));

  const canViewProjects = effectiveIsAdmin
    ? previewPerms?.viewAllProjects ?? false
    : true;

  const canUploadDocs = effectiveIsAdmin
    ? previewPerms?.uploadDocuments ?? false
    : true;

  // Admin preview: show agency picker if no agency selected
  if (effectiveIsAdmin && !adminPreviewAgencyId) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Eye className="h-6 w-6 text-amber-700" />
              </div>
              <div>
                <h1 className="font-semibold">Agency Owner Preview</h1>
                <p className="text-sm text-muted-foreground">Select an agency to view their portal</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <CardTitle>Select Agency</CardTitle>
              <CardDescription>Choose an agency to preview their dashboard as they would see it</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select onValueChange={(val) => setAdminPreviewAgencyId(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an agency..." />
                </SelectTrigger>
                <SelectContent>
                  {allAgencies.map((a: any) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.company_name} — {a.country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {allAgencies.length === 0 && (
                <p className="text-sm text-muted-foreground text-center">No agencies registered yet</p>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (profileLoading && !effectiveIsAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!activeProfile) {
    if (effectiveIsAdmin) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center space-y-4">
              <p className="text-muted-foreground">Agency profile not found.</p>
              <Button variant="outline" onClick={() => setAdminPreviewAgencyId(null)}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Pick Another Agency
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <AgencyProfileForm
            onSubmit={handleCreateProfile}
            isLoading={createProfile.isPending}
          />
        </div>
      </div>
    );
  }

  const totalWorkers = workers?.length || 0;
  const placedWorkers = workers?.filter(w => w.current_stage === 'placed').length || 0;
  const inProgressWorkers = workers?.filter(w =>
    !['placed', 'closed_not_placed'].includes(w.current_stage)
  ).length || 0;

  return (
    <div className="h-[calc(100vh-64px)] flex overflow-hidden bg-background">
      {/* Main content */}
      <div className={`flex-1 overflow-y-auto transition-all duration-200 ${detailItem ? 'w-[65%]' : 'w-full'}`}>
        {/* Admin Preview Banner */}
        {effectiveIsAdmin && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-amber-800">
                <Eye className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">
                  Admin Preview — <strong>{activeProfile.company_name}</strong>
                </span>
              </div>
              <Select value={agencyRolePreview} onValueChange={(v) => setAgencyRolePreview(v as AgencyRole)}>
                <SelectTrigger className="w-[160px] h-6 text-[11px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AGENCY_ROLES.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-6 text-xs text-amber-700 hover:text-amber-900" onClick={() => setAdminPreviewAgencyId(null)}>
                Switch Agency
              </Button>
              <Button variant="outline" size="sm" className="h-6 text-xs text-amber-700 border-amber-300" onClick={() => navigate('/')}>
                <ArrowLeft className="h-3 w-3 mr-1" />
                Back to Admin
              </Button>
            </div>
          </div>
        )}

        {/* Header with stat chips + Submit Worker */}
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">{activeProfile.company_name}</h1>
                <p className="text-xs text-muted-foreground">{activeProfile.country}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Stat chips */}
              <div className="hidden md:flex items-center gap-3">
                <button
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                  onClick={() => setDetailItem({
                    type: 'list',
                    title: `Submissions (${totalWorkers})`,
                    backLabel: 'Agency Dashboard',
                    listItems: (workers || []).map(w => ({
                      id: w.id,
                      title: w.full_name,
                      subtitle: w.email,
                      badge: getStageLabel(w.current_stage),
                      badgeColor: getStageColor(w.current_stage),
                      route: `/agency/workers/${w.id}`,
                    })),
                  })}
                >
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-lg font-bold">{totalWorkers}</span>
                  <span className="text-xs text-muted-foreground">Submissions</span>
                </button>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50">
                  <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-lg font-bold">{inProgressWorkers}</span>
                  <span className="text-xs text-muted-foreground">In Progress</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-lg font-bold">{placedWorkers}</span>
                  <span className="text-xs text-muted-foreground">Placed</span>
                </div>
              </div>
              {/* Quick action */}
              {canSubmitWorkers && (
                <SubmitWorkerDialog
                  agencyId={activeProfile.id}
                  onSuccess={handleWorkerSubmitted}
                  trigger={
                    <Button size="sm">
                      <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                      Submit Worker
                    </Button>
                  }
                />
              )}
              {!effectiveIsAdmin && (
                <Button variant="ghost" size="sm" onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              )}
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              {canViewProjects && (
                <TabsTrigger value="projects">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Projects
                </TabsTrigger>
              )}
              <TabsTrigger value="jobs">
                <Briefcase className="h-4 w-4 mr-2" />
                Available Jobs
              </TabsTrigger>
              {isOwner && (
                <TabsTrigger value="billing">
                  <Receipt className="h-4 w-4 mr-2" />
                  Billing
                </TabsTrigger>
              )}
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="h-4 w-4 mr-2" />
                My Analytics
              </TabsTrigger>
              {isOwner && (
                <TabsTrigger value="team">
                  <Users className="h-4 w-4 mr-2" />
                  Team
                </TabsTrigger>
              )}
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              {/* Workers Table */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Submitted Workers
                    <Badge variant="outline" className="text-[10px] ml-1">{totalWorkers}</Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Click any worker to view details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {workersLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : workers?.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No workers submitted yet</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Start by submitting a worker for an open position
                      </p>
                      <SubmitWorkerDialog
                        agencyId={activeProfile.id}
                        onSuccess={handleWorkerSubmitted}
                      />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Worker</TableHead>
                          <TableHead>Job</TableHead>
                          <TableHead>Nationality</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Submitted</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {workers?.map((worker) => (
                          <TableRow
                            key={worker.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setDetailItem({
                              type: 'worker',
                              id: worker.id,
                              title: worker.full_name,
                              subtitle: worker.email,
                              backLabel: 'Submitted Workers',
                              data: {
                                full_name: worker.full_name,
                                email: worker.email,
                                nationality: worker.nationality,
                                current_stage: worker.current_stage,
                                job_title: worker.job?.title,
                                job_company: worker.job?.client_company,
                                submitted_at: worker.submitted_at,
                              },
                            })}
                          >
                            <TableCell>
                              <div>
                                <p className="font-medium">{worker.full_name}</p>
                                <p className="text-sm text-muted-foreground">{worker.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {worker.job ? (
                                <div>
                                  <p className="font-medium">{worker.job.title}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {worker.job.client_company}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>{worker.nationality}</TableCell>
                            <TableCell>
                              <Badge className={getStageColor(worker.current_stage)}>
                                {getStageLabel(worker.current_stage)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {format(new Date(worker.submitted_at), 'MMM d, yyyy')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects">
              <AgencyProjectsView agencyId={activeProfile.id} />
            </TabsContent>

            {/* Jobs Tab */}
            <TabsContent value="jobs">
              <AgencyJobsList agencyId={activeProfile.id} />
            </TabsContent>

            {/* Billing Tab */}
            {isOwner && (
              <TabsContent value="billing">
                <AgencyBillingView agencyId={activeProfile.id} />
              </TabsContent>
            )}

            {/* Settings Tab */}
            <TabsContent value="settings">
              <div className="max-w-4xl">
                <AgencyProfileForm
                  existingProfile={activeProfile}
                  onSubmit={handleUpdateProfile}
                  isLoading={updateProfile.isPending}
                />
              </div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-8">
              <AgencyOverviewCards agencyId={activeAgencyId || undefined} />
              <Tabs defaultValue="pipeline" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="pipeline">My Pipeline</TabsTrigger>
                  <TabsTrigger value="my-projects">My Projects</TabsTrigger>
                </TabsList>
                <TabsContent value="pipeline">
                  <AgencyPipelineView agencyId={activeAgencyId || undefined} />
                </TabsContent>
                <TabsContent value="my-projects">
                  <AgencyAnalyticsProjectsView agencyId={activeAgencyId || undefined} />
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* Team Tab */}
            {isOwner && (
              <TabsContent value="team">
                <TeamManagement
                  teamMembers={teamMembers}
                  invitations={invitations}
                  onInvite={handleInvite}
                  onCancelInvitation={handleCancelInvitation}
                  isOwner={isOwner}
                />
              </TabsContent>
            )}
          </Tabs>
        </main>
      </div>

      {/* Detail Panel */}
      {detailItem && (
        <div className="w-[35%] shrink-0">
          <DashboardDetailPanel item={detailItem} onClose={() => setDetailItem(null)} />
        </div>
      )}
    </div>
  );
}
