import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Building2, Users, FolderOpen, Loader2, LogOut, ArrowLeft, Eye, CalendarDays,
} from 'lucide-react';
import { format } from 'date-fns';
import { PERMISSIONS_BY_ROLE, type EmployerRole } from '@/config/permissions';
import { DashboardDetailPanel, type DashboardDetailItem } from '@/components/dashboard/DashboardDetailPanel';

const EMPLOYER_ROLES: { value: EmployerRole; label: string }[] = [
  { value: 'employer_admin', label: 'Employer Admin' },
  { value: 'employer_hr', label: 'Employer HR' },
  { value: 'employer_hiring_manager', label: 'Hiring Manager' },
  { value: 'employer_viewer', label: 'Employer Viewer' },
];

function safeFormatDate(dateStr: string | null | undefined, fmt: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return format(d, fmt);
  } catch {
    return '—';
  }
}

export default function EmployerDashboard() {
  const { user, signOut, isRealAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [adminPreviewCompanyId, setAdminPreviewCompanyId] = useState<string | null>(null);
  const [employerRolePreview, setEmployerRolePreview] = useState<EmployerRole>('employer_admin');
  const [detailItem, setDetailItem] = useState<DashboardDetailItem | null>(null);

  const effectiveIsAdmin = isRealAdmin;

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setDetailItem(null);
  };

  // Fetch all companies for admin preview
  const { data: allCompanies = [] } = useQuery({
    queryKey: ['all-companies-for-preview'],
    queryFn: async () => {
      const { data } = await supabase.from('companies').select('id, company_name, headquarters_country').order('company_name');
      return data || [];
    },
    enabled: effectiveIsAdmin,
  });

  // Fetch selected company details
  const { data: companyProfile } = useQuery({
    queryKey: ['preview-company-profile', adminPreviewCompanyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('companies')
        .select('*')
        .eq('id', adminPreviewCompanyId!)
        .single();
      return data;
    },
    enabled: effectiveIsAdmin && !!adminPreviewCompanyId,
  });

  // Fetch projects linked to this company
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['employer-projects', adminPreviewCompanyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('company_id', adminPreviewCompanyId!)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: effectiveIsAdmin && !!adminPreviewCompanyId,
  });

  // Stable project IDs for dependent query keys
  const projectIds = useMemo(() => projects.map(p => p.id), [projects]);

  // Fetch candidates via workflow for these projects
  const { data: candidates = [], isLoading: candidatesLoading } = useQuery({
    queryKey: ['employer-candidates', adminPreviewCompanyId, projectIds],
    queryFn: async () => {
      if (!projectIds.length) return [];
      const { data } = await supabase
        .from('candidate_workflow')
        .select('*, candidates(*)')
        .in('project_id', projectIds);
      return data || [];
    },
    enabled: effectiveIsAdmin && !!adminPreviewCompanyId && projectIds.length > 0,
  });

  // Fetch interviews for these projects
  const { data: interviews = [] } = useQuery({
    queryKey: ['employer-interviews', adminPreviewCompanyId, projectIds],
    queryFn: async () => {
      if (!projectIds.length) return [];
      const { data } = await supabase
        .from('candidate_interviews')
        .select('*, candidates(full_name, email)')
        .in('project_id', projectIds)
        .order('scheduled_date', { ascending: true });
      return data || [];
    },
    enabled: effectiveIsAdmin && !!adminPreviewCompanyId && projectIds.length > 0,
  });

  const previewPerms = effectiveIsAdmin ? PERMISSIONS_BY_ROLE[employerRolePreview] : null;
  const canViewInterviews = previewPerms?.viewInterviews ?? false;

  const upcomingInterviews = interviews.filter(i => {
    try { return new Date(i.scheduled_date) > new Date(); } catch { return false; }
  });

  // Admin: company picker
  if (effectiveIsAdmin && !adminPreviewCompanyId) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Eye className="h-6 w-6 text-amber-700" />
              </div>
              <div>
                <h1 className="font-semibold">Employer Portal Preview</h1>
                <p className="text-sm text-muted-foreground">Select a company to view their portal</p>
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
              <CardTitle>Select Company</CardTitle>
              <CardDescription>Choose a company to preview their employer dashboard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select onValueChange={(val) => setAdminPreviewCompanyId(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a company..." />
                </SelectTrigger>
                <SelectContent>
                  {allCompanies.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.company_name} — {c.headquarters_country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {allCompanies.length === 0 && (
                <p className="text-sm text-muted-foreground text-center">No companies registered yet</p>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!companyProfile && effectiveIsAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeCompany = companyProfile;

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
                  Admin Preview — <strong>{activeCompany?.company_name}</strong>
                </span>
              </div>
              <Select value={employerRolePreview} onValueChange={(v) => setEmployerRolePreview(v as EmployerRole)}>
                <SelectTrigger className="w-[160px] h-6 text-[11px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYER_ROLES.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-6 text-xs text-amber-700 hover:text-amber-900" onClick={() => { setAdminPreviewCompanyId(null); setDetailItem(null); }}>
                Switch Company
              </Button>
              <Button variant="outline" size="sm" className="h-6 text-xs text-amber-700 border-amber-300" onClick={() => navigate('/')}>
                <ArrowLeft className="h-3 w-3 mr-1" />
                Back to Admin
              </Button>
            </div>
          </div>
        )}

        {/* Header with compact stat chips */}
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">{activeCompany?.company_name}</h1>
                <p className="text-xs text-muted-foreground">{activeCompany?.headquarters_country} • {activeCompany?.industry || 'Company'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Stat chips */}
              <div className="hidden md:flex items-center gap-3">
                <button
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                  onClick={() => setDetailItem({
                    type: 'list',
                    title: `Projects (${projects.length})`,
                    backLabel: 'Employer Dashboard',
                    listItems: projects.map(p => ({
                      id: p.id,
                      title: p.name,
                      subtitle: p.location,
                      badge: p.status,
                      route: `/employer/projects/${p.id}`,
                    })),
                  })}
                >
                  <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-lg font-bold">{projects.length}</span>
                  <span className="text-xs text-muted-foreground">Projects</span>
                </button>
                <button
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                  onClick={() => setDetailItem({
                    type: 'list',
                    title: `Candidates (${candidates.length})`,
                    backLabel: 'Employer Dashboard',
                    listItems: candidates.map((cw: any) => ({
                      id: cw.candidate_id,
                      title: cw.candidates?.full_name || 'Unknown',
                      subtitle: cw.candidates?.email,
                      badge: cw.current_phase,
                      route: `/employer/candidates/${cw.candidate_id}`,
                    })),
                  })}
                >
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-lg font-bold">{candidates.length}</span>
                  <span className="text-xs text-muted-foreground">Candidates</span>
                </button>
                {canViewInterviews && (
                  <button
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                    onClick={() => setDetailItem({
                      type: 'list',
                      title: `Upcoming Interviews (${upcomingInterviews.length})`,
                      backLabel: 'Employer Dashboard',
                      listItems: upcomingInterviews.map((i: any) => ({
                        id: i.id,
                        title: i.candidates?.full_name || 'Unknown',
                        subtitle: `${i.interview_type} — ${safeFormatDate(i.scheduled_date, 'MMM d, HH:mm')}`,
                        badge: i.status,
                      })),
                    })}
                  >
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-lg font-bold">{upcomingInterviews.length}</span>
                    <span className="text-xs text-muted-foreground">Interviews</span>
                  </button>
                )}
              </div>
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
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="mb-6">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="projects">
                <FolderOpen className="h-4 w-4 mr-2" />
                Projects
              </TabsTrigger>
              <TabsTrigger value="candidates">
                <Users className="h-4 w-4 mr-2" />
                Candidates
              </TabsTrigger>
              {canViewInterviews && (
                <TabsTrigger value="interviews">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Interviews
                </TabsTrigger>
              )}
              <TabsTrigger value="company">
                <Building2 className="h-4 w-4 mr-2" />
                Company
              </TabsTrigger>
            </TabsList>

            {/* Dashboard */}
            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Recent Projects */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
                      Recent Projects
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="max-h-[240px]">
                      <div className="space-y-1.5">
                        {projects.slice(0, 6).map((project) => (
                          <div
                            key={project.id}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => setDetailItem({
                              type: 'project',
                              id: project.id,
                              title: project.name,
                              subtitle: project.location,
                              backLabel: 'Recent Projects',
                              route: `/employer/projects/${project.id}`,
                              data: project,
                            })}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{project.name}</p>
                              <p className="text-xs text-muted-foreground">{project.location}</p>
                            </div>
                            <Badge variant="secondary" className="text-[10px] ml-2">{project.status}</Badge>
                          </div>
                        ))}
                        {projects.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-6">No projects yet</p>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Upcoming Interviews */}
                {canViewInterviews && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        Upcoming Interviews
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="max-h-[240px]">
                        <div className="space-y-1.5">
                          {upcomingInterviews.slice(0, 6).map((interview: any) => (
                            <div
                              key={interview.id}
                              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                              onClick={() => setDetailItem({
                                type: 'list',
                                title: interview.candidates?.full_name || 'Interview',
                                subtitle: `${interview.interview_type} — ${safeFormatDate(interview.scheduled_date, 'MMM d, yyyy HH:mm')}`,
                                backLabel: 'Upcoming Interviews',
                                listItems: [{
                                  title: `Type: ${interview.interview_type}`,
                                  subtitle: `Scheduled: ${safeFormatDate(interview.scheduled_date, 'MMM d, yyyy HH:mm')}`,
                                }, {
                                  title: `Status: ${interview.status}`,
                                }],
                              })}
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{interview.candidates?.full_name}</p>
                                <p className="text-xs text-muted-foreground">{interview.interview_type} — {safeFormatDate(interview.scheduled_date, 'MMM d, HH:mm')}</p>
                              </div>
                              <Badge variant="secondary" className="text-[10px] ml-2">{interview.status}</Badge>
                            </div>
                          ))}
                          {upcomingInterviews.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-6">No upcoming interviews</p>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Projects */}
            <TabsContent value="projects" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Company Projects</CardTitle>
                  <CardDescription>Recruitment projects assigned to your company</CardDescription>
                </CardHeader>
                <CardContent>
                  {projectsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : projects.length === 0 ? (
                    <div className="text-center py-12">
                      <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No projects assigned yet</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Project</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projects.map((project) => (
                          <TableRow
                            key={project.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setDetailItem({
                              type: 'project',
                              id: project.id,
                              title: project.name,
                              subtitle: project.location,
                              backLabel: 'Projects',
                              route: `/employer/projects/${project.id}`,
                              data: project,
                            })}
                          >
                            <TableCell className="font-medium">{project.name}</TableCell>
                            <TableCell>{project.location}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{project.status}</Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {safeFormatDate(project.created_at, 'MMM d, yyyy')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Candidates */}
            <TabsContent value="candidates" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Candidates</CardTitle>
                  <CardDescription>Candidates in your recruitment projects</CardDescription>
                </CardHeader>
                <CardContent>
                  {candidatesLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : candidates.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No candidates yet</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phase</TableHead>
                          <TableHead>Nationality</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {candidates.map((cw: any) => (
                          <TableRow
                            key={cw.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setDetailItem({
                              type: 'candidate',
                              id: cw.candidate_id,
                              title: cw.candidates?.full_name || 'Unknown',
                              subtitle: cw.candidates?.email,
                              backLabel: 'Candidates',
                              route: `/employer/candidates/${cw.candidate_id}`,
                              data: { ...cw.candidates, current_stage: cw.current_phase },
                            })}
                          >
                            <TableCell className="font-medium">{cw.candidates?.full_name}</TableCell>
                            <TableCell className="text-muted-foreground">{cw.candidates?.email}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{cw.current_phase}</Badge>
                            </TableCell>
                            <TableCell>{cw.candidates?.nationality || '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Interviews */}
            {canViewInterviews && (
              <TabsContent value="interviews" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Interviews</CardTitle>
                    <CardDescription>Scheduled and completed interviews</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {interviews.length === 0 ? (
                      <div className="text-center py-12">
                        <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No interviews scheduled</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Candidate</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {interviews.map((interview: any) => (
                            <TableRow key={interview.id}>
                              <TableCell className="font-medium">
                                {interview.candidates?.full_name || '—'}
                              </TableCell>
                              <TableCell>{interview.interview_type}</TableCell>
                              <TableCell>
                                {safeFormatDate(interview.scheduled_date, 'MMM d, yyyy HH:mm')}
                              </TableCell>
                              <TableCell>
                                <Badge variant={interview.status === 'completed' ? 'default' : 'secondary'}>
                                  {interview.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Company Info */}
            <TabsContent value="company" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Company Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Company Name</label>
                      <p className="font-medium">{activeCompany?.company_name || '—'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Legal Name</label>
                      <p>{activeCompany?.legal_name || '—'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Industry</label>
                      <p>{activeCompany?.industry || '—'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Headquarters</label>
                      <p>{activeCompany?.headquarters_city ? `${activeCompany.headquarters_city}, ` : ''}{activeCompany?.headquarters_country || '—'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Primary Contact</label>
                      <p>{activeCompany?.primary_contact_name || '—'}{activeCompany?.primary_contact_email ? ` (${activeCompany.primary_contact_email})` : ''}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Company Size</label>
                      <p>{activeCompany?.company_size || '—'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Website</label>
                      <p>{activeCompany?.website || '—'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <Badge variant={activeCompany?.verified ? 'default' : 'secondary'}>
                        {activeCompany?.verified ? 'Verified' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Detail Panel */}
      {detailItem && (
        <div className="w-[35%] shrink-0">
          <DashboardDetailPanel item={detailItem} onClose={() => setDetailItem(null)} routePrefix="/employer" />
        </div>
      )}
    </div>
  );
}
